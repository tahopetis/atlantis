from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..core.database import get_db
from ..schemas.auth import (
    GitTokenCreate, GitTokenUpdate, GitTokenResponse, GitTokenListResponse,
    GitTokenValidation, StandardResponse
)
from ..services.git_token_service import GitTokenService
from ..middleware.auth import get_current_active_user
from ..models.user import User

router = APIRouter()


@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_git_token(
    token_data: GitTokenCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new Git token"""
    git_token_service = GitTokenService(db)

    try:
        # Validate token with provider
        validation = git_token_service.validate_git_token(
            token_data.token,
            token_data.provider
        )

        if not validation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {token_data.provider.value} token: {validation.error_message}"
            )

        # Create token
        db_token = git_token_service.create_git_token(current_user.id, token_data)

        # Prepare response data
        response_data = {
            "id": db_token.id,
            "name": db_token.name,
            "provider": db_token.provider.value,
            "scopes": validation.scopes,
            "username": validation.username,
            "expires_at": validation.expires_at,
            "created_at": db_token.created_at,
            "is_active": db_token.is_active,
            "token_preview": git_token_service.get_token_preview(db_token)
        }

        return StandardResponse(
            success=True,
            message="Git token created successfully",
            data=response_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Git token: {str(e)}"
        )


@router.get("/", response_model=GitTokenListResponse)
async def get_git_tokens(
    active_only: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all Git tokens for current user"""
    git_token_service = GitTokenService(db)

    try:
        db_tokens = git_token_service.get_user_git_tokens(
            current_user.id,
            active_only=active_only
        )

        tokens_data = []
        for token in db_tokens:
            token_data = {
                "id": token.id,
                "name": token.name,
                "provider": token.provider.value,
                "is_active": token.is_active,
                "created_at": token.created_at,
                "updated_at": token.updated_at,
                "last_used": token.last_used,
                "expires_at": token.expires_at,
                "token_preview": git_token_service.get_token_preview(token)
            }

            # Add scopes if available
            if token.scopes:
                import json
                try:
                    token_data["scopes"] = json.loads(token.scopes)
                except:
                    token_data["scopes"] = []

            tokens_data.append(GitTokenResponse(**token_data))

        return GitTokenListResponse(
            success=True,
            message="Git tokens retrieved successfully",
            data=tokens_data
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve Git tokens: {str(e)}"
        )


@router.get("/{token_id}", response_model=StandardResponse)
async def get_git_token(
    token_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific Git token"""
    git_token_service = GitTokenService(db)

    try:
        db_token = git_token_service.get_git_token(token_id, current_user.id)

        # Prepare response data
        token_data = {
            "id": db_token.id,
            "name": db_token.name,
            "provider": db_token.provider.value,
            "is_active": db_token.is_active,
            "created_at": db_token.created_at,
            "updated_at": db_token.updated_at,
            "last_used": db_token.last_used,
            "expires_at": db_token.expires_at,
            "token_preview": git_token_service.get_token_preview(db_token)
        }

        # Add scopes if available
        if db_token.scopes:
            import json
            try:
                token_data["scopes"] = json.loads(db_token.scopes)
            except:
                token_data["scopes"] = []

        return StandardResponse(
            success=True,
            message="Git token retrieved successfully",
            data=token_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve Git token: {str(e)}"
        )


@router.put("/{token_id}", response_model=StandardResponse)
async def update_git_token(
    token_id: int,
    token_data: GitTokenUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a Git token"""
    git_token_service = GitTokenService(db)

    try:
        updated_token = git_token_service.update_git_token(
            token_id,
            current_user.id,
            token_data
        )

        # Prepare response data
        response_data = {
            "id": updated_token.id,
            "name": updated_token.name,
            "provider": updated_token.provider.value,
            "is_active": updated_token.is_active,
            "updated_at": updated_token.updated_at
        }

        # Add scopes if available
        if updated_token.scopes:
            import json
            try:
                response_data["scopes"] = json.loads(updated_token.scopes)
            except:
                response_data["scopes"] = []

        return StandardResponse(
            success=True,
            message="Git token updated successfully",
            data=response_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Git token: {str(e)}"
        )


@router.delete("/{token_id}", response_model=StandardResponse)
async def delete_git_token(
    token_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a Git token"""
    git_token_service = GitTokenService(db)

    try:
        success = git_token_service.delete_git_token(token_id, current_user.id)

        return StandardResponse(
            success=success,
            message="Git token deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Git token: {str(e)}"
        )


@router.post("/{token_id}/validate", response_model=StandardResponse)
async def validate_git_token(
    token_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate a stored Git token"""
    git_token_service = GitTokenService(db)

    try:
        # Get the token
        db_token = git_token_service.get_git_token(token_id, current_user.id)

        # Get decrypted token
        decrypted_token = git_token_service.get_decrypted_token(token_id, current_user.id)

        # Validate with provider
        validation = git_token_service.validate_git_token(
            decrypted_token,
            db_token.provider
        )

        if validation.is_valid:
            return StandardResponse(
                success=True,
                message="Token is valid",
                data={
                    "username": validation.username,
                    "scopes": validation.scopes,
                    "expires_at": validation.expires_at
                }
            )
        else:
            return StandardResponse(
                success=False,
                message="Token is invalid",
                data={
                    "error_message": validation.error_message
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate Git token: {str(e)}"
        )


@router.post("/validate", response_model=StandardResponse)
async def validate_new_git_token(
    token: str,
    provider: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate a Git token without storing it"""
    git_token_service = GitTokenService(db)

    try:
        # Convert provider string to enum
        from ..models.user import GitProvider
        try:
            provider_enum = GitProvider(provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider}. Supported providers: github, gitlab, bitbucket"
            )

        # Validate token
        validation = git_token_service.validate_git_token(token, provider_enum)

        if validation.is_valid:
            return StandardResponse(
                success=True,
                message="Token is valid",
                data={
                    "username": validation.username,
                    "scopes": validation.scopes,
                    "expires_at": validation.expires_at,
                    "provider": provider_enum.value
                }
            )
        else:
            return StandardResponse(
                success=False,
                message="Token is invalid",
                data={
                    "error_message": validation.error_message,
                    "provider": provider_enum.value
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate Git token: {str(e)}"
        )