from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..core.database import Base


class GitProvider(enum.Enum):
    GITHUB = "github"
    GITLAB = "gitlab"
    BITBUCKET = "bitbucket"
    SSH = "ssh"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    # Relationships
    git_tokens = relationship("GitToken", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    diagrams = relationship("Diagram", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("DiagramFile", back_populates="owner", cascade="all, delete-orphan")


class GitToken(Base):
    __tablename__ = "git_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # User-friendly name for the token
    provider = Column(Enum(GitProvider), nullable=False)
    token = Column(Text, nullable=False)  # Encrypted token
    encrypted_key = Column(Text)  # Key used for encryption (encrypted)
    is_active = Column(Boolean, default=True)

    # Token metadata
    scopes = Column(Text)  # JSON string of scopes/permissions
    expires_at = Column(DateTime(timezone=True))
    last_used = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="git_tokens")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Device/Session info
    device_info = Column(Text)  # JSON string with device info
    ip_address = Column(String)
    user_agent = Column(Text)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)  # login, logout, token_created, etc.
    resource = Column(String)  # user, git_token, etc.
    resource_id = Column(String)  # ID of the resource if applicable

    # Request details
    ip_address = Column(String)
    user_agent = Column(Text)
    endpoint = Column(String)
    method = Column(String)

    # Status and details
    success = Column(Boolean, nullable=False)
    error_message = Column(Text)
    details = Column(Text)  # JSON string with additional details

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())