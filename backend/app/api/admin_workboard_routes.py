from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.admin_activity import AdminActivityLog
from app.models.admin_allowlist import AdminAllowlist
from app.models.user import User

router = APIRouter(prefix="/admin/workboard", tags=["Admin Workboard"])


def log_admin_activity(
    db: Session,
    admin_id: int,
    admin_name: str,
    action: str,
    description: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    extra_data: Optional[str] = None,
):
    """Helper function to log admin activity."""
    activity = AdminActivityLog(
        admin_id=admin_id,
        admin_name=admin_name,
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        extra_data=extra_data,
    )
    db.add(activity)
    db.commit()


@router.get("/activities")
def get_admin_activities(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=10, le=200),
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    days: int = Query(7, ge=1, le=90),  # Last N days
    current_admin: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict:
    """Get paginated admin activity logs."""
    # Calculate date range
    since_date = datetime.utcnow() - timedelta(days=days)

    # Build query
    query = select(AdminActivityLog).where(AdminActivityLog.created_at >= since_date)

    if admin_id:
        query = query.where(AdminActivityLog.admin_id == admin_id)
    if action:
        query = query.where(AdminActivityLog.action == action)
    if entity_type:
        query = query.where(AdminActivityLog.entity_type == entity_type)

    # Get total count
    total = db.scalar(
        select(func.count(AdminActivityLog.id)).where(
            and_(
                AdminActivityLog.created_at >= since_date,
                AdminActivityLog.admin_id == admin_id if admin_id else True,
                AdminActivityLog.action == action if action else True,
                AdminActivityLog.entity_type == entity_type if entity_type else True,
            )
        )
    )

    # Get paginated results
    offset = (page - 1) * limit
    activities = db.scalars(
        query.order_by(desc(AdminActivityLog.created_at))
        .offset(offset)
        .limit(limit)
    ).all()

    # Format for response
    activity_list = []
    for activity in activities:
        activity_list.append({
            "id": activity.id,
            "admin_id": activity.admin_id,
            "admin_name": activity.admin_name,
            "action": activity.action,
            "description": activity.description,
            "entity_type": activity.entity_type,
            "entity_id": activity.entity_id,
            "metadata": activity.extra_data,
            "created_at": activity.created_at.isoformat(),
            "time_ago": _get_time_ago(activity.created_at),
        })

    return {
        "activities": activity_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
        },
        "filters": {
            "admin_id": admin_id,
            "action": action,
            "entity_type": entity_type,
            "days": days,
        }
    }


@router.get("/stats")
def get_admin_workboard_stats(
    days: int = Query(30, ge=1, le=90),
    current_admin: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict:
    """Get admin workboard statistics and rankings."""
    since_date = datetime.utcnow() - timedelta(days=days)

    # Get all active admins
    admins = db.scalars(
        select(AdminAllowlist).where(AdminAllowlist.status == "active")
    ).all()

    admin_stats = []

    for admin in admins:
        # Count activities by type
        activities = db.scalars(
            select(AdminActivityLog).where(
                and_(
                    AdminActivityLog.admin_id == admin.id,
                    AdminActivityLog.created_at >= since_date
                )
            )
        ).all()

        # Calculate stats
        total_actions = len(activities)

        # Group by action type
        action_counts = {}
        for activity in activities:
            action_counts[activity.action] = action_counts.get(activity.action, 0) + 1

        # Calculate performance score (weighted by action importance)
        performance_score = 0
        if total_actions > 0:
            # Weight different actions
            weights = {
                "respond_to_ticket": 2,
                "resolve_ticket": 3,
                "approve_payout": 4,
                "reject_payout": 3,
                "approve_milestone": 5,
                "reject_milestone": 3,
                "suspend_user": 3,
                "ban_user": 4,
                "update_user_status": 2,
                "send_email": 1,
                "add_note": 1,
            }

            for activity in activities:
                weight = weights.get(activity.action, 1)
                performance_score += weight

            # Bonus for high volume
            if total_actions > 50:
                performance_score *= 1.2
            elif total_actions > 20:
                performance_score *= 1.1

        # Calculate average response time (mock for now - would need actual timing data)
        avg_response_time = "8m"  # Placeholder

        admin_stats.append({
            "admin_id": admin.id,
            "admin_name": admin.full_name or admin.email,
            "role": admin.role,
            "total_actions": total_actions,
            "performance_score": round(performance_score, 1),
            "action_breakdown": action_counts,
            "avg_response_time": avg_response_time,
            "rank": 0,  # Will be set after sorting
        })

    # Sort by performance score and assign ranks
    admin_stats.sort(key=lambda x: x["performance_score"], reverse=True)
    for i, stat in enumerate(admin_stats, 1):
        stat["rank"] = i

    # Get top performer
    top_performer = admin_stats[0] if admin_stats else None

    # Get recent activities (last 24 hours)
    recent_activities = db.scalars(
        select(AdminActivityLog)
        .where(AdminActivityLog.created_at >= datetime.utcnow() - timedelta(hours=24))
        .order_by(desc(AdminActivityLog.created_at))
        .limit(10)
    ).all()

    recent_activity_list = []
    for activity in recent_activities:
        recent_activity_list.append({
            "id": activity.id,
            "admin_name": activity.admin_name,
            "action": activity.action,
            "description": activity.description,
            "time_ago": _get_time_ago(activity.created_at),
        })

    return {
        "top_performer": top_performer,
        "admin_rankings": admin_stats,
        "recent_activities": recent_activity_list,
        "summary": {
            "total_admins": len(admin_stats),
            "total_actions": sum(stat["total_actions"] for stat in admin_stats),
            "period_days": days,
        }
    }


def _get_time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable time ago string."""
    now = datetime.utcnow()
    diff = now - dt

    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds >= 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds >= 60:
        return f"{diff.seconds // 60}m ago"
    else:
        return "Just now"