"""add challenge objective tracking fields

Revision ID: 0011_challenge_obj_tracking
Revises: 0010_create_challenge_accounts
Create Date: 2026-02-19 16:26:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011_challenge_obj_tracking"
down_revision: Union[str, None] = "0010_create_challenge_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "challenge_accounts",
        sa.Column("objective_status", sa.String(length=30), nullable=False, server_default="active"),
    )
    op.add_column("challenge_accounts", sa.Column("breached_reason", sa.String(length=120), nullable=True))
    op.add_column("challenge_accounts", sa.Column("passed_stage", sa.String(length=20), nullable=True))

    op.add_column("challenge_accounts", sa.Column("initial_balance", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("dd_amount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("highest_balance", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("breach_balance", sa.Float(), nullable=False, server_default="0"))
    op.add_column(
        "challenge_accounts",
        sa.Column("profit_target_balance", sa.Float(), nullable=False, server_default="0"),
    )
    op.add_column("challenge_accounts", sa.Column("latest_balance", sa.Float(), nullable=True))
    op.add_column("challenge_accounts", sa.Column("latest_equity", sa.Float(), nullable=True))
    op.add_column(
        "challenge_accounts",
        sa.Column("scalping_violations_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.add_column("challenge_accounts", sa.Column("last_feed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("challenge_accounts", sa.Column("breached_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("challenge_accounts", sa.Column("passed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_index("ix_challenge_accounts_objective_status", "challenge_accounts", ["objective_status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_challenge_accounts_objective_status", table_name="challenge_accounts")
    op.drop_column("challenge_accounts", "passed_at")
    op.drop_column("challenge_accounts", "breached_at")
    op.drop_column("challenge_accounts", "last_feed_at")
    op.drop_column("challenge_accounts", "scalping_violations_count")
    op.drop_column("challenge_accounts", "latest_equity")
    op.drop_column("challenge_accounts", "latest_balance")
    op.drop_column("challenge_accounts", "profit_target_balance")
    op.drop_column("challenge_accounts", "breach_balance")
    op.drop_column("challenge_accounts", "highest_balance")
    op.drop_column("challenge_accounts", "dd_amount")
    op.drop_column("challenge_accounts", "initial_balance")
    op.drop_column("challenge_accounts", "passed_stage")
    op.drop_column("challenge_accounts", "breached_reason")
    op.drop_column("challenge_accounts", "objective_status")
