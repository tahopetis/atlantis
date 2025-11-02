from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class User(BaseModel):
    id: str
    username: str
    email: str
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    success: bool
    data: Optional[User] = None
    message: Optional[str] = None


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get the current authenticated user"""
    # Placeholder - actual authentication will be implemented later
    user = User(
        id="user123",
        username="demo_user",
        email="demo@atlantis.dev"
    )
    return UserResponse(success=True, data=user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(user_data: dict):
    """Update current user profile"""
    # Placeholder - actual user update logic will be implemented later
    user = User(
        id="user123",
        username=user_data.get("username", "demo_user"),
        email=user_data.get("email", "demo@atlantis.dev")
    )
    return UserResponse(
        success=True,
        data=user,
        message="User profile updated successfully"
    )