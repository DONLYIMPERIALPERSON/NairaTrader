"""add user bank accounts and user kyc status

Revision ID: 0013_user_bank_accounts_kyc
Revises: 0012_funded_rollover
Create Date: 2026-02-19 18:43:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_user_bank_accounts_kyc"
down_revision: Union[str, None] = "0012_funded_rollover"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("kyc_status", sa.String(length=30), nullable=False, server_default="not_started"))

    op.create_table(
        "user_bank_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("bank_code", sa.String(length=100), nullable=False),
        sa.Column("bank_account_number", sa.String(length=50), nullable=False),
        sa.Column("account_name", sa.String(length=255), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_bank_accounts_id", "user_bank_accounts", ["id"], unique=False)
    op.create_index("ix_user_bank_accounts_user_id", "user_bank_accounts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_bank_accounts_user_id", table_name="user_bank_accounts")
    op.drop_index("ix_user_bank_accounts_id", table_name="user_bank_accounts")
    op.drop_table("user_bank_accounts")
    op.drop_column("users", "kyc_status")
