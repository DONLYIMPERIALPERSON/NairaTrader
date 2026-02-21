"""add nick_name to users

Revision ID: 0002_add_nick_name_to_users
Revises: 0001_create_users
Create Date: 2026-02-18 18:56:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_add_nick_name_to_users"
down_revision: Union[str, None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("nick_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "nick_name")
