"""create admin allowlist

Revision ID: 0004_create_admin_allowlist
Revises: 0003_create_pin_tables
Create Date: 2026-02-18 21:28:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0004_create_admin_allowlist"
down_revision: Union[str, None] = "0003_create_pin_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_allowlist",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("descope_user_id", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="admin"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("require_mfa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_admin_allowlist_id", "admin_allowlist", ["id"], unique=False)
    op.create_index("ix_admin_allowlist_email", "admin_allowlist", ["email"], unique=True)
    op.create_index("ix_admin_allowlist_descope_user_id", "admin_allowlist", ["descope_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_allowlist_descope_user_id", table_name="admin_allowlist")
    op.drop_index("ix_admin_allowlist_email", table_name="admin_allowlist")
    op.drop_index("ix_admin_allowlist_id", table_name="admin_allowlist")
    op.drop_table("admin_allowlist")
