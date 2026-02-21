from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MT5Account(Base):
    __tablename__ = "mt5_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    server: Mapped[str] = mapped_column(String(120), nullable=False)
    account_number: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    investor_password: Mapped[str] = mapped_column(String(255), nullable=False)
    account_size: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Ready", index=True)
    assignment_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    assigned_by_admin_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assigned_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
