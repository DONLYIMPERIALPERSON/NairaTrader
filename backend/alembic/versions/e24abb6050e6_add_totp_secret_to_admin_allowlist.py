"""add_totp_secret_to_admin_allowlist

Revision ID: e24abb6050e6
Revises: 35dcef470376
Create Date: 2026-02-22 14:49:51.014983

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e24abb6050e6'
down_revision: Union[str, None] = '35dcef470376'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add totp_secret column to admin_allowlist table
    op.add_column('admin_allowlist', sa.Column('totp_secret', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove totp_secret column from admin_allowlist table
    op.drop_column('admin_allowlist', 'totp_secret')
