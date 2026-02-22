"""add_password_hash_to_admin_allowlist

Revision ID: 59f13d0b3596
Revises: e24abb6050e6
Create Date: 2026-02-22 16:23:23.108107

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '59f13d0b3596'
down_revision: Union[str, None] = 'e24abb6050e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add password_hash column to admin_allowlist table
    op.add_column('admin_allowlist', sa.Column('password_hash', sa.String(255), nullable=True))


def downgrade() -> None:
    # Remove password_hash column from admin_allowlist table
    op.drop_column('admin_allowlist', 'password_hash')
