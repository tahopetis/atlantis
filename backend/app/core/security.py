from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from cryptography.fernet import Fernet
import secrets
import hashlib
import os

from .config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption for sensitive data
ENCRYPTION_KEY = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
if len(ENCRYPTION_KEY) < 32:
    ENCRYPTION_KEY += os.urandom(32 - len(ENCRYPTION_KEY))
cipher_suite = Fernet(Fernet.generate_key())


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Refresh tokens last longer (7 days by default)
        expire = datetime.utcnow() + timedelta(days=7)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Check token type
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type. Expected {token_type}",
            )

        # Check expiration
        exp = payload.get("exp")
        if exp is None or datetime.fromtimestamp(exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


def generate_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def generate_device_fingerprint(user_agent: str, ip_address: str) -> str:
    """Generate device fingerprint for session tracking"""
    fingerprint_data = f"{user_agent}:{ip_address}:{secrets.token_hex(8)}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()


def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data like tokens"""
    # In a real application, use a proper key management system
    key = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
    fernet = Fernet(Fernet.generate_key())

    # For demo purposes, we'll use simple XOR encryption
    # In production, use proper AES encryption
    encrypted = []
    for i, char in enumerate(data):
        encrypted.append(chr(ord(char) ^ key[i % len(key)]))
    return ''.join(encrypted).encode().hex()


def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    key = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')

    try:
        decrypted = []
        encrypted_bytes = bytes.fromhex(encrypted_data)
        for i, char in enumerate(encrypted_bytes.decode()):
            decrypted.append(chr(ord(char) ^ key[i % len(key)]))
        return ''.join(decrypted)
    except:
        raise ValueError("Failed to decrypt data")


def mask_token(token: str, visible_chars: int = 4) -> str:
    """Mask a token for display purposes"""
    if len(token) <= visible_chars:
        return "*" * len(token)

    return token[:visible_chars] + "*" * (len(token) - visible_chars)


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password strength and return list of issues"""
    issues = []

    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")

    if not any(c.isupper() for c in password):
        issues.append("Password must contain at least one uppercase letter")

    if not any(c.islower() for c in password):
        issues.append("Password must contain at least one lowercase letter")

    if not any(c.isdigit() for c in password):
        issues.append("Password must contain at least one digit")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        issues.append("Password must contain at least one special character")

    # Check for common passwords
    common_passwords = [
        "password", "123456", "qwerty", "admin", "letmein",
        "welcome", "monkey", "dragon", "password1", "123456789"
    ]

    if password.lower() in common_passwords:
        issues.append("Password is too common")

    return len(issues) == 0, issues


def create_api_key() -> str:
    """Generate API key for external integrations"""
    timestamp = str(int(datetime.utcnow().timestamp()))
    random_part = secrets.token_urlsafe(32)
    return f"atk_{timestamp}_{random_part}"


def hash_api_key(api_key: str) -> str:
    """Hash API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()