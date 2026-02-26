"""add default created_at for email_logs

Revision ID: 0c2f8f1c7d21
Revises: 8b2d1f2a9c1c
Create Date: 2026-02-26 16:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c2f8f1c7d21'
down_revision: Union[str, None] = '8b2d1f2a9c1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'email_logs',
        'created_at',
        server_default=sa.func.now(),
        existing_type=sa.DateTime(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'email_logs',
        'created_at',
        server_default=None,
        existing_type=sa.DateTime(),
        existing_nullable=False,
    )