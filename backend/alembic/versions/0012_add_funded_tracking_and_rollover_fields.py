"""add funded tracking and rollover fields

Revision ID: 0012_funded_rollover
Revises: 0011_challenge_obj_tracking
Create Date: 2026-02-19 17:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_funded_rollover"
down_revision: Union[str, None] = "0011_challenge_obj_tracking"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("challenge_accounts", sa.Column("last_withdrawn_mt5_account_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_challenge_accounts_last_withdrawn_mt5_account_id",
        "challenge_accounts",
        "mt5_accounts",
        ["last_withdrawn_mt5_account_id"],
        ["id"],
    )

    op.add_column("challenge_accounts", sa.Column("funded_profit_raw", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("funded_profit_capped", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("funded_profit_cap_amount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("funded_user_payout_amount", sa.Float(), nullable=False, server_default="0"))
    op.add_column("challenge_accounts", sa.Column("withdrawal_count", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("challenge_accounts", "withdrawal_count")
    op.drop_column("challenge_accounts", "funded_user_payout_amount")
    op.drop_column("challenge_accounts", "funded_profit_cap_amount")
    op.drop_column("challenge_accounts", "funded_profit_capped")
    op.drop_column("challenge_accounts", "funded_profit_raw")
    op.drop_constraint("fk_challenge_accounts_last_withdrawn_mt5_account_id", "challenge_accounts", type_="foreignkey")
    op.drop_column("challenge_accounts", "last_withdrawn_mt5_account_id")
