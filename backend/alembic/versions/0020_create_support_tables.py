"""create support tables

Revision ID: 0020_create_support_tables
Revises: 0019_create_affiliate_tables
Create Date: 2026-02-22 07:09:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0020_create_support_tables"
down_revision: Union[str, None] = "0019_create_affiliate_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Support chats table
    op.create_table(
        "support_chats",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("status", sa.Enum("open", "closed", name="chatstatus"), nullable=False),
        sa.Column("priority", sa.Enum("low", "medium", "high", name="priority"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_support_chats_user_id", "support_chats", ["user_id"], unique=False)
    op.create_index("ix_support_chats_status", "support_chats", ["status"], unique=False)
    op.create_index("ix_support_chats_updated_at", "support_chats", ["updated_at"], unique=False)

    # Support messages table
    op.create_table(
        "support_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("chat_id", sa.String(length=36), nullable=False),
        sa.Column("sender", sa.Enum("user", "support", name="messagesender"), nullable=False),
        sa.Column("message", sa.TEXT(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["chat_id"], ["support_chats.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_support_messages_chat_id", "support_messages", ["chat_id"], unique=False)
    op.create_index("ix_support_messages_sender", "support_messages", ["sender"], unique=False)
    op.create_index("ix_support_messages_created_at", "support_messages", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_table("support_messages")
    op.drop_table("support_chats")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS messagesender")
    op.execute("DROP TYPE IF EXISTS priority")
    op.execute("DROP TYPE IF EXISTS chatstatus")