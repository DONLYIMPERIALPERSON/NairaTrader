from pydantic import BaseModel, ConfigDict, Field


class PinStatusResponse(BaseModel):
    has_pin: bool


class OtpSendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purpose: str = Field(pattern="^(set|reset)$")


class SetPinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    new_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")
    confirm_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")
    otp: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")


class ChangePinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    old_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")
    new_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")


class ResetPinRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    otp: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")
    new_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")
    confirm_pin: str = Field(min_length=4, max_length=4, pattern="^\\d{4}$")
