"""create coupons table

Revision ID: 0016_create_coupons
Revises: 0015_stage_trade_aggs
Create Date: 2026-02-19 22:44:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0016_create_coupons"
down_revision: Union[str, None] = "0015_stage_trade_aggs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("discount_type", sa.String(length=16), nullable=False),
        sa.Column("discount_value", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("applicable_plan_ids", sa.JSON(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_coupons_code"), "coupons", ["code"], unique=True)
    op.create_index(op.f("ix_coupons_id"), "coupons", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_coupons_id"), table_name="coupons")
    op.drop_index(op.f("ix_coupons_code"), table_name="coupons")
    op.drop_table("coupons")
