"""create pin tables

Revision ID: 0003_create_pin_tables
Revises: 0002_add_nick_name_to_users
Create Date: 2026-02-18 19:08:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003_create_pin_tables"
down_revision: Union[str, None] = "0002_add_nick_name_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_pins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pin_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_pins_id", "user_pins", ["id"], unique=False)
    op.create_index("ix_user_pins_user_id", "user_pins", ["user_id"], unique=True)

    op.create_table(
        "pin_otps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("purpose", sa.String(length=20), nullable=False),
        sa.Column("code_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pin_otps_id", "pin_otps", ["id"], unique=False)
    op.create_index("ix_pin_otps_user_id", "pin_otps", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_pin_otps_user_id", table_name="pin_otps")
    op.drop_index("ix_pin_otps_id", table_name="pin_otps")
    op.drop_table("pin_otps")

    op.drop_index("ix_user_pins_user_id", table_name="user_pins")
    op.drop_index("ix_user_pins_id", table_name="user_pins")
    op.drop_table("user_pins")
