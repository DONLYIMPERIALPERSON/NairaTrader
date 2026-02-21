from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_user, get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.user import User
from app.models.challenge_account import ChallengeAccount
from app.schemas.certificate import CertificateResponse, CertificateListResponse
from app.services.certificate_service import get_certificate_service, CertificateService

router = APIRouter()


@router.get("/certificates", response_model=CertificateListResponse)
async def get_user_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CertificateListResponse:
    """Get all certificates for the current user"""
    certificate_service = get_certificate_service()
    certificates = certificate_service.get_user_certificates(current_user.id, db)

    return CertificateListResponse(
        certificates=[CertificateResponse.model_validate(cert) for cert in certificates]
    )


@router.get("/certificates/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CertificateResponse:
    """Get a specific certificate by ID"""
    certificate_service = get_certificate_service()
    certificate = certificate_service.get_certificate_by_id(certificate_id, current_user.id, db)

    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    return CertificateResponse.model_validate(certificate)



