from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ChallengeConfig(Base):
    __tablename__ = "challenge_config"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    config_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    config_value: Mapped[dict[str, object] | list[dict[str, object]]] = mapped_column(JSON, nullable=False)
