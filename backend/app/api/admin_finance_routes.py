from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select, and_, or_, desc
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.challenge_account import ChallengeAccount
from app.models.payment_order import PaymentOrder
from app.models.user import User
from app.models.support import SupportChat
from app.models.affiliate import AffiliatePayout
from app.models.migration_request import MigrationRequest

router = APIRouter(prefix="/admin/finance", tags=["Admin Finance"])


@router.get("/monthly-stats")
def get_monthly_finance_stats(
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, list[dict[str, str]]]:
    """
    Get monthly finance statistics for the last 3 months.
    Returns total purchases and total payouts for each month.
    """
    # Get current date
    now = datetime.now()

    # Calculate monthly purchase totals (from paid payment orders)
    purchase_query = (
        select(
            extract('year', PaymentOrder.paid_at).label('year'),
            extract('month', PaymentOrder.paid_at).label('month'),
            func.sum(PaymentOrder.net_amount_kobo).label('total_purchase_kobo')
        )
        .where(PaymentOrder.status == 'paid')
        .where(PaymentOrder.paid_at.isnot(None))
        .group_by(extract('year', PaymentOrder.paid_at), extract('month', PaymentOrder.paid_at))
        .order_by(extract('year', PaymentOrder.paid_at).desc(), extract('month', PaymentOrder.paid_at).desc())
        .limit(3)
    )

    purchase_results = db.execute(purchase_query).all()

    # Calculate monthly payout totals (from funded accounts)
    payout_query = (
        select(
            extract('year', ChallengeAccount.updated_at).label('year'),
            extract('month', ChallengeAccount.updated_at).label('month'),
            func.sum(ChallengeAccount.funded_user_payout_amount).label('total_payout')
        )
        .where(ChallengeAccount.current_stage == 'Funded')
        .where(ChallengeAccount.funded_user_payout_amount > 0)
        .group_by(extract('year', ChallengeAccount.updated_at), extract('month', ChallengeAccount.updated_at))
        .order_by(extract('year', ChallengeAccount.updated_at).desc(), extract('month', ChallengeAccount.updated_at).desc())
        .limit(3)
    )

    payout_results = db.execute(payout_query).all()

    # Create a map of year-month to data
    monthly_data = {}

    # Process purchase data
    for row in purchase_results:
        year, month = int(row.year), int(row.month)
        month_key = f"{year}-{month:02d}"
        total_purchase = row.total_purchase_kobo or 0
        total_purchase_naira = total_purchase / 100  # Convert kobo to naira

        monthly_data[month_key] = {
            'month': f"{month:02d}/{year}",
            'totalPurchase': f"₦{total_purchase_naira:,.0f}",
            'totalPayouts': '₦0'  # Default, will be updated if payout data exists
        }

    # Process payout data
    for row in payout_results:
        year, month = int(row.year), int(row.month)
        month_key = f"{year}-{month:02d}"
        total_payout = row.total_payout or 0

        if month_key in monthly_data:
            monthly_data[month_key]['totalPayouts'] = f"₦{total_payout:,.0f}"
        else:
            monthly_data[month_key] = {
                'month': f"{month:02d}/{year}",
                'totalPurchase': '₦0',
                'totalPayouts': f"₦{total_payout:,.0f}"
            }

    # Convert to list and sort by most recent first
    result = list(monthly_data.values())
    result.sort(key=lambda x: x['month'], reverse=True)

    # Ensure we have at least 3 months of data (fill with zeros if needed)
    while len(result) < 3:
        # Add previous month with zero values
        if result:
            last_month = result[-1]['month']
            month_num, year = last_month.split('/')
            prev_month = int(month_num) - 1
            prev_year = int(year)
            if prev_month == 0:
                prev_month = 12
                prev_year -= 1
            result.append({
                'month': f"{prev_month:02d}/{prev_year}",
                'totalPurchase': '₦0',
                'totalPayouts': '₦0'
            })
        else:
            # If no data at all, add current month
            current_month = now.strftime("%m/%Y")
            result.append({
                'month': current_month,
                'totalPurchase': '₦0',
                'totalPayouts': '₦0'
            })

    return {"monthlyFinance": result[:3]}


