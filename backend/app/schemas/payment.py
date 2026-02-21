from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PaymentInitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: str = Field(min_length=1, max_length=50)
    coupon_code: str | None = Field(default=None, max_length=64)
    channel: str = Field(default="bank_transfer", pattern="^bank_transfer$")


class PaymentOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider_order_id: str
    status: str
    assignment_status: str
    currency: str
    gross_amount_kobo: int
    discount_amount_kobo: int
    net_amount_kobo: int
    plan_id: str
    account_size: str
    coupon_code: str | None
    checkout_url: str | None
    payer_bank_name: str | None
    payer_account_name: str | None
    payer_virtual_acc_no: str | None
    expires_at: datetime | None
    challenge_id: str | None


class PaymentStatusRefreshResponse(BaseModel):
    provider_order_id: str
    status: str
    assignment_status: str
    challenge_id: str | None
    message: str
