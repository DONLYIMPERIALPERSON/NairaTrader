from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    certificate_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # 'funding', 'payout'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    certificate_url: Mapped[str] = mapped_column(String(500), nullable=False)  # Cloudflare R2 URL
    file_key: Mapped[str] = mapped_column(String(255), nullable=False)  # R2 object key
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    related_entity_id: Mapped[str] = mapped_column(String(100), nullable=True)  # challenge_account_id, payout_id, etc.
    certificate_metadata: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string with additional data

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="certificates")