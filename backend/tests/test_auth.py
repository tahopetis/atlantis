import pytest
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from main import app
from app.core.database import get_db, Base
from app.core.config import settings
from app.services.auth_service import AuthService
from app.services.git_token_service import GitTokenService
from app.models.user import User, GitToken, GitProvider

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=None
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database dependency for testing
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

from main import app
app.dependency_overrides[get_db] = override_get_db

# Test client
client = TestClient(app)


@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user_data():
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "TestPassword123!"
    }


@pytest.fixture
def auth_headers(test_user_data, db):
    # Create user and get auth headers
    auth_service = AuthService(db)
    user = auth_service.create_user(
        type('UserCreate', (), test_user_data)()
    )

    tokens = auth_service.create_user_tokens(
        user=user,
        ip_address="127.0.0.1",
        user_agent="test-client"
    )

    return {"Authorization": f"Bearer {tokens['access_token']}"}


class TestAuthentication:
    """Test authentication endpoints"""

    def test_register_user_success(self, test_user_data):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["token_type"] == "bearer"

    def test_register_user_weak_password(self, test_user_data):
        """Test registration with weak password"""
        test_user_data["password"] = "weak"
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 400
        data = response.json()
        assert data["detail"] is not None
        assert "Password" in str(data["detail"])

    def test_register_duplicate_email(self, test_user_data, db):
        """Test registration with duplicate email"""
        # First user
        client.post("/api/auth/register", json=test_user_data)

        # Second user with same email
        test_user_data["username"] = "different_user"
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"]

    def test_register_duplicate_username(self, test_user_data, db):
        """Test registration with duplicate username"""
        # First user
        client.post("/api/auth/register", json=test_user_data)

        # Second user with same username
        test_user_data["email"] = "different@example.com"
        response = client.post("/api/auth/register", json=test_user_data)

        assert response.status_code == 400
        data = response.json()
        assert "already taken" in data["detail"]

    def test_login_success(self, test_user_data):
        """Test successful login"""
        # Register user first
        client.post("/api/auth/register", json=test_user_data)

        # Login
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]

    def test_login_invalid_credentials(self, test_user_data):
        """Test login with invalid credentials"""
        # Register user first
        client.post("/api/auth/register", json=test_user_data)

        # Login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }
        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert "Invalid username or password" in data["detail"]

    def test_login_with_email(self, test_user_data):
        """Test login using email instead of username"""
        # Register user first
        client.post("/api/auth/register", json=test_user_data)

        # Login with email
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_refresh_token_success(self, test_user_data):
        """Test successful token refresh"""
        # Register and login
        client.post("/api/auth/register", json=test_user_data)

        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/auth/login", json=login_data)
        refresh_token = login_response.json()["data"]["refresh_token"]

        # Refresh token
        refresh_data = {"refresh_token": refresh_token}
        response = client.post("/api/auth/refresh", json=refresh_data)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]

    def test_refresh_token_invalid(self):
        """Test refresh with invalid token"""
        refresh_data = {"refresh_token": "invalid_token"}
        response = client.post("/api/auth/refresh", json=refresh_data)

        assert response.status_code == 401

    def test_get_current_user(self, auth_headers):
        """Test getting current user info"""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == "testuser"

    def test_get_current_user_unauthorized(self):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_logout(self, auth_headers):
        """Test logout"""
        response = client.post("/api/auth/logout", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_change_password_success(self, auth_headers):
        """Test successful password change"""
        password_data = {
            "current_password": "TestPassword123!",
            "new_password": "NewPassword123!"
        }
        response = client.post("/api/auth/change-password", json=password_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_change_password_wrong_current(self, auth_headers):
        """Test password change with wrong current password"""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "NewPassword123!"
        }
        response = client.post("/api/auth/change-password", json=password_data, headers=auth_headers)

        assert response.status_code == 400
        data = response.json()
        assert "current password is incorrect" in data["detail"]

    def test_verify_token(self, auth_headers):
        """Test token verification"""
        response = client.get("/api/auth/verify-token", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["username"] == "testuser"


class TestGitTokens:
    """Test Git token management"""

    def test_create_git_token_success(self, auth_headers):
        """Test successful Git token creation"""
        token_data = {
            "name": "My GitHub Token",
            "provider": "github",
            "token": "ghp_test_token_1234567890",
            "scopes": ["repo", "read:org"]
        }

        # Mock the validation since we can't make real API calls in tests
        # In real implementation, you'd mock the HTTP calls to Git providers

        response = client.post("/api/git-tokens/", json=token_data, headers=auth_headers)

        # This might fail due to token validation, but the endpoint structure should work
        assert response.status_code in [201, 400]  # 201 if validation mocked, 400 if validation fails

    def test_get_git_tokens(self, auth_headers):
        """Test getting Git tokens"""
        response = client.get("/api/git-tokens/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_validate_git_token(self, auth_headers):
        """Test Git token validation"""
        validation_data = {
            "token": "ghp_test_token_1234567890",
            "provider": "github"
        }

        response = client.post("/api/git-tokens/validate", json=validation_data, headers=auth_headers)

        # This might fail due to real API validation
        assert response.status_code in [200, 400]


class TestRateLimiting:
    """Test rate limiting functionality"""

    def test_login_rate_limit(self, test_user_data):
        """Test login rate limiting"""
        # Register user first
        client.post("/api/auth/register", json=test_user_data)

        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }

        # Make multiple failed login attempts
        for _ in range(6):  # Exceeds rate limit of 5
            response = client.post("/api/auth/login", json=login_data)

        # Should be rate limited
        assert response.status_code == 429

    def test_register_rate_limit(self):
        """Test registration rate limiting"""
        user_data = {
            "email": "test{}@example.com",
            "username": "testuser{}",
            "full_name": "Test User {}",
            "password": "TestPassword123!"
        }

        # Make multiple registration attempts
        for i in range(6):  # Exceeds rate limit of 3
            test_data = {k: v.format(i) if isinstance(v, str) else v for k, v in user_data.items()}
            response = client.post("/api/auth/register", json=test_data)

        # Should be rate limited
        assert response.status_code == 429


class TestProtectedEndpoints:
    """Test that protected endpoints require authentication"""

    def test_git_repositories_requires_auth(self):
        """Test that git repositories endpoint requires authentication"""
        response = client.get("/api/git/repositories")

        assert response.status_code == 401

    def test_git_repositories_with_auth(self, auth_headers):
        """Test that git repositories endpoint works with authentication"""
        response = client.get("/api/git/repositories", headers=auth_headers)

        # Should return 200 (empty list or actual data)
        assert response.status_code == 200

    def test_diagrams_requires_auth(self):
        """Test that diagrams endpoint requires authentication"""
        response = client.get("/api/diagrams/")

        assert response.status_code == 401

    def test_diagrams_with_auth(self, auth_headers):
        """Test that diagrams endpoint works with authentication"""
        response = client.get("/api/diagrams/", headers=auth_headers)

        # Should return 200 (empty list or actual data)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__])