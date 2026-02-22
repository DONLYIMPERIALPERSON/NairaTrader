"""merge_support_and_nickname

Revision ID: aaa1cc549112
Revises: 0020_create_support_tables, 02e0e2e1a9bb
Create Date: 2026-02-22 08:02:45.515212

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aaa1cc549112'
down_revision: Union[str, None] = ('0020_create_support_tables', '02e0e2e1a9bb')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
