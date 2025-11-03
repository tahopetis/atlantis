from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timezone
import time
import json
from ..core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if settings.ENABLE_SECURITY_HEADERS:
            # Content Security Policy
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
            response.headers["Content-Security-Policy"] = csp

            # X-Content-Type-Options
            response.headers["X-Content-Type-Options"] = "nosniff"

            # X-Frame-Options
            response.headers["X-Frame-Options"] = "DENY"

            # X-XSS-Protection
            response.headers["X-XSS-Protection"] = "1; mode=block"

            # Strict-Transport-Security (HTTPS only)
            if settings.ENVIRONMENT == "production":
                hsts = "max-age=31536000; includeSubDomains; preload"
                response.headers["Strict-Transport-Security"] = hsts

            # Referrer Policy
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            # Permissions Policy
            permissions_policy = (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "accelerometer=()"
            )
            response.headers["Permissions-Policy"] = permissions_policy

        return response


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware to log API requests for audit purposes"""

    async def dispatch(self, request: Request, call_next):
        if not settings.ENABLE_AUDIT_LOG:
            return await call_next(request)

        start_time = time.time()

        # Get request details
        method = request.method
        url = str(request.url)
        user_agent = request.headers.get("user-agent", "")
        forwarded_for = request.headers.get("x-forwarded-for")
        ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log request details (in production, you'd use a proper logging system)
        log_data = {
            "method": method,
            "url": url,
            "status_code": response.status_code,
            "process_time": process_time,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Add user info if available (from authentication middleware)
        if hasattr(request.state, "user_id"):
            log_data["user_id"] = request.state.user_id
            log_data["username"] = request.state.username

        # Log to console for now (in production, use proper logging)
        if settings.DEBUG:
            print(f"AUDIT: {json.dumps(log_data)}")

        return response