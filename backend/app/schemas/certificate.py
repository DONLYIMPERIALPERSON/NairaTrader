from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    certificate_type: str
    title: str
    description: Optional[str]
    certificate_url: str
    generated_at: datetime
    related_entity_id: Optional[str]
    certificate_metadata: Optional[str]


class CertificateListResponse(BaseModel):
    certificates: list[CertificateResponse]


class CertificateGenerationResponse(BaseModel):
    success: bool
    message: str
    certificate: Optional[CertificateResponse]