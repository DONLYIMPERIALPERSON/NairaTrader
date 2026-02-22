"""add_admin_activity_logs_table

Revision ID: 8083fdbd7309
Revises: 129a05495745
Create Date: 2026-02-22 11:45:42.368713

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8083fdbd7309'
down_revision: Union[str, None] = '129a05495745'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin_activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('admin_name', sa.String(length=255), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('extra_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admin_activity_logs_admin_id'), 'admin_activity_logs', ['admin_id'], unique=False)
    op.create_index(op.f('ix_admin_activity_logs_action'), 'admin_activity_logs', ['action'], unique=False)
    op.create_index(op.f('ix_admin_activity_logs_created_at'), 'admin_activity_logs', ['created_at'], unique=False)


def downgrade() -> None:
    pass
