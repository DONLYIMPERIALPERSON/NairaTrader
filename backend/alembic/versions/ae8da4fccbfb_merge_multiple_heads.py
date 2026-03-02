"""merge multiple heads

Revision ID: ae8da4fccbfb
Revises: 0c2f8f1c7d21, 22f0ac1a2c0a, 3d2e4f0a9d11
Create Date: 2026-03-02 10:11:21.713279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae8da4fccbfb'
down_revision: Union[str, None] = ('0c2f8f1c7d21', '22f0ac1a2c0a', '3d2e4f0a9d11')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
