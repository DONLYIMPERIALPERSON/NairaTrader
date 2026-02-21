from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    provider: Mapped[str] = mapped_column(String(30), nullable=False, default="palmpay")
    provider_order_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    provider_order_no: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)
    assignment_status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)

    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="NGN")
    gross_amount_kobo: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_amount_kobo: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    net_amount_kobo: Mapped[int] = mapped_column(Integer, nullable=False)

    plan_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    account_size: Mapped[str] = mapped_column(String(120), nullable=False)
    coupon_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    checkout_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    payer_account_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payer_account_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payer_bank_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    payer_account_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    payer_virtual_acc_no: Mapped[str | None] = mapped_column(String(120), nullable=True)

    challenge_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    assigned_mt5_account_id: Mapped[int | None] = mapped_column(ForeignKey("mt5_accounts.id"), nullable=True)

    provider_raw_response: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)
    metadata_json: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)

    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
