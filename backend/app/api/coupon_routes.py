from datetime import datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted, get_current_user
from app.db.deps import get_db
from app.models.challenge_config import ChallengeConfig
from app.models.coupon import Coupon
from app.models.user import User
from app.schemas.coupon import (
    CouponCreateRequest,
    CouponPlanToggleRequest,
    CouponPreviewRequest,
    CouponPreviewResponse,
    CouponResolutionResult,
    CouponResponse,
    CouponStatusUpdateRequest,
)


router = APIRouter(tags=["Coupons"])

CHALLENGE_CONFIG_KEY = "public_challenge_plans"


def _parse_naira_amount(value: str) -> float:
    cleaned = re.sub(r"[^0-9.]", "", value)
    if not cleaned:
        return 0.0
    return float(cleaned)


def _format_naira(amount: float) -> str:
    if abs(amount - round(amount)) < 0.000001:
        return f"₦{amount:,.0f}"
    return f"₦{amount:,.2f}"


def _format_naira_from_kobo(amount_kobo: int) -> str:
    return _format_naira(amount_kobo / 100)


def _get_plan_price_map(db: Session) -> dict[str, float]:
    row = db.scalar(select(ChallengeConfig).where(ChallengeConfig.config_key == CHALLENGE_CONFIG_KEY))
    if row is None or not isinstance(row.config_value, list):
        return {}

    prices: dict[str, float] = {}
    for item in row.config_value:
        if not isinstance(item, dict):
            continue
        plan_id = str(item.get("id") or "").strip()
        price = str(item.get("price") or "")
        if not plan_id:
            continue
        prices[plan_id] = _parse_naira_amount(price)
    return prices


def _is_expired(coupon: Coupon, now: datetime) -> bool:
    if not coupon.is_active:
        return True
    if coupon.expires_at and coupon.expires_at <= now:
        return True
    if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
        return True
    return False


def _is_applicable_to_plan(coupon: Coupon, plan_id: str) -> bool:
    if not coupon.applicable_plan_ids:
        return True
    return plan_id in coupon.applicable_plan_ids


def _calculate_discount(original_amount: float, coupon: Coupon) -> tuple[float, float]:
    if coupon.discount_type == "percent":
        discount_amount = original_amount * (coupon.discount_value / 100)
    else:
        discount_amount = coupon.discount_value

    discount_amount = max(0.0, min(discount_amount, original_amount))
    final_amount = max(0.0, original_amount - discount_amount)
    return round(discount_amount, 2), round(final_amount, 2)


