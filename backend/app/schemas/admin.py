from pydantic import BaseModel, ConfigDict, Field


class AdminAllowlistCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=5, max_length=255)
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    role: str = Field(default="admin", pattern="^(admin|super_admin)$")
    require_mfa: bool = True


class AdminAllowlistUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, pattern="^(admin|super_admin)$")
    status: str | None = Field(default=None, pattern="^(active|disabled)$")
    require_mfa: bool | None = None
