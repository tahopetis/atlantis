from fastapi import APIRouter

from .diagrams import router as diagrams_router
from .git import router as git_router
from .users import router as users_router
from .auth import router as auth_router
from .git_tokens import router as git_tokens_router
from .files import router as files_router

api_router = APIRouter()

# Public endpoints
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Protected endpoints (require authentication)
api_router.include_router(diagrams_router, prefix="/diagrams", tags=["diagrams"])
api_router.include_router(files_router, prefix="/files", tags=["files"])
api_router.include_router(git_router, prefix="/git", tags=["git"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(git_tokens_router, prefix="/git-tokens", tags=["git-tokens"])