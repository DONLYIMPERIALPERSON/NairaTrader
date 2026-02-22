"""add_allowed_pages_to_admin_allowlist

Revision ID: 129a05495745
Revises: 095ba3bd52f5
Create Date: 2026-02-22 10:28:43.272828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '129a05495745'
down_revision: Union[str, None] = '095ba3bd52f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('admin_allowlist', sa.Column('allowed_pages', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('admin_allowlist', 'allowed_pages')
