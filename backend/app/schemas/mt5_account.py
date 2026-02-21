from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MT5AccountBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    server: str = Field(min_length=1, max_length=120)
    account_number: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=255)
    investor_password: str = Field(min_length=1, max_length=255)
    account_size: str = Field(min_length=1, max_length=120)


class MT5AccountCreate(MT5AccountBase):
    status: str = Field(default="Ready", pattern="^(Ready|Phase 1|Phase 2|Funded|Disabled|Withdrawn)$")


class MT5AccountBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accounts: list[MT5AccountCreate] = Field(min_length=1)


class MT5AccountTextUploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1)


class MT5AccountStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str = Field(pattern="^(Ready|Phase 1|Phase 2|Funded|Disabled|Withdrawn)$")
    assignment_mode: str | None = Field(default=None, pattern="^(manual|automatic)$")
    assigned_user_id: int | None = None


class MT5AccountAssignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str = Field(pattern="^(Phase 1|Phase 2|Funded)$")
    assigned_user_email: str = Field(min_length=3, max_length=255)
    challenge_id: str | None = Field(default=None, min_length=1, max_length=50)


class MT5AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    server: str
    account_number: str
    password: str
    investor_password: str
    account_size: str
    status: str
    assignment_mode: str | None
    assigned_by_admin_name: str | None
    assigned_user_id: int | None
    assigned_at: datetime | None
    created_at: datetime
    updated_at: datetime
