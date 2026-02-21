from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BankDirectory(Base):
    __tablename__ = "bank_directory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bank_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bg_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bg2_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
