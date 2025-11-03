from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import httpx
import re

from ..models.user import User, GitToken, RefreshToken, AuditLog, GitProvider
from ..schemas.auth import (
    UserCreate, UserUpdate, TokenData, GitTokenCreate, GitTokenUpdate,
    GitTokenValidation, ChangePassword
)
from ..core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_token, encrypt_sensitive_data,
    decrypt_sensitive_data, mask_token, validate_password_strength,
    generate_device_fingerprint
)
from ..core.config import settings


class AuthService:
    """Authentication service for user and token management"""

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Validate password strength
        is_strong, issues = validate_password_strength(user_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password does not meet requirements", "issues": issues}
            )

        # Check if user already exists
        existing_user = self.db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()

        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        # Log user creation
        self._create_audit_log(
            user_id=db_user.id,
            action="user_created",
            resource="user",
            resource_id=str(db_user.id),
            success=True
        )

        return db_user

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username/email and password"""
        user = self.db.query(User).filter(
            (User.email == username) | (User.username == username)
        ).first()

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )

        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()

        return user

    def create_user_tokens(
        self,
        user: User,
        device_info: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create access and refresh tokens for user"""
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username},
            expires_delta=access_token_expires
        )

        # Create refresh token
        refresh_token_expires = timedelta(days=7)
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "username": user.username},
            expires_delta=refresh_token_expires
        )

        # Store refresh token in database
        db_refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow() + refresh_token_expires,
            device_info=str(device_info) if device_info else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

        self.db.add(db_refresh_token)
        self.db.commit()

        # Log login
        self._create_audit_log(
            user_id=user.id,
            action="login",
            resource="user",
            resource_id=str(user.id),
            success=True,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = verify_token(refresh_token, "refresh")
            user_id = int(payload.get("sub"))

            # Check if refresh token exists in database and is active
            db_refresh_token = self.db.query(RefreshToken).filter(
                and_(
                    RefreshToken.token == refresh_token,
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_active == True,
                    RefreshToken.expires_at > datetime.utcnow()
                )
            ).first()

            if not db_refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )

            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )

            # Create new access token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user.id), "username": user.username},
                expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

    def logout_user(self, refresh_token: str, user_id: int) -> bool:
        """Logout user by invalidating refresh token"""
        db_refresh_token = self.db.query(RefreshToken).filter(
            and_(
                RefreshToken.token == refresh_token,
                RefreshToken.user_id == user_id
            )
        ).first()

        if db_refresh_token:
            db_refresh_token.is_active = False
            self.db.commit()

            # Log logout
            self._create_audit_log(
                user_id=user_id,
                action="logout",
                resource="user",
                resource_id=str(user_id),
                success=True
            )

            return True

        return False

    def logout_all_sessions(self, user_id: int) -> bool:
        """Logout user from all sessions"""
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).update({"is_active": False})

        self.db.commit()

        # Log logout all
        self._create_audit_log(
            user_id=user_id,
            action="logout_all",
            resource="user",
            resource_id=str(user_id),
            success=True
        )

        return True

    def get_current_user(self, token: str) -> User:
        """Get current user from access token"""
        payload = verify_token(token, "access")
        user_id = int(payload.get("sub"))

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )

        return user

    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """Update user information"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check for username/email conflicts
        if user_data.email and user_data.email != user.email:
            existing_user = self.db.query(User).filter(
                User.email == user_data.email,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            user.email = user_data.email

        if user_data.username and user_data.username != user.username:
            existing_user = self.db.query(User).filter(
                User.username == user_data.username,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            user.username = user_data.username

        # Update other fields
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.avatar_url is not None:
            user.avatar_url = user_data.avatar_url

        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        # Log user update
        self._create_audit_log(
            user_id=user_id,
            action="user_updated",
            resource="user",
            resource_id=str(user_id),
            success=True
        )

        return user

    def change_password(self, user_id: int, password_data: ChangePassword) -> bool:
        """Change user password"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify current password
        if not verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Validate new password
        is_strong, issues = validate_password_strength(password_data.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password does not meet requirements", "issues": issues}
            )

        # Update password
        user.hashed_password = get_password_hash(password_data.new_password)
        user.updated_at = datetime.utcnow()

        # Invalidate all refresh tokens (force re-login)
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).update({"is_active": False})

        self.db.commit()

        # Log password change
        self._create_audit_log(
            user_id=user_id,
            action="password_changed",
            resource="user",
            resource_id=str(user_id),
            success=True
        )

        return True

    def _create_audit_log(
        self,
        user_id: Optional[int],
        action: str,
        resource: str,
        resource_id: str,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Create audit log entry"""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message,
            details=str(details) if details else None
        )

        self.db.add(audit_log)
        # Don't commit here to avoid interfering with the main transaction