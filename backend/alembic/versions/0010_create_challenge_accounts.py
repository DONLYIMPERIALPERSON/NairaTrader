"""create challenge accounts table

Revision ID: 0010_create_challenge_accounts
Revises: 0009_mt5_assign_admin_name
Create Date: 2026-02-19 15:08:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0010_create_challenge_accounts"
down_revision: Union[str, None] = "0009_mt5_assign_admin_name"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "challenge_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("challenge_id", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_size", sa.String(length=120), nullable=False),
        sa.Column("current_stage", sa.String(length=20), nullable=False, server_default="Phase 1"),
        sa.Column("phase1_mt5_account_id", sa.Integer(), sa.ForeignKey("mt5_accounts.id"), nullable=True),
        sa.Column("phase2_mt5_account_id", sa.Integer(), sa.ForeignKey("mt5_accounts.id"), nullable=True),
        sa.Column("funded_mt5_account_id", sa.Integer(), sa.ForeignKey("mt5_accounts.id"), nullable=True),
        sa.Column("active_mt5_account_id", sa.Integer(), sa.ForeignKey("mt5_accounts.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("challenge_id", name="uq_challenge_accounts_challenge_id"),
    )

    op.create_index("ix_challenge_accounts_id", "challenge_accounts", ["id"], unique=False)
    op.create_index("ix_challenge_accounts_challenge_id", "challenge_accounts", ["challenge_id"], unique=True)
    op.create_index("ix_challenge_accounts_user_id", "challenge_accounts", ["user_id"], unique=False)
    op.create_index("ix_challenge_accounts_current_stage", "challenge_accounts", ["current_stage"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_challenge_accounts_current_stage", table_name="challenge_accounts")
    op.drop_index("ix_challenge_accounts_user_id", table_name="challenge_accounts")
    op.drop_index("ix_challenge_accounts_challenge_id", table_name="challenge_accounts")
    op.drop_index("ix_challenge_accounts_id", table_name="challenge_accounts")
    op.drop_table("challenge_accounts")
