from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import time
import json

from ..core.database import get_db
from ..core.security import verify_token
from ..services.auth_service import AuthService
from ..models.user import User
from ..schemas.auth import TokenData

# HTTP Bearer scheme for token extraction
security = HTTPBearer()


class JWTMiddleware:
    """JWT authentication middleware"""

    def __init__(self, required_scopes: Optional[List[str]] = None):
        self.required_scopes = required_scopes or []

    def __call__(
        self,
        request: Request,
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ) -> User:
        """Authenticate and authorize user"""
        try:
            # Verify token
            payload = verify_token(credentials.credentials, "access")

            # Extract user information
            user_id = int(payload.get("sub"))
            username = payload.get("username")
            scopes = payload.get("scopes", [])

            # Check required scopes
            if self.required_scopes:
                if not any(scope in scopes for scope in self.required_scopes):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Insufficient permissions"
                    )

            # Get user from database
            auth_service = AuthService(db)
            user = auth_service.get_current_user(credentials.credentials)

            # Add user to request state for later use
            request.state.user = user
            request.state.user_id = user.id
            request.state.username = user.username

            return user

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}"
            )


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    try:
        auth_service = AuthService(db)
        return auth_service.get_current_user(credentials.credentials)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    try:
        token = auth_header.split(" ")[1]
        auth_service = AuthService(db)
        return auth_service.get_current_user(token)
    except:
        return None


class RateLimitMiddleware:
    """Rate limiting middleware for API endpoints"""

    def __init__(self):
        self.requests: Dict[str, List[datetime]] = {}
        self.rate_limits = {
            "login": {"requests": 5, "window": 300},  # 5 login attempts per 5 minutes
            "register": {"requests": 3, "window": 600},  # 3 registrations per 10 minutes
            "password_reset": {"requests": 3, "window": 600},  # 3 password resets per 10 minutes
            "default": {"requests": 100, "window": 3600}  # 100 requests per hour
        }

    def check_rate_limit(
        self,
        request: Request,
        endpoint_type: str = "default",
        identifier: Optional[str] = None
    ) -> bool:
        """Check if request is within rate limits"""
        # Get identifier for rate limiting
        if identifier:
            key = identifier
        else:
            # Use IP address as default identifier
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                key = forwarded_for.split(",")[0].strip()
            else:
                key = request.client.host

        # Get rate limit settings
        rate_limit = self.rate_limits.get(endpoint_type, self.rate_limits["default"])
        max_requests = rate_limit["requests"]
        window_seconds = rate_limit["window"]

        # Clean old requests
        current_time = datetime.now(timezone.utc)
        if key in self.requests:
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if (current_time - req_time).total_seconds() < window_seconds
            ]
        else:
            self.requests[key] = []

        # Check if under limit
        if len(self.requests[key]) >= max_requests:
            return False

        # Add current request
        self.requests[key].append(current_time)
        return True

    def get_rate_limit_headers(
        self,
        request: Request,
        endpoint_type: str = "default",
        identifier: Optional[str] = None
    ) -> Dict[str, str]:
        """Get rate limit headers for response"""
        # Get identifier
        if identifier:
            key = identifier
        else:
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                key = forwarded_for.split(",")[0].strip()
            else:
                key = request.client.host

        # Get rate limit settings
        rate_limit = self.rate_limits.get(endpoint_type, self.rate_limits["default"])
        max_requests = rate_limit["requests"]
        window_seconds = rate_limit["window"]

        # Get current request count
        current_count = 0
        if key in self.requests:
            current_time = datetime.now(timezone.utc)
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if (current_time - req_time).total_seconds() < window_seconds
            ]
            current_count = len(self.requests[key])

        # Calculate reset time
        reset_time = int(time.time()) + window_seconds

        return {
            "X-RateLimit-Limit": str(max_requests),
            "X-RateLimit-Remaining": str(max(0, max_requests - current_count)),
            "X-RateLimit-Reset": str(reset_time)
        }


# Dependency functions for specific endpoint types
def require_auth() -> JWTMiddleware:
    """Require authentication"""
    return JWTMiddleware()


def require_verified_user() -> JWTMiddleware:
    """Require verified user"""
    return JWTMiddleware(["verified"])


def require_admin() -> JWTMiddleware:
    """Require admin privileges"""
    return JWTMiddleware(["admin"])


def check_rate_limit_login(request: Request) -> bool:
    """Check rate limit for login endpoint"""
    middleware = RateLimitMiddleware()
    if not middleware.check_rate_limit(request, "login"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    return True


def check_rate_limit_register(request: Request) -> bool:
    """Check rate limit for registration endpoint"""
    middleware = RateLimitMiddleware()
    if not middleware.check_rate_limit(request, "register"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    return True


def check_rate_limit_password_reset(request: Request) -> bool:
    """Check rate limit for password reset endpoint"""
    middleware = RateLimitMiddleware()
    if not middleware.check_rate_limit(request, "password_reset"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset attempts. Please try again later."
        )
    return True


def get_rate_limit_headers_decorator(endpoint_type: str = "default"):
    """Decorator to add rate limit headers to response"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                # Try to get request from kwargs
                request = kwargs.get("request")

            if request:
                middleware = RateLimitMiddleware()
                headers = middleware.get_rate_limit_headers(request, endpoint_type)
                # Store headers in request state for later use
                request.state.rate_limit_headers = headers

            return func(*args, **kwargs)
        return wrapper
    return decorator