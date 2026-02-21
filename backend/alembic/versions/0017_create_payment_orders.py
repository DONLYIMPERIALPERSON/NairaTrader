"""create payment orders table

Revision ID: 0017_create_payment_orders
Revises: 0016_create_coupons
Create Date: 2026-02-20 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0017_create_payment_orders"
down_revision: Union[str, None] = "0016_create_coupons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payment_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("provider_order_id", sa.String(length=64), nullable=False),
        sa.Column("provider_order_no", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("assignment_status", sa.String(length=30), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("gross_amount_kobo", sa.Integer(), nullable=False),
        sa.Column("discount_amount_kobo", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("net_amount_kobo", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.String(length=50), nullable=False),
        sa.Column("account_size", sa.String(length=120), nullable=False),
        sa.Column("coupon_code", sa.String(length=64), nullable=True),
        sa.Column("checkout_url", sa.String(length=500), nullable=True),
        sa.Column("payer_account_type", sa.String(length=30), nullable=True),
        sa.Column("payer_account_id", sa.String(length=120), nullable=True),
        sa.Column("payer_bank_name", sa.String(length=200), nullable=True),
        sa.Column("payer_account_name", sa.String(length=200), nullable=True),
        sa.Column("payer_virtual_acc_no", sa.String(length=120), nullable=True),
        sa.Column("challenge_id", sa.String(length=50), nullable=True),
        sa.Column("assigned_mt5_account_id", sa.Integer(), nullable=True),
        sa.Column("provider_raw_response", sa.JSON(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["assigned_mt5_account_id"], ["mt5_accounts.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_payment_orders_id"), "payment_orders", ["id"], unique=False)
    op.create_index(op.f("ix_payment_orders_user_id"), "payment_orders", ["user_id"], unique=False)
    op.create_index(op.f("ix_payment_orders_provider_order_id"), "payment_orders", ["provider_order_id"], unique=True)
    op.create_index(op.f("ix_payment_orders_provider_order_no"), "payment_orders", ["provider_order_no"], unique=False)
    op.create_index(op.f("ix_payment_orders_status"), "payment_orders", ["status"], unique=False)
    op.create_index(op.f("ix_payment_orders_assignment_status"), "payment_orders", ["assignment_status"], unique=False)
    op.create_index(op.f("ix_payment_orders_plan_id"), "payment_orders", ["plan_id"], unique=False)
    op.create_index(op.f("ix_payment_orders_challenge_id"), "payment_orders", ["challenge_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payment_orders_challenge_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_plan_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_assignment_status"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_status"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_provider_order_no"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_provider_order_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_user_id"), table_name="payment_orders")
    op.drop_index(op.f("ix_payment_orders_id"), table_name="payment_orders")
    op.drop_table("payment_orders")