@router.get("/dashboard-stats")
def get_dashboard_stats(
    _: User = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Get comprehensive dashboard statistics for admin overview.
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Total Revenue (from paid payment orders)
    total_revenue_result = db.scalar(
        select(func.sum(PaymentOrder.net_amount_kobo))
        .where(PaymentOrder.status == 'paid')
        .where(PaymentOrder.paid_at.isnot(None))
    )
    total_revenue = (total_revenue_result or 0) / 100  # Convert kobo to naira

    # Today's Sales
    today_sales_result = db.scalar(
        select(func.sum(PaymentOrder.net_amount_kobo))
        .where(PaymentOrder.status == 'paid')
        .where(PaymentOrder.paid_at >= today_start)
    )
    today_sales = (today_sales_result or 0) / 100

    # Yesterday's Sales (for comparison)
    yesterday_sales_result = db.scalar(
        select(func.sum(PaymentOrder.net_amount_kobo))
        .where(PaymentOrder.status == 'paid')
        .where(PaymentOrder.paid_at >= yesterday_start)
        .where(PaymentOrder.paid_at < today_start)
    )
    yesterday_sales = (yesterday_sales_result or 0) / 100

    # Total Payouts (from funded accounts)
    total_payouts_result = db.scalar(
        select(func.sum(ChallengeAccount.funded_user_payout_amount))
        .where(ChallengeAccount.current_stage == 'Funded')
        .where(ChallengeAccount.funded_user_payout_amount > 0)
    )
    total_payouts = total_payouts_result or 0

    # New Signups (users who made their first payment in last 30 days)
    new_signups = db.scalar(
        select(func.count(func.distinct(PaymentOrder.user_id)))
        .where(PaymentOrder.paid_at >= month_ago)
    ) or 0

    # Previous period signups (31-60 days ago)
    prev_signups = db.scalar(
        select(func.count(func.distinct(PaymentOrder.user_id)))
        .where(PaymentOrder.paid_at >= month_ago - timedelta(days=30))
        .where(PaymentOrder.paid_at < month_ago)
    ) or 0

    # Active Challenge Accounts
    active_challenge_accounts = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage.in_(['Phase 1', 'Phase 2']))
    ) or 0

    # Previous active accounts (using updated_at as proxy)
    prev_active_accounts = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage.in_(['Phase 1', 'Phase 2']))
        .where(ChallengeAccount.updated_at < month_ago)
    ) or 0

    # Pass Rate (funded accounts / total completed challenges)
    total_completed = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage.in_(['Funded', 'Failed']))
    ) or 1  # Avoid division by zero

    funded_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Funded')
    ) or 0

    pass_rate = (funded_count / total_completed) * 100 if total_completed > 0 else 0

    # Pending Payout Requests
    pending_payouts_count = db.scalar(
        select(func.count(AffiliatePayout.id))
        .where(AffiliatePayout.status == 'pending')
    ) or 0

    pending_payouts_sum = db.scalar(
        select(func.sum(AffiliatePayout.amount))
        .where(AffiliatePayout.status == 'pending')
    ) or 0

    # Today's Approved Payouts
    today_approved_count = db.scalar(
        select(func.count(AffiliatePayout.id))
        .where(AffiliatePayout.status == 'approved')
        .where(AffiliatePayout.approved_at >= today_start)
    ) or 0

    today_approved_sum = db.scalar(
        select(func.sum(AffiliatePayout.amount))
        .where(AffiliatePayout.status == 'approved')
        .where(AffiliatePayout.approved_at >= today_start)
    ) or 0

    # Operations Queues
    # Support tickets
    open_tickets = db.scalar(
        select(func.count(SupportChat.id))
        .where(SupportChat.status == 'open')
    ) or 0

    oldest_ticket_hours = db.scalar(
        select(func.extract('epoch', func.now() - func.min(SupportChat.created_at)) / 3600)
        .where(SupportChat.status == 'open')
    ) or 0

    # Pending migration requests
    pending_migrations = db.scalar(
        select(func.count(MigrationRequest.id))
        .where(MigrationRequest.status == 'pending')
    ) or 0

    oldest_migration_hours = db.scalar(
        select(func.extract('epoch', func.now() - func.min(MigrationRequest.created_at)) / 3600)
        .where(MigrationRequest.status == 'pending')
    ) or 0

    # Challenge Outcomes
    passed_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Funded')
    ) or 0

    failed_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Failed')
    ) or 0

    expired_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Expired')
    ) or 0

    # Account Counts by Stage
    ready_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Ready')
    ) or 0

    phase1_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Phase 1')
    ) or 0

    phase2_count = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Phase 2')
    ) or 0

    funded_count_total = db.scalar(
        select(func.count(ChallengeAccount.id))
        .where(ChallengeAccount.current_stage == 'Funded')
    ) or 0

    # Calculate percentage changes
    def calc_percent_change(current: float, previous: float) -> float:
        if previous == 0:
            return 0
        return ((current - previous) / previous) * 100

    revenue_change = calc_percent_change(total_revenue, total_revenue * 0.88)  # Mock previous period
    today_sales_change = calc_percent_change(today_sales, yesterday_sales) if yesterday_sales > 0 else 0
    payouts_change = calc_percent_change(total_payouts, total_payouts * 0.94)  # Mock previous period
    signups_change = calc_percent_change(new_signups, prev_signups) if prev_signups > 0 else 0
    active_accounts_change = calc_percent_change(active_challenge_accounts, prev_active_accounts) if prev_active_accounts > 0 else 0
    pass_rate_change = 1.9  # Mock change for now

    return {
        "kpis": {
            "totalRevenue": f"₦{total_revenue:,.0f}",
            "totalRevenueChange": revenue_change,
            "todaySales": f"₦{today_sales:,.0f}",
            "todaySalesChange": today_sales_change,
            "totalPayouts": f"₦{total_payouts:,.0f}",
            "totalPayoutsChange": payouts_change,
            "newSignups": new_signups,
            "newSignupsChange": signups_change,
            "activeChallengeAccounts": active_challenge_accounts,
            "activeChallengeAccountsChange": active_accounts_change,
            "passRate": f"{pass_rate:.1f}%",
            "passRateChange": pass_rate_change,
            "pendingPayoutRequests": f"{pending_payouts_count} (₦{pending_payouts_sum:,.0f})",
            "pendingPayoutRequestsChange": 4.6,  # Mock
            "todayApprovedPayouts": f"{today_approved_count} (₦{today_approved_sum:,.0f})",
            "todayApprovedPayoutsChange": 6.3,  # Mock
        },
        "operationsQueues": {
            "payoutsPendingReview": pending_payouts_count,
            "payoutsOldestHours": int(oldest_ticket_hours),
            "supportTicketsOpen": open_tickets,
            "supportTicketsOldestHours": int(oldest_ticket_hours),
            "migrationRequestsPending": pending_migrations,
            "migrationRequestsOldestHours": int(oldest_migration_hours),
            "provisioningFailures": 7,  # Mock for now
            "webhookFailures": 11,  # Mock for now
        },
        "challengeOutcomes": {
            "passed": passed_count,
            "failed": failed_count,
            "expired": expired_count,
        },
        "accountCounts": {
            "ready": ready_count,
            "phase1": phase1_count,
            "phase2": phase2_count,
            "funded": funded_count_total,
        },
        "supportOverview": {
            "openTickets": open_tickets,
            "avgFirstResponse": "1h 28m",  # Mock for now
            "avgResolution": "9h 14m",  # Mock for now
        },
        "systemHealth": {
            "brokerBridge": "Connected",
            "tradeIngestionLag": "4m",
            "webhooksSuccess": "98.6%",
            "emailBounce": "2.8%",
            "kycProvider": "Up",
        }
    }
