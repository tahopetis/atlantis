from fastapi import APIRouter

from .diagrams import router as diagrams_router
from .git import router as git_router
from .users import router as users_router

api_router = APIRouter()

api_router.include_router(diagrams_router, prefix="/diagrams", tags=["diagrams"])
api_router.include_router(git_router, prefix="/git", tags=["git"])
api_router.include_router(users_router, prefix="/users", tags=["users"])