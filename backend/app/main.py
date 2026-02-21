import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.auth_routes import router as auth_router
from app.api.admin_auth_routes import router as admin_auth_router
from app.api.admin_certificates_routes import router as admin_certificates_router
from app.api.admin_kyc_routes import router as admin_kyc_router
from app.api.admin_orders_routes import router as admin_orders_router
from app.api.admin_payout_routes import router as admin_payout_router
from app.api.admin_users_routes import router as admin_users_router
from app.api.challenge_config_routes import router as challenge_config_router
from app.api.challenge_accounts_routes import router as challenge_accounts_router
from app.api.coupon_routes import router as coupon_router
from app.api.payment_routes import router as payment_router
from app.api.mt5_routes import router as mt5_router
from app.api.pin_routes import router as pin_router
from app.api.payout_routes import router as payout_router
from app.api.profile_routes import router as profile_router
from app.api.certificate_routes import router as certificate_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
    ]
)

app = FastAPI(title=settings.app_name)

cors_origins = [origin.strip() for origin in settings.backend_cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # Allow local dev hosts across dynamic ports (e.g., Vite on 3004)
    # in addition to explicit origins from BACKEND_CORS_ORIGINS.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_auth_router)
app.include_router(admin_certificates_router)
app.include_router(admin_kyc_router)
app.include_router(admin_orders_router)
app.include_router(admin_payout_router)
app.include_router(admin_users_router)
app.include_router(challenge_config_router)
app.include_router(challenge_accounts_router)
app.include_router(coupon_router)
app.include_router(payment_router)
app.include_router(mt5_router)
app.include_router(payout_router)
app.include_router(profile_router)
app.include_router(pin_router)
app.include_router(certificate_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.app_host, port=settings.app_port, reload=True)
