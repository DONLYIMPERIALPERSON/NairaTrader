"""add_assigned_to_to_support_chats

Revision ID: 095ba3bd52f5
Revises: 82d2320925a0
Create Date: 2026-02-22 09:12:29.749917

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '095ba3bd52f5'
down_revision: Union[str, None] = '82d2320925a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('support_chats', sa.Column('assigned_to', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('support_chats', 'assigned_to')
