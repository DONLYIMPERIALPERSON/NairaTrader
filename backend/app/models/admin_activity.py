from sqlalchemy import Integer, String, DateTime, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AdminActivityLog(Base):
    __tablename__ = "admin_activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    admin_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    admin_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # user, payout, ticket, etc.
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extra_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string for additional data
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False, default=func.now(), index=True)