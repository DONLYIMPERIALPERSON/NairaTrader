"""add mt5 assignment admin name

Revision ID: 0009_mt5_assign_admin_name
Revises: 0008_create_mt5_accounts
Create Date: 2026-02-19 14:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0009_mt5_assign_admin_name"
down_revision: Union[str, None] = "0008_create_mt5_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("mt5_accounts")}
    if "assigned_by_admin_name" not in columns:
        op.add_column("mt5_accounts", sa.Column("assigned_by_admin_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("mt5_accounts", "assigned_by_admin_name")
