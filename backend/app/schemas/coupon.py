from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CouponCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=2, max_length=64)
    discount_type: str = Field(pattern="^(percent|fixed)$")
    discount_value: float = Field(gt=0)
    max_uses: int | None = Field(default=None, ge=1)
    expires_at: datetime | None = None
    apply_all_plans: bool = True
    applicable_plan_ids: list[str] = Field(default_factory=list)


class CouponStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_active: bool


class CouponPlanToggleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: str = Field(min_length=1, max_length=50)
    enabled: bool


class CouponPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=2, max_length=64)
    plan_id: str = Field(min_length=1, max_length=50)


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    is_active: bool
    expires_at: str | None
    max_uses: int | None
    used_count: int
    applicable_plan_ids: list[str]
    applies_to_all_plans: bool
    status: str


class CouponPreviewResponse(BaseModel):
    code: str
    plan_id: str
    original_amount: float
    discount_amount: float
    final_amount: float
    formatted_original_amount: str
    formatted_discount_amount: str
    formatted_final_amount: str


class CouponResolutionResult(BaseModel):
    code: str | None
    discount_amount_kobo: int
    final_amount_kobo: int
    formatted_discount_amount: str
    formatted_final_amount: str
