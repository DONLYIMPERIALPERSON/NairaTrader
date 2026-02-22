"""migrate_to_firebase_auth

Revision ID: 8325b857628b
Revises: 8083fdbd7309
Create Date: 2026-02-22 12:37:24.507931

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8325b857628b'
down_revision: Union[str, None] = '8083fdbd7309'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add firebase_uid column to users table
    op.add_column('users', sa.Column('firebase_uid', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_firebase_uid'), 'users', ['firebase_uid'], unique=True)

    # Add firebase_uid column to admin_allowlist table
    op.add_column('admin_allowlist', sa.Column('firebase_uid', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_admin_allowlist_firebase_uid'), 'admin_allowlist', ['firebase_uid'], unique=True)


def downgrade() -> None:
    # Remove firebase_uid column from admin_allowlist table
    op.drop_index(op.f('ix_admin_allowlist_firebase_uid'), table_name='admin_allowlist')
    op.drop_column('admin_allowlist', 'firebase_uid')

    # Remove firebase_uid column from users table
    op.drop_index(op.f('ix_users_firebase_uid'), table_name='users')
    op.drop_column('users', 'firebase_uid')
