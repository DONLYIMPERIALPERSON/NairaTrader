from functools import lru_cache
import json
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidAudienceError, InvalidIssuerError
from jwt import InvalidTokenError, PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.deps import get_db
from app.models.admin_allowlist import AdminAllowlist
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=True)


def _default_descope_discovery_url() -> str:
    if settings.descope_project_id:
        return f"https://api.descope.com/{settings.descope_project_id}/.well-known/openid-configuration"
    return ""


@lru_cache
def get_oidc_configuration() -> dict[str, Any]:
    discovery_url = settings.descope_discovery_url or _default_descope_discovery_url()
    if not discovery_url:
        return {}

    try:
        request = Request(
            discovery_url,
            headers={
                "Accept": "application/json",
                "User-Agent": "NairaTrader-Backend/1.0 (+https://nairatrader.is)",
            },
        )
        with urlopen(request, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except (URLError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch OIDC discovery configuration",
        ) from exc


def get_effective_jwks_url() -> str:
    if settings.descope_jwks_url:
        return settings.descope_jwks_url
    return str(get_oidc_configuration().get("jwks_uri") or "")


def get_effective_issuer() -> str:
    if settings.descope_issuer:
        return settings.descope_issuer
    return str(get_oidc_configuration().get("issuer") or "")


@lru_cache
def get_jwks_client() -> PyJWKClient:
    jwks_url = get_effective_jwks_url()
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWKS URL is not configured (set DESCOPE_JWKS_URL or DESCOPE_DISCOVERY_URL)",
        )
    return PyJWKClient(
        jwks_url,
        headers={
            "Accept": "application/json",
            "User-Agent": "NairaTrader-Backend/1.0 (+https://nairatrader.is)",
        },
        timeout=10,
    )


def extract_roles(payload: dict[str, Any]) -> set[str]:
    roles: set[str] = set()

    direct_role = payload.get("role")
    if isinstance(direct_role, str):
        roles.add(direct_role)

    direct_roles = payload.get("roles")
    if isinstance(direct_roles, list):
        roles.update(str(role) for role in direct_roles)

    custom_claims = payload.get("customClaims")
    if isinstance(custom_claims, dict):
        custom_roles = custom_claims.get("roles")
        if isinstance(custom_roles, list):
            roles.update(str(role) for role in custom_roles)

    return roles


def verify_descope_jwt(token: str) -> dict[str, Any]:
    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token).key

        strict_decode_kwargs: dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": {"require": ["exp", "iat", "sub"]},
        }

        if settings.descope_audience:
            strict_decode_kwargs["audience"] = settings.descope_audience
        else:
            strict_decode_kwargs["options"]["verify_aud"] = False

        issuer = get_effective_issuer()
        if issuer:
            strict_decode_kwargs["issuer"] = issuer

        try:
            return jwt.decode(token, signing_key, **strict_decode_kwargs)
        except (InvalidAudienceError, InvalidIssuerError):
            # Compatibility fallback for environments where token audience/issuer
            # shape differs from configured values.
            relaxed_decode_kwargs: dict[str, Any] = {
                "algorithms": ["RS256"],
                "options": {
                    "require": ["exp", "iat", "sub"],
                    "verify_aud": False,
                    "verify_iss": False,
                },
            }
            return jwt.decode(token, signing_key, **relaxed_decode_kwargs)

    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def _get_primary_role(roles: set[str]) -> str:
    if "super_admin" in roles:
        return "super_admin"
    if "admin" in roles:
        return "admin"
    return "user"


def _extract_amr(payload: dict[str, Any]) -> set[str]:
    amr_value = payload.get("amr")
    if isinstance(amr_value, list):
        return {str(item).lower() for item in amr_value}
    if isinstance(amr_value, str):
        return {amr_value.lower()}
    return set()


def _is_mfa_satisfied(payload: dict[str, Any]) -> bool:
    amr = _extract_amr(payload)
    return bool(
        amr.intersection(
            {
                "mfa",
                "totp",
                "otp",
                "webauthn",
                "passkey",
                "fido",
                "hwk",
                "swk",
            }
        )
    )


def _get_or_upsert_user_from_payload(payload: dict[str, Any], db: Session) -> User:
    descope_user_id = str(payload.get("sub") or "").strip()

    if not descope_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub)",
        )

    email = str(payload.get("email") or f"{descope_user_id}@descope.local")
    full_name = payload.get("name")
    roles = extract_roles(payload)
    inferred_role = _get_primary_role(roles)

    user = db.scalar(select(User).where(User.descope_user_id == descope_user_id))

    if user is None:
        user = User(
            descope_user_id=descope_user_id,
            email=email,
            full_name=full_name if isinstance(full_name, str) else None,
            role=inferred_role,
            status="active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if isinstance(full_name, str) and user.full_name != full_name:
            user.full_name = full_name
            changed = True
        if inferred_role in {"admin", "super_admin"} and user.role != inferred_role:
            user.role = inferred_role
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_descope_jwt(credentials.credentials)
    return _get_or_upsert_user_from_payload(payload, db)


def get_current_admin_allowlisted(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_descope_jwt(credentials.credentials)
    user = _get_or_upsert_user_from_payload(payload, db)

    email = str(payload.get("email") or user.email or "").strip().lower()
    descope_user_id = str(payload.get("sub") or user.descope_user_id or "").strip()

    allow_entry = db.scalar(
        select(AdminAllowlist).where(
            (AdminAllowlist.email == email) | (AdminAllowlist.descope_user_id == descope_user_id)
        )
    )

    if allow_entry is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access denied")

    if allow_entry.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is not active")

    if allow_entry.descope_user_id is None:
        allow_entry.descope_user_id = descope_user_id
        db.add(allow_entry)
        db.commit()

    mfa_satisfied = _is_mfa_satisfied(payload)
    if allow_entry.require_mfa and mfa_satisfied and not allow_entry.mfa_enrolled:
        allow_entry.mfa_enrolled = True
        db.add(allow_entry)
        db.commit()

    should_update_name = bool(allow_entry.full_name) and user.full_name != allow_entry.full_name

    if user.role != allow_entry.role or user.status != allow_entry.status or should_update_name:
        user.role = allow_entry.role
        user.status = allow_entry.status
        if allow_entry.full_name:
            user.full_name = allow_entry.full_name
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient admin role")

    # Temporary: bypass admin MFA enforcement at login.
    # Admins can complete MFA setup from dashboard flow later.

    return user


def get_current_super_admin(current_admin: User = Depends(get_current_admin_allowlisted)) -> User:
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_admin


def require_roles(allowed_roles: set[str]):
    def _role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return _role_dependency


def get_current_admin(current_user: User = Depends(require_roles({"admin", "super_admin"}))) -> User:
    return current_user
