from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..core.config import settings
from ..schemas.auth import (
    UserCreate, UserResponse, LoginRequest, Token, RefreshTokenRequest,
    StandardResponse, AuthResponse, ChangePassword, UserUpdate
)
from ..services.auth_service import AuthService
from ..middleware.auth import (
    get_current_active_user, check_rate_limit_login, check_rate_limit_register,
    check_rate_limit_password_reset, RateLimitMiddleware, get_rate_limit_headers_decorator
)
from ..models.user import User

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Check rate limit
    check_rate_limit_register(request)

    auth_service = AuthService(db)

    try:
        user = auth_service.create_user(user_data)

        # Create tokens
        device_info = {
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host
        }

        tokens = auth_service.create_user_tokens(
            user=user,
            device_info=device_info,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        # Add rate limit headers
        middleware = RateLimitMiddleware()
        headers = middleware.get_rate_limit_headers(request, "register")
        for key, value in headers.items():
            response.headers[key] = value

        return AuthResponse(
            success=True,
            message="User registered successfully",
            data=Token(**tokens)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login user"""
    # Check rate limit
    check_rate_limit_login(request)

    auth_service = AuthService(db)

    try:
        user = auth_service.authenticate_user(
            username=login_data.username,
            password=login_data.password
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # Create tokens
        device_info = {
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host
        }

        tokens = auth_service.create_user_tokens(
            user=user,
            device_info=device_info,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        # Add rate limit headers
        middleware = RateLimitMiddleware()
        headers = middleware.get_rate_limit_headers(request, "login")
        for key, value in headers.items():
            response.headers[key] = value

        return AuthResponse(
            success=True,
            message="Login successful",
            data=Token(**tokens)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)

    try:
        tokens = auth_service.refresh_access_token(refresh_data.refresh_token)

        return AuthResponse(
            success=True,
            message="Token refreshed successfully",
            data=Token(**tokens)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.post("/logout", response_model=StandardResponse)
async def logout(
    request: Request,
    credentials: dict = Depends(security),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Logout user"""
    auth_service = AuthService(db)

    try:
        # Get refresh token from request (should be sent in logout request body)
        # For this example, we'll logout all sessions
        success = auth_service.logout_all_sessions(current_user.id)

        return StandardResponse(
            success=success,
            message="Logged out successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=StandardResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return StandardResponse(
        success=True,
        message="User information retrieved successfully",
        data={
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "avatar_url": current_user.avatar_url,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at,
            "last_login": current_user.last_login
        }
    )


@router.put("/me", response_model=StandardResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    auth_service = AuthService(db)

    try:
        updated_user = auth_service.update_user(current_user.id, user_data)

        return StandardResponse(
            success=True,
            message="User information updated successfully",
            data={
                "id": updated_user.id,
                "email": updated_user.email,
                "username": updated_user.username,
                "full_name": updated_user.full_name,
                "avatar_url": updated_user.avatar_url,
                "updated_at": updated_user.updated_at
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User update failed: {str(e)}"
        )


@router.post("/change-password", response_model=StandardResponse)
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)

    try:
        success = auth_service.change_password(current_user.id, password_data)

        return StandardResponse(
            success=success,
            message="Password changed successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )


@router.post("/logout-all", response_model=StandardResponse)
async def logout_all_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Logout user from all sessions"""
    auth_service = AuthService(db)

    try:
        success = auth_service.logout_all_sessions(current_user.id)

        return StandardResponse(
            success=success,
            message="Logged out from all sessions successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout all sessions failed: {str(e)}"
        )


@router.get("/verify-token", response_model=StandardResponse)
async def verify_token(
    current_user: User = Depends(get_current_active_user)
):
    """Verify if current token is valid"""
    return StandardResponse(
        success=True,
        message="Token is valid",
        data={
            "user_id": current_user.id,
            "username": current_user.username,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified
        }
    )