"""allow_null_user_id_for_registration_otps

Revision ID: 35dcef470376
Revises: 8325b857628b
Create Date: 2026-02-22 14:17:12.638844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35dcef470376'
down_revision: Union[str, None] = '8325b857628b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make user_id column nullable for registration OTPs
    op.alter_column('pin_otps', 'user_id', nullable=True)


def downgrade() -> None:
    # Make user_id column non-nullable again
    op.alter_column('pin_otps', 'user_id', nullable=False)
