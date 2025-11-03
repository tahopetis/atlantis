from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class GitProvider(str, Enum):
    GITHUB = "github"
    GITLAB = "gitlab"
    BITBUCKET = "bitbucket"
    SSH = "ssh"


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    model_config = {"from_attributes": True}


# Authentication schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    scopes: List[str] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Git Token schemas
class GitTokenBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    provider: GitProvider
    scopes: Optional[List[str]] = []


class GitTokenCreate(GitTokenBase):
    token: str = Field(..., min_length=1)

    @field_validator('token')
    @classmethod
    def validate_token(cls, v, info):
        provider = info.data.get('provider')
        if provider == GitProvider.GITHUB:
            # GitHub PAT validation
            if not v.startswith('ghp_') and not v.startswith('gho_') and not v.startswith('ghu_'):
                raise ValueError('Invalid GitHub token format')
        elif provider == GitProvider.GITLAB:
            # GitLab token validation
            if not v.startswith('glpat-') and not v.startswith('glsoat-'):
                raise ValueError('Invalid GitLab token format')
        return v


class GitTokenUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    scopes: Optional[List[str]] = None
    is_active: Optional[bool] = None


class GitTokenResponse(GitTokenBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_used: Optional[datetime]
    expires_at: Optional[datetime]
    token_preview: str  # First few characters of the token for display

    model_config = {"from_attributes": True}


class GitTokenValidation(BaseModel):
    is_valid: bool
    username: Optional[str] = None
    scopes: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    error_message: Optional[str] = None


# Password reset schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


# Response schemas
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class AuthResponse(StandardResponse):
    data: Optional[Token] = None


class UserListResponse(StandardResponse):
    data: List[UserResponse]


class GitTokenListResponse(StandardResponse):
    data: List[GitTokenResponse]


# Security schemas
class RateLimitInfo(BaseModel):
    limit: int
    remaining: int
    reset_time: datetime


class SecurityHeaders(BaseModel):
    x_content_type_options: str = "nosniff"
    x_frame_options: str = "DENY"
    x_xss_protection: str = "1; mode=block"
    strict_transport_security: str = "max-age=31536000; includeSubDomains"