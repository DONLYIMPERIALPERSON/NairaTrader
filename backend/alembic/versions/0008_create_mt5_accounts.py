"""create mt5 accounts table

Revision ID: 0008_create_mt5_accounts
Revises: 0007_create_challenge_config
Create Date: 2026-02-19 13:56:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0008_create_mt5_accounts"
down_revision: Union[str, None] = "0007_create_challenge_config"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mt5_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("server", sa.String(length=120), nullable=False),
        sa.Column("account_number", sa.String(length=120), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("investor_password", sa.String(length=255), nullable=False),
        sa.Column("account_size", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="Ready"),
        sa.Column("assignment_mode", sa.String(length=20), nullable=True),
        sa.Column("assigned_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("account_number", name="uq_mt5_accounts_account_number"),
    )

    op.create_index("ix_mt5_accounts_id", "mt5_accounts", ["id"], unique=False)
    op.create_index("ix_mt5_accounts_account_number", "mt5_accounts", ["account_number"], unique=True)
    op.create_index("ix_mt5_accounts_account_size", "mt5_accounts", ["account_size"], unique=False)
    op.create_index("ix_mt5_accounts_status", "mt5_accounts", ["status"], unique=False)
    op.create_index("ix_mt5_accounts_assigned_user_id", "mt5_accounts", ["assigned_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_mt5_accounts_assigned_user_id", table_name="mt5_accounts")
    op.drop_index("ix_mt5_accounts_status", table_name="mt5_accounts")
    op.drop_index("ix_mt5_accounts_account_size", table_name="mt5_accounts")
    op.drop_index("ix_mt5_accounts_account_number", table_name="mt5_accounts")
    op.drop_index("ix_mt5_accounts_id", table_name="mt5_accounts")
    op.drop_table("mt5_accounts")
