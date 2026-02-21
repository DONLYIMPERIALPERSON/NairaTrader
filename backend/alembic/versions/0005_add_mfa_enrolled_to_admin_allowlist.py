"""add mfa enrolled flag to admin allowlist

Revision ID: 0005_admin_mfa_enrolled
Revises: 0004_create_admin_allowlist
Create Date: 2026-02-18 21:50:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_admin_mfa_enrolled"
down_revision: Union[str, None] = "0004_create_admin_allowlist"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_allowlist",
        sa.Column("mfa_enrolled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("admin_allowlist", "mfa_enrolled")
