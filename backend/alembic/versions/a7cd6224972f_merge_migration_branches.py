"""merge migration branches

Revision ID: a7cd6224972f
Revises: 59f13d0b3596, db1e145a8e73
Create Date: 2026-02-22 20:51:28.535406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7cd6224972f'
down_revision: Union[str, None] = ('59f13d0b3596', 'db1e145a8e73')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
