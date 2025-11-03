from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime
from typing import Optional, List, Dict, Any
import httpx
import json
import base64

from ..models.user import GitToken, User, GitProvider
from ..schemas.auth import GitTokenCreate, GitTokenUpdate, GitTokenValidation
from ..core.security import encrypt_sensitive_data, decrypt_sensitive_data, mask_token


class GitTokenService:
    """Service for managing Git tokens and validation"""

    def __init__(self, db: Session):
        self.db = db

    def create_git_token(self, user_id: int, token_data: GitTokenCreate) -> GitToken:
        """Create a new Git token for user"""
        # Validate token with provider
        validation = self.validate_git_token(token_data.token, token_data.provider)
        if not validation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {token_data.provider.value} token: {validation.error_message}"
            )

        # Check if token name already exists for user
        existing_token = self.db.query(GitToken).filter(
            and_(
                GitToken.user_id == user_id,
                GitToken.name == token_data.name
            )
        ).first()

        if existing_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token name already exists for this user"
            )

        # Encrypt and store token
        encrypted_token = encrypt_sensitive_data(token_data.token)

        db_token = GitToken(
            user_id=user_id,
            name=token_data.name,
            provider=token_data.provider,
            token=encrypted_token,
            scopes=json.dumps(validation.scopes) if validation.scopes else None,
            expires_at=validation.expires_at
        )

        self.db.add(db_token)
        self.db.commit()
        self.db.refresh(db_token)

        return db_token

    def get_user_git_tokens(self, user_id: int, active_only: bool = True) -> List[GitToken]:
        """Get all Git tokens for a user"""
        query = self.db.query(GitToken).filter(GitToken.user_id == user_id)

        if active_only:
            query = query.filter(GitToken.is_active == True)

        return query.all()

    def get_git_token(self, token_id: int, user_id: int) -> GitToken:
        """Get a specific Git token"""
        token = self.db.query(GitToken).filter(
            and_(
                GitToken.id == token_id,
                GitToken.user_id == user_id
            )
        ).first()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Git token not found"
            )

        return token

    def update_git_token(
        self,
        token_id: int,
        user_id: int,
        token_data: GitTokenUpdate
    ) -> GitToken:
        """Update a Git token"""
        db_token = self.get_git_token(token_id, user_id)

        if token_data.name is not None:
            # Check if new name already exists
            existing_token = self.db.query(GitToken).filter(
                and_(
                    GitToken.user_id == user_id,
                    GitToken.name == token_data.name,
                    GitToken.id != token_id
                )
            ).first()

            if existing_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token name already exists for this user"
                )

            db_token.name = token_data.name

        if token_data.scopes is not None:
            db_token.scopes = json.dumps(token_data.scopes)

        if token_data.is_active is not None:
            db_token.is_active = token_data.is_active

        db_token.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_token)

        return db_token

    def delete_git_token(self, token_id: int, user_id: int) -> bool:
        """Delete a Git token"""
        db_token = self.get_git_token(token_id, user_id)

        self.db.delete(db_token)
        self.db.commit()

        return True

    def get_decrypted_token(self, token_id: int, user_id: int) -> str:
        """Get decrypted token for Git operations"""
        db_token = self.get_git_token(token_id, user_id)

        if not db_token.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token is inactive"
            )

        try:
            decrypted_token = decrypt_sensitive_data(db_token.token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt token"
            )

        # Update last used timestamp
        db_token.last_used = datetime.utcnow()
        self.db.commit()

        return decrypted_token

    def validate_git_token(self, token: str, provider: GitProvider) -> GitTokenValidation:
        """Validate a Git token with its provider"""
        try:
            if provider == GitProvider.GITHUB:
                return self._validate_github_token(token)
            elif provider == GitProvider.GITLAB:
                return self._validate_gitlab_token(token)
            elif provider == GitProvider.BITBUCKET:
                return self._validate_bitbucket_token(token)
            else:
                return GitTokenValidation(
                    is_valid=False,
                    error_message="Provider not supported for validation"
                )
        except Exception as e:
            return GitTokenValidation(
                is_valid=False,
                error_message=f"Validation failed: {str(e)}"
            )

    def _validate_github_token(self, token: str) -> GitTokenValidation:
        """Validate GitHub Personal Access Token"""
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }

        with httpx.Client() as client:
            # Test authentication by getting user info
            response = client.get(
                "https://api.github.com/user",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                user_data = response.json()

                # Get token metadata if possible
                scopes = response.headers.get("X-OAuth-Scopes", "").split(",") if response.headers.get("X-OAuth-Scopes") else []

                return GitTokenValidation(
                    is_valid=True,
                    username=user_data.get("login"),
                    scopes=[s.strip() for s in scopes if s.strip()]
                )
            else:
                return GitTokenValidation(
                    is_valid=False,
                    error_message=f"GitHub API error: {response.status_code}"
                )

    def _validate_gitlab_token(self, token: str) -> GitTokenValidation:
        """Validate GitLab Personal Access Token"""
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        with httpx.Client() as client:
            # Test authentication by getting user info
            response = client.get(
                "https://gitlab.com/api/v4/user",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                user_data = response.json()

                # Extract scopes from token info if available
                scopes = ["api", "read_api"]  # Default scopes for basic access

                return GitTokenValidation(
                    is_valid=True,
                    username=user_data.get("username"),
                    scopes=scopes
                )
            else:
                return GitTokenValidation(
                    is_valid=False,
                    error_message=f"GitLab API error: {response.status_code}"
                )

    def _validate_bitbucket_token(self, token: str) -> GitTokenValidation:
        """Validate Bitbucket App Password"""
        # Bitbucket uses username:app_password format
        if ":" not in token:
            return GitTokenValidation(
                is_valid=False,
                error_message="Bitbucket token should be in format 'username:app_password'"
            )

        username, app_password = token.split(":", 1)
        credentials = base64.b64encode(f"{username}:{app_password}".encode()).decode()

        headers = {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json"
        }

        with httpx.Client() as client:
            # Test authentication by getting user info
            response = client.get(
                "https://api.bitbucket.org/2.0/user",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                user_data = response.json()

                return GitTokenValidation(
                    is_valid=True,
                    username=user_data.get("username"),
                    scopes=["repositories"]  # Bitbucket app passwords have implicit scopes
                )
            else:
                return GitTokenValidation(
                    is_valid=False,
                    error_message=f"Bitbucket API error: {response.status_code}"
                )

    def get_token_for_git_operation(
        self,
        user_id: int,
        provider: GitProvider,
        repository_url: Optional[str] = None
    ) -> Optional[str]:
        """Get an active token for Git operations"""
        # Try to find an active token for the specified provider
        token = self.db.query(GitToken).filter(
            and_(
                GitToken.user_id == user_id,
                GitToken.provider == provider,
                GitToken.is_active == True
            )
        ).first()

        if token:
            # Update last used timestamp
            token.last_used = datetime.utcnow()
            self.db.commit()

            try:
                return decrypt_sensitive_data(token.token)
            except Exception:
                # Token decryption failed, deactivate it
                token.is_active = False
                self.db.commit()
                return None

        return None

    def deactivate_expired_tokens(self) -> int:
        """Deactivate tokens that have expired"""
        expired_tokens = self.db.query(GitToken).filter(
            and_(
                GitToken.expires_at < datetime.utcnow(),
                GitToken.is_active == True
            )
        ).all()

        for token in expired_tokens:
            token.is_active = False

        self.db.commit()
        return len(expired_tokens)

    def get_token_preview(self, token: GitToken) -> str:
        """Get a masked preview of the token for display"""
        try:
            # Try to decrypt a small portion for preview
            # This is just for display purposes, not for actual use
            return mask_token(decrypt_sensitive_data(token.token), 6)
        except:
            # If decryption fails, show a generic mask
            return "****"