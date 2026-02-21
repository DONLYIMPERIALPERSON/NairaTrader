import hashlib
import secrets


def hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def verify_secret(value: str, value_hash: str) -> bool:
    return hash_secret(value) == value_hash


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"
