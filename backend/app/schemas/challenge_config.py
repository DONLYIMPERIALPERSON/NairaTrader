from pydantic import BaseModel, ConfigDict, Field


class ChallengePlanConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=120)
    price: str = Field(min_length=1, max_length=50)
    max_drawdown: str = Field(min_length=1, max_length=50)
    profit_target: str = Field(min_length=1, max_length=50)
    phases: str = Field(min_length=1, max_length=50)
    min_trading_days: str = Field(min_length=1, max_length=50)
    profit_split: str = Field(min_length=1, max_length=50)
    profit_cap: str = Field(min_length=1, max_length=50)
    payout_frequency: str = Field(min_length=1, max_length=50)
    status: str = Field(pattern="^(Available|Paused)$")
    enabled: bool = True


class ChallengeConfigUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    otp: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")
    plans: list[ChallengePlanConfig]


class HeroStatsConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_paid_out: str = Field(min_length=1, max_length=50)
    paid_this_month: str = Field(min_length=1, max_length=50)
    paid_today: str = Field(min_length=1, max_length=50)
    trusted_traders: str = Field(min_length=1, max_length=50)


class HeroStatsUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    otp: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")
    stats: HeroStatsConfig
