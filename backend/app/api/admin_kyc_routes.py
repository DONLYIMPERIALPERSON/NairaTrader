from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.challenge_account import ChallengeAccount
from app.models.user import User


router = APIRouter(prefix="/admin/kyc", tags=["Admin KYC"])


@router.get("/profiles")
def list_kyc_eligible_profiles(
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    users = db.scalars(select(User).where(User.role == "user")).all()
    user_ids = [user.id for user in users]
    challenge_rows = (
        db.scalars(select(ChallengeAccount).where(ChallengeAccount.user_id.in_(user_ids))).all() if user_ids else []
    )

    challenges_by_user: dict[int, list[ChallengeAccount]] = {}
    for row in challenge_rows:
        challenges_by_user.setdefault(row.user_id, []).append(row)

    profiles: list[dict[str, object]] = []
    now = datetime.utcnow()
    today_eligible = 0

    for user in users:
        user_challenges = challenges_by_user.get(user.id, [])
        funded = [
            row
            for row in user_challenges
            if row.current_stage == "Funded" or row.funded_mt5_account_id is not None
        ]
        if not funded:
            continue

        eligible_since = min(
            (row.passed_at or row.updated_at or row.created_at for row in funded),
            default=None,
        )

        if eligible_since and eligible_since.date() == now.date():
            today_eligible += 1

        profiles.append(
            {
                "user_id": user.id,
                "name": user.nick_name or user.full_name or user.email,
                "email": user.email,
                "status": "Eligible",
                "eligible_since": eligible_since.isoformat() if eligible_since else None,
                "funded_accounts": len(funded),
                "total_challenge_accounts": len(user_challenges),
            }
        )

    profiles.sort(key=lambda row: row.get("eligible_since") or "", reverse=True)

    return {
        "profiles": profiles,
        "stats": {
            "eligible_profiles": len(profiles),
            "today_eligible": today_eligible,
        },
    }
