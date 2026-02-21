"""create bank directory cache table

Revision ID: 0014_bank_directory
Revises: 0013_user_bank_accounts_kyc
Create Date: 2026-02-19 19:01:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_bank_directory"
down_revision: Union[str, None] = "0013_user_bank_accounts_kyc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bank_directory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bank_code", sa.String(length=100), nullable=False),
        sa.Column("bank_name", sa.String(length=255), nullable=False),
        sa.Column("bank_url", sa.String(length=500), nullable=True),
        sa.Column("bg_url", sa.String(length=500), nullable=True),
        sa.Column("bg2_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bank_code"),
    )
    op.create_index("ix_bank_directory_id", "bank_directory", ["id"], unique=False)
    op.create_index("ix_bank_directory_bank_code", "bank_directory", ["bank_code"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bank_directory_bank_code", table_name="bank_directory")
    op.drop_index("ix_bank_directory_id", table_name="bank_directory")
    op.drop_table("bank_directory")