def resolve_coupon_amount_for_plan(
    db: Session,
    *,
    plan_id: str,
    coupon_code: str | None,
    original_amount_kobo: int,
) -> CouponResolutionResult:
    if original_amount_kobo <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid amount")

    if not coupon_code or not coupon_code.strip():
        return CouponResolutionResult(
            code=None,
            discount_amount_kobo=0,
            final_amount_kobo=original_amount_kobo,
            formatted_discount_amount=_format_naira_from_kobo(0),
            formatted_final_amount=_format_naira_from_kobo(original_amount_kobo),
        )

    code = coupon_code.strip().upper()
    coupon = db.scalar(select(Coupon).where(func.lower(Coupon.code) == code.lower()))
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    now = datetime.now(timezone.utc)
    if _is_expired(coupon, now):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon is not active")
    if not _is_applicable_to_plan(coupon, plan_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon does not apply to this account size")

    original_amount = original_amount_kobo / 100
    discount_amount, final_amount = _calculate_discount(original_amount, coupon)
    discount_kobo = int(round(discount_amount * 100))
    final_kobo = int(round(final_amount * 100))

    return CouponResolutionResult(
        code=coupon.code,
        discount_amount_kobo=discount_kobo,
        final_amount_kobo=final_kobo,
        formatted_discount_amount=_format_naira(discount_amount),
        formatted_final_amount=_format_naira(final_amount),
    )


def _serialize_coupon(coupon: Coupon) -> CouponResponse:
    now = datetime.now(timezone.utc)
    is_expired = _is_expired(coupon, now)
    status_text = "Expired" if is_expired else "Active"
    # Auto-deactivate expired coupons
    if is_expired and coupon.is_active:
        coupon.is_active = False
    return CouponResponse(
        id=coupon.id,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=float(coupon.discount_value),
        is_active=bool(coupon.is_active),
        expires_at=coupon.expires_at.isoformat() if coupon.expires_at else None,
        max_uses=coupon.max_uses,
        used_count=coupon.used_count,
        applicable_plan_ids=list(coupon.applicable_plan_ids or []),
        applies_to_all_plans=not bool(coupon.applicable_plan_ids),
        status=status_text,
    )


@router.get("/admin/coupons")
def list_admin_coupons(
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, list[CouponResponse]]:
    rows = db.scalars(select(Coupon).order_by(Coupon.id.desc())).all()
    coupons = []
    for row in rows:
        coupon_response = _serialize_coupon(row)
        # Save the coupon if it was auto-deactivated
        if not row.is_active and row in db:
            db.add(row)
        coupons.append(coupon_response)
    db.commit()
    return {"coupons": coupons}


@router.post("/admin/coupons")
def create_admin_coupon(
    payload: CouponCreateRequest,
    current_admin: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> CouponResponse:
    code = payload.code.strip().upper()
    exists = db.scalar(select(Coupon).where(func.lower(Coupon.code) == code.lower()))
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon code already exists")

    plan_price_map = _get_plan_price_map(db)
    if payload.apply_all_plans:
        applicable_plan_ids: list[str] = []
    else:
        applicable_plan_ids = sorted({plan_id.strip() for plan_id in payload.applicable_plan_ids if plan_id.strip()})
        if not applicable_plan_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one account size")
        unknown_ids = [plan_id for plan_id in applicable_plan_ids if plan_id not in plan_price_map]
        if unknown_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown plan id(s): {', '.join(unknown_ids)}",
            )

    coupon = Coupon(
        code=code,
        discount_type=payload.discount_type,
        discount_value=float(payload.discount_value),
        is_active=True,
        expires_at=payload.expires_at,
        max_uses=payload.max_uses,
        used_count=0,
        applicable_plan_ids=applicable_plan_ids,
        created_by_user_id=current_admin.id,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return _serialize_coupon(coupon)


@router.patch("/admin/coupons/{coupon_id}/status")
def update_admin_coupon_status(
    coupon_id: int,
    payload: CouponStatusUpdateRequest,
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> CouponResponse:
    coupon = db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    coupon.is_active = payload.is_active
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return _serialize_coupon(coupon)


@router.patch("/admin/coupons/{coupon_id}/plans")
def toggle_admin_coupon_plan(
    coupon_id: int,
    payload: CouponPlanToggleRequest,
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> CouponResponse:
    coupon = db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    plan_id = payload.plan_id.strip()
    if not plan_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan id")

    plan_price_map = _get_plan_price_map(db)
    if plan_id not in plan_price_map:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown plan id")

    current = list(coupon.applicable_plan_ids or [])
    if not current:
        current = sorted(plan_price_map.keys())

    if payload.enabled and plan_id not in current:
        current.append(plan_id)
    if not payload.enabled:
        current = [item for item in current if item != plan_id]

    coupon.applicable_plan_ids = sorted(set(current))
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return _serialize_coupon(coupon)


@router.get("/coupons")
def list_public_coupons(
    db: Session = Depends(get_db),
) -> dict[str, list[CouponResponse]]:
    now = datetime.now(timezone.utc)
    rows = db.scalars(
        select(Coupon)
        .where(Coupon.is_active == True)
        .order_by(Coupon.id.desc())
    ).all()

    # Filter out expired coupons
    active_coupons = [row for row in rows if not _is_expired(row, now)]
    return {"coupons": [_serialize_coupon(row) for row in active_coupons]}


@router.post("/checkout/coupons/preview", response_model=CouponPreviewResponse)
def preview_coupon_for_checkout(
    payload: CouponPreviewRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CouponPreviewResponse:
    code = payload.code.strip().upper()
    plan_id = payload.plan_id.strip()

    coupon = db.scalar(select(Coupon).where(func.lower(Coupon.code) == code.lower()))
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    now = datetime.now(timezone.utc)
    if _is_expired(coupon, now):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon is not active")

    if not _is_applicable_to_plan(coupon, plan_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon does not apply to this account size")

    plan_price_map = _get_plan_price_map(db)
    original_amount = plan_price_map.get(plan_id)
    if original_amount is None or original_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid account size")

    discount_amount, final_amount = _calculate_discount(original_amount, coupon)

    return CouponPreviewResponse(
        code=coupon.code,
        plan_id=plan_id,
        original_amount=original_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        formatted_original_amount=_format_naira(original_amount),
        formatted_discount_amount=_format_naira(discount_amount),
        formatted_final_amount=_format_naira(final_amount),
    )
