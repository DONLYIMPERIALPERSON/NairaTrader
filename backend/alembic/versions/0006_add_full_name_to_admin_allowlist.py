"""add full_name to admin allowlist and seed current admin name

Revision ID: 0006_admin_allowlist_full_name
Revises: 0005_admin_mfa_enrolled
Create Date: 2026-02-19 10:37:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_admin_allowlist_full_name"
down_revision: Union[str, None] = "0005_admin_mfa_enrolled"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("admin_allowlist", sa.Column("full_name", sa.String(length=255), nullable=True))

    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE admin_allowlist
            SET full_name = :full_name
            WHERE lower(email) = :email
            """
        ),
        {"full_name": "Lucky Chi", "email": "partner@nairatrader.email"},
    )


def downgrade() -> None:
    op.drop_column("admin_allowlist", "full_name")
