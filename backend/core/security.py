from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt
import base64
from core.config import settings

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None, additional_claims: dict = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if additional_claims:
        to_encode.update(additional_claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_secure_id(length=12):
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# ── Field-level encryption helpers ──────────────────────────────────
# Uses Fernet (AES-128-CBC + HMAC) derived from the app SECRET_KEY.
# This protects sensitive fields like AI provider API keys at rest.

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

_fernet: Fernet | None = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        # Derive a stable Fernet key from SECRET_KEY + a fixed salt.
        # The salt is intentionally static so the same key is derived
        # across restarts (required for decryption of existing data).
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'RinoxAuth-field-encryption-v1',
            iterations=100_000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
        _fernet = Fernet(key)
    return _fernet

def encrypt_field(value: str) -> str:
    """Encrypt a plaintext string for storage in the database."""
    if not value:
        return ""
    return _get_fernet().encrypt(value.encode()).decode()

def decrypt_field(encrypted_value: str) -> str:
    """Decrypt a stored encrypted string. Returns the original plaintext."""
    if not encrypted_value:
        return ""
    try:
        return _get_fernet().decrypt(encrypted_value.encode()).decode()
    except Exception:
        # If decryption fails, the value was likely stored as plaintext
        # before encryption was enabled. Return as-is for backward compat.
        return encrypted_value

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password meets minimum security requirements.
    Returns (is_valid, error_message).
    """
    if not password or len(password) < 1:
        return False, "Password cannot be empty"
    if len(password) > 128:
        return False, "Password must be at most 128 characters"
    return True, ""

def compare_versions(v1: str, v2: str) -> int:
    """Compare two semantic version strings.
    Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
    """
    def parse(v: str):
        parts = v.split('.')
        return tuple(int(p) if p.isdigit() else 0 for p in parts)
    p1 = parse(v1)
    p2 = parse(v2)
    if p1 < p2:
        return -1
    if p1 > p2:
        return 1
    return 0
