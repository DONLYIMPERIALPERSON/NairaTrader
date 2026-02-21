from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.admin_allowlist import AdminAllowlist
from app.models.payment_order import PaymentOrder
from app.models.user import User

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


@router.get("/stats")
def get_orders_stats(
    period: Literal["today", "week", "month"] = Query("today", description="Time period for stats"),
    current_admin: AdminAllowlist = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    now = datetime.now(timezone.utc)

    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    else:  # month
        start_date = now - timedelta(days=30)

    # Base query for the period
    period_query = select(PaymentOrder).where(PaymentOrder.created_at >= start_date)

    # Total orders in period
    total_orders = db.scalar(
        select(func.count(PaymentOrder.id)).where(PaymentOrder.created_at >= start_date)
    ) or 0

    # Paid orders in period
    paid_orders = db.scalar(
        select(func.count(PaymentOrder.id)).where(
            PaymentOrder.created_at >= start_date,
            PaymentOrder.status == "paid"
        )
    ) or 0

    # Pending orders (not paid, not failed, not expired)
    pending_orders = db.scalar(
        select(func.count(PaymentOrder.id)).where(
            PaymentOrder.created_at >= start_date,
            PaymentOrder.status.in_(["pending", "created"])
        )
    ) or 0

    # Failed/Expired orders
    failed_orders = db.scalar(
        select(func.count(PaymentOrder.id)).where(
            PaymentOrder.created_at >= start_date,
            PaymentOrder.status.in_(["failed", "expired"])
        )
    ) or 0

    # Total volume (paid orders)
    total_volume_kobo = db.scalar(
        select(func.sum(PaymentOrder.net_amount_kobo)).where(
            PaymentOrder.created_at >= start_date,
            PaymentOrder.status == "paid"
        )
    ) or 0

    # Success rate
    success_rate = (paid_orders / total_orders * 100) if total_orders > 0 else 0

    return {
        "period": period,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "failed_orders": failed_orders,
        "total_volume_kobo": total_volume_kobo,
        "total_volume_formatted": f"₦{(total_volume_kobo / 100):,.0f}",
        "success_rate": round(success_rate, 1),
        "success_rate_formatted": f"{round(success_rate, 1)}%",
    }


@router.get("")
def get_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    period: Literal["today", "week", "month"] = Query("today", description="Time period filter"),
    status_filter: str | None = Query(None, description="Filter by status"),
    search: str | None = Query(None, description="Search by order ID, user name, or email"),
    current_admin: AdminAllowlist = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    # Calculate start date based on period
    now = datetime.now(timezone.utc)
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    else:  # month
        start_date = now - timedelta(days=30)

    # Base query with period filter
    query = select(
        PaymentOrder,
        User.full_name,
        User.email,
    ).join(User, PaymentOrder.user_id == User.id).where(PaymentOrder.created_at >= start_date)

    # Apply filters
    if status_filter:
        query = query.where(PaymentOrder.status == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            PaymentOrder.provider_order_id.ilike(search_term) |
            User.full_name.ilike(search_term) |
            User.email.ilike(search_term)
        )

    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    # Apply pagination and ordering
    query = query.order_by(PaymentOrder.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    results = db.execute(query).all()

    # Format results
    orders = []
    for payment_order, user_name, user_email in results:
        orders.append({
            "id": payment_order.id,
            "provider_order_id": payment_order.provider_order_id,
            "status": payment_order.status,
            "assignment_status": payment_order.assignment_status,
            "account_size": payment_order.account_size,
            "net_amount_kobo": payment_order.net_amount_kobo,
            "net_amount_formatted": f"₦{(payment_order.net_amount_kobo / 100):,.0f}",
            "created_at": payment_order.created_at.isoformat() if payment_order.created_at else None,
            "paid_at": payment_order.paid_at.isoformat() if payment_order.paid_at else None,
            "user": {
                "id": payment_order.user_id,
                "name": user_name or "Unknown",
                "email": user_email,
            },
            "challenge_id": payment_order.challenge_id,
        })

    return {
        "orders": orders,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit,
        },
    }


@router.get("/pending-assignments")
def get_pending_assignments(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    current_admin: AdminAllowlist = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    # Query for payment orders that are paid but awaiting account assignment
    query = select(
        PaymentOrder,
        User.full_name,
        User.email,
    ).join(User, PaymentOrder.user_id == User.id).where(
        PaymentOrder.status == "paid",
        PaymentOrder.assignment_status == "awaiting_account"
    )

    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    # Apply pagination and ordering
    query = query.order_by(PaymentOrder.paid_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    results = db.execute(query).all()

    # Format results
    orders = []
    for payment_order, user_name, user_email in results:
        orders.append({
            "id": payment_order.id,
            "provider_order_id": payment_order.provider_order_id,
            "status": payment_order.status,
            "assignment_status": payment_order.assignment_status,
            "account_size": payment_order.account_size,
            "net_amount_kobo": payment_order.net_amount_kobo,
            "net_amount_formatted": f"₦{(payment_order.net_amount_kobo / 100):,.0f}",
            "created_at": payment_order.created_at.isoformat() if payment_order.created_at else None,
            "paid_at": payment_order.paid_at.isoformat() if payment_order.paid_at else None,
            "user": {
                "id": payment_order.user_id,
                "name": user_name or "Unknown",
                "email": user_email,
            },
            "challenge_id": payment_order.challenge_id,
        })

    return {
        "orders": orders,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit,
        },
    }
