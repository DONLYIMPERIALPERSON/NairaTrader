from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_admin_allowlisted
from app.db.deps import get_db
from app.models.challenge_account import ChallengeAccount
from app.services.certificate_service import get_certificate_service

router = APIRouter(prefix="/admin/certificates", tags=["Admin Certificates"])


@router.post("/generate-certificates", status_code=status.HTTP_200_OK)
async def generate_missing_certificates(
    _: dict = Depends(get_current_admin_allowlisted),
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """Admin endpoint to generate certificates for funded accounts that don't have them"""
    certificate_service = get_certificate_service()

    # Find all funded challenge accounts
    funded_challenges = db.scalars(
        select(ChallengeAccount).where(ChallengeAccount.current_stage == "Funded")
    ).all()

    generated_count = 0
    failed_count = 0

    for challenge in funded_challenges:
        # Check if certificate already exists
        existing_certificates = certificate_service.get_user_certificates(challenge.user_id, db)
        has_funding_certificate = any(
            cert.certificate_type == "funding" and cert.related_entity_id == challenge.challenge_id
            for cert in existing_certificates
        )

        if has_funding_certificate:
            continue  # Already has certificate

        # Generate certificate
        try:
            certificate = certificate_service.generate_funding_certificate(
                user_id=challenge.user_id,
                challenge_account_id=challenge.challenge_id,
                account_size=challenge.account_size,
                db=db
            )
            if certificate:
                generated_count += 1
                print(f"Generated missing certificate for user {challenge.user_id}, challenge {challenge.challenge_id}")
            else:
                failed_count += 1
                print(f"Failed to generate certificate for user {challenge.user_id}, challenge {challenge.challenge_id}")
        except Exception as e:
            failed_count += 1
            print(f"Error generating certificate for user {challenge.user_id}: {e}")

    return {
        "message": f"Generated {generated_count} certificates, {failed_count} failed",
        "generated": str(generated_count),
        "failed": str(failed_count)
    }
