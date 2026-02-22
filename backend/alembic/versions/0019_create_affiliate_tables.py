"""create affiliate tables

Revision ID: 0019_create_affiliate_tables
Revises: 0018_create_certificates
Create Date: 2026-02-22 02:58:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0019_create_affiliate_tables"
down_revision: Union[str, None] = "0018_create_certificates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Affiliates table
    op.create_table(
        "affiliates",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_affiliates_user_id", "affiliates", ["user_id"], unique=False)
    op.create_index("ix_affiliates_code", "affiliates", ["code"], unique=True)

    # Affiliate commissions table
    op.create_table(
        "affiliate_commissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("affiliate_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_user_id", sa.Integer(), nullable=True),
        sa.Column("customer_email", sa.String(length=190), nullable=True),
        sa.Column("unique_customer_key", sa.String(length=200), nullable=False),
        sa.Column("amount", sa.DECIMAL(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="approved"),
        sa.Column("product_summary", sa.TEXT(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affiliate_commissions_affiliate_id", "affiliate_commissions", ["affiliate_id"], unique=False)
    op.create_index("ix_affiliate_commissions_unique_customer_key", "affiliate_commissions", ["unique_customer_key"], unique=False)
    op.create_index("ix_affiliate_commissions_created_at", "affiliate_commissions", ["created_at"], unique=False)
    op.create_index("ix_affiliate_commissions_affiliate_created", "affiliate_commissions", ["affiliate_id", "created_at"], unique=False)
    op.create_index("ix_affiliate_commissions_affiliate_customer", "affiliate_commissions", ["affiliate_id", "unique_customer_key"], unique=False)
    op.create_unique_constraint("uq_affiliate_order", "affiliate_commissions", ["affiliate_id", "order_id"])

    # Affiliate payouts table
    op.create_table(
        "affiliate_payouts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("affiliate_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.DECIMAL(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("requested_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("approved_at", sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affiliate_payouts_affiliate_id", "affiliate_payouts", ["affiliate_id"], unique=False)
    op.create_index("ix_affiliate_payouts_status_requested", "affiliate_payouts", ["status", "requested_at"], unique=False)

    # Affiliate milestones table
    op.create_table(
        "affiliate_milestones",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("affiliate_id", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("requested_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("processed_at", sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affiliate_milestones_affiliate_id", "affiliate_milestones", ["affiliate_id"], unique=False)

    # Affiliate clicks table
    op.create_table(
        "affiliate_clicks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("affiliate_id", sa.Integer(), nullable=False),
        sa.Column("ip_hash", sa.String(length=64), nullable=False),
        sa.Column("ua_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affiliate_clicks_affiliate_id", "affiliate_clicks", ["affiliate_id"], unique=False)
    op.create_index("ix_affiliate_clicks_ip_hash", "affiliate_clicks", ["ip_hash"], unique=False)


def downgrade() -> None:
    op.drop_table("affiliate_clicks")
    op.drop_table("affiliate_milestones")
    op.drop_table("affiliate_payouts")
    op.drop_table("affiliate_commissions")
    op.drop_table("affiliates")