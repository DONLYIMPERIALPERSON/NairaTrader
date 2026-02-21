from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    descope_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nick_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    use_nickname_for_certificates: Mapped[bool] = mapped_column(default=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    kyc_status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_started")

    # Relationships
    certificates: Mapped[list["Certificate"]] = relationship("Certificate", back_populates="user")
