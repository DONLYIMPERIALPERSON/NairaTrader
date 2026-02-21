from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.challenge_account import ChallengeAccount
from app.models.user import User


router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


def _format_currency(value: float) -> str:
    return f"₦{value:,.0f}"


@router.get("")
def list_admin_users(
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    users = db.scalars(
        select(User)
        .where(User.role == "user")
        .order_by(User.id.desc())
    ).all()

    user_ids = [user.id for user in users]
    challenge_rows = (
        db.scalars(select(ChallengeAccount).where(ChallengeAccount.user_id.in_(user_ids))).all() if user_ids else []
    )

    challenges_by_user: dict[int, list[ChallengeAccount]] = {}
    for row in challenge_rows:
        challenges_by_user.setdefault(row.user_id, []).append(row)

    rows: list[dict[str, object]] = []
    funded_users = 0
    breached_users = 0

    for user in users:
        user_challenges = challenges_by_user.get(user.id, [])

        funded_count = sum(1 for row in user_challenges if row.current_stage == "Funded")
        challenge_count = sum(1 for row in user_challenges if row.current_stage in {"Phase 1", "Phase 2"})
        orders_count = len(user_challenges)

        payout_total = sum(float(row.funded_user_payout_amount or 0) for row in user_challenges)
        revenue_total = sum(max(float((row.latest_balance or 0) - row.initial_balance), 0) for row in user_challenges)

        has_funded = funded_count > 0
        has_breached = any(row.objective_status == "breached" for row in user_challenges)
        has_active_challenge = any(
            row.current_stage in {"Phase 1", "Phase 2"} and row.objective_status == "active"
            for row in user_challenges
        )

        trading_status = "None"
        if has_funded:
            trading_status = "Funded"
            funded_users += 1
        elif has_breached:
            trading_status = "Breached"
            breached_users += 1
        elif has_active_challenge:
            trading_status = "Challenge Active"

        rows.append(
            {
                "user_id": user.id,
                "name": user.nick_name or user.full_name or user.email,
                "email": user.email,
                "status": user.status,
                "trading": trading_status,
                "accounts": f"{challenge_count} / {funded_count}",
                "revenue": _format_currency(revenue_total),
                "orders": str(orders_count),
                "payouts": _format_currency(payout_total),
            }
        )

    return {
        "users": rows,
        "stats": {
            "total_users": len(users),
            "funded_users": funded_users,
            "breached_users": breached_users,
        },
    }
