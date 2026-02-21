"""create certificates table

Revision ID: 0018_create_certificates
Revises: 0017_create_payment_orders
Create Date: 2026-02-20 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0018_create_certificates"
down_revision: Union[str, None] = "0017_create_payment_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("certificate_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("certificate_url", sa.String(length=500), nullable=False),
        sa.Column("file_key", sa.String(length=255), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("related_entity_id", sa.String(length=100), nullable=True),
        sa.Column("certificate_metadata", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_certificates_id"), "certificates", ["id"], unique=False)
    op.create_index(op.f("ix_certificates_user_id"), "certificates", ["user_id"], unique=False)
    op.create_index(op.f("ix_certificates_certificate_type"), "certificates", ["certificate_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_certificates_certificate_type"), table_name="certificates")
    op.drop_index(op.f("ix_certificates_user_id"), table_name="certificates")
    op.drop_index(op.f("ix_certificates_id"), table_name="certificates")
    op.drop_table("certificates")