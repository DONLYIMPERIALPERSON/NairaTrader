"""add stage timing and trade aggregate fields

Revision ID: 0015_stage_trade_aggs
Revises: 0014_bank_directory
Create Date: 2026-02-19 20:36:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0015_stage_trade_aggs"
down_revision: Union[str, None] = "0014_bank_directory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("challenge_accounts", sa.Column("stage_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("challenge_accounts", sa.Column("closed_trades_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("winning_trades_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("lots_traded_total", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("today_closed_pnl", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("today_trades_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("today_lots_total", sa.Float(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("challenge_accounts", "today_lots_total")
    op.drop_column("challenge_accounts", "today_trades_count")
    op.drop_column("challenge_accounts", "today_closed_pnl")
    op.drop_column("challenge_accounts", "lots_traded_total")
    op.drop_column("challenge_accounts", "winning_trades_count")
    op.drop_column("challenge_accounts", "closed_trades_count")
    op.drop_column("challenge_accounts", "stage_started_at")
