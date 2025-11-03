from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.git_service import (
    git_service,
    GitRepositoryInfo,
    GitCommitInfo,
    GitServiceError,
    RepositoryNotFoundError,
    InvalidRepositoryError,
    GitOperationError,
    SecurityError
)
from app.core.database import get_db
from app.services.git_token_service import GitTokenService
from app.middleware.auth import get_current_active_user
from app.models.user import User

router = APIRouter()


class GitRepository(BaseModel):
    id: str
    name: str
    url: str
    local_path: str
    default_branch: str = "main"
    current_branch: str = "main"
    is_bare: bool = False
    is_dirty: bool = False
    last_commit_hash: Optional[str] = None
    last_commit_message: Optional[str] = None
    last_commit_author: Optional[str] = None
    last_commit_date: Optional[datetime] = None


class GitCommit(BaseModel):
    hash: str
    message: str
    author: str
    date: datetime
    files: List[str]


class GitOperationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class CreateRepositoryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Repository name")
    url: Optional[str] = Field(None, description="Git URL to clone (optional for new repo)")
    init_bare: bool = Field(False, description="Initialize as bare repository")


class CommitRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Commit message")
    files: Optional[List[str]] = Field(None, description="Files to commit (empty for all changes)")
    author_name: Optional[str] = Field(None, description="Author name")
    author_email: Optional[str] = Field(None, description="Author email")


class PushPullRequest(BaseModel):
    remote: str = Field("origin", description="Remote name")
    branch: Optional[str] = Field(None, description="Branch name")
    username: Optional[str] = Field(None, description="Username for authentication")
    password: Optional[str] = Field(None, description="Password for authentication")
    token: Optional[str] = Field(None, description="Token for authentication")


class CreateBranchRequest(BaseModel):
    branch_name: str = Field(..., min_length=1, max_length=100, description="New branch name")
    base_branch: Optional[str] = Field(None, description="Base branch to create from")


class FileOperationRequest(BaseModel):
    file_path: str = Field(..., description="File path")
    content: str = Field(..., description="File content")


def handle_git_error(func):
    """Decorator to handle Git service errors and convert to HTTP exceptions"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except SecurityError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except RepositoryNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except InvalidRepositoryError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except GitOperationError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except GitServiceError as e:
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    return wrapper


@router.get("/repositories", response_model=List[GitRepository])
async def get_repositories(
    current_user: User = Depends(get_current_active_user)
):
    """Get all Git repositories"""
    try:
        repo_infos = git_service.list_repositories()
        return [
            GitRepository(
                id=repo.id,
                name=repo.name,
                url=repo.url,
                local_path=repo.local_path,
                default_branch=repo.default_branch,
                current_branch=repo.current_branch,
                is_bare=repo.is_bare,
                is_dirty=repo.is_dirty,
                last_commit_hash=repo.last_commit_hash,
                last_commit_message=repo.last_commit_message,
                last_commit_author=repo.last_commit_author,
                last_commit_date=repo.last_commit_date
            )
            for repo in repo_infos
        ]
    except SecurityError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except RepositoryNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidRepositoryError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except GitOperationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except GitServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/repositories", response_model=GitOperationResponse)
@handle_git_error
async def create_repository(
    request: CreateRepositoryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new Git repository"""
    repo_info = git_service.create_repository(
        name=request.name,
        url=request.url,
        init_bare=request.init_bare
    )

    repo = GitRepository(
        id=repo_info.id,
        name=repo_info.name,
        url=request.url or "",
        local_path=repo_info.local_path,
        default_branch=repo_info.default_branch,
        current_branch=repo_info.current_branch,
        is_bare=repo_info.is_bare,
        is_dirty=repo_info.is_dirty,
        last_commit_hash=repo_info.last_commit_hash,
        last_commit_message=repo_info.last_commit_message,
        last_commit_author=repo_info.last_commit_author,
        last_commit_date=repo_info.last_commit_date
    )

    return GitOperationResponse(
        success=True,
        message="Repository created successfully",
        data=repo.dict()
    )


@router.get("/repositories/{repo_id}", response_model=GitRepository)
@handle_git_error
async def get_repository(repo_id: str):
    """Get repository information"""
    repo_info = git_service.get_repository_info(repo_id)

    return GitRepository(
        id=repo_info.id,
        name=repo_info.name,
        url="",  # URL is not stored in git service
        local_path=repo_info.local_path,
        default_branch=repo_info.default_branch,
        current_branch=repo_info.current_branch,
        is_bare=repo_info.is_bare,
        is_dirty=repo_info.is_dirty,
        last_commit_hash=repo_info.last_commit_hash,
        last_commit_message=repo_info.last_commit_message,
        last_commit_author=repo_info.last_commit_author,
        last_commit_date=repo_info.last_commit_date
    )


@router.delete("/repositories/{repo_id}", response_model=GitOperationResponse)
@handle_git_error
async def delete_repository(repo_id: str):
    """Delete a repository"""
    git_service.delete_repository(repo_id)

    return GitOperationResponse(
        success=True,
        message="Repository deleted successfully"
    )


@router.get("/repositories/{repo_id}/commits", response_model=List[GitCommit])
@handle_git_error
async def get_commits(repo_id: str, branch: Optional[str] = None, limit: int = 50, skip: int = 0):
    """Get commits for a repository"""
    commits = git_service.get_commits(repo_id, branch=branch, limit=limit, skip=skip)

    return [
        GitCommit(
            hash=commit.hash,
            message=commit.message,
            author=commit.author,
            date=commit.date,
            files=commit.files
        )
        for commit in commits
    ]


@router.get("/repositories/{repo_id}/commits/{commit_hash}", response_model=GitCommit)
@handle_git_error
async def get_commit_details(repo_id: str, commit_hash: str):
    """Get detailed information about a specific commit"""
    commit = git_service.get_commit_details(repo_id, commit_hash)

    return GitCommit(
        hash=commit.hash,
        message=commit.message,
        author=commit.author,
        date=commit.date,
        files=commit.files
    )


@router.post("/repositories/{repo_id}/commit", response_model=GitOperationResponse)
@handle_git_error
async def commit_changes(repo_id: str, request: CommitRequest):
    """Commit changes to a repository"""
    commit_hash = git_service.create_commit(
        repo_id=repo_id,
        message=request.message,
        files=request.files,
        author_name=request.author_name,
        author_email=request.author_email
    )

    return GitOperationResponse(
        success=True,
        message=f"Changes committed successfully",
        data={"commit_hash": commit_hash}
    )


@router.get("/repositories/{repo_id}/status", response_model=Dict[str, Any])
@handle_git_error
async def get_repository_status(repo_id: str):
    """Get repository status"""
    status = git_service.get_status(repo_id)
    return status


@router.get("/repositories/{repo_id}/branches", response_model=List[str])
@handle_git_error
async def get_branches(repo_id: str):
    """Get all branches in the repository"""
    return git_service.get_branches(repo_id)


@router.post("/repositories/{repo_id}/branches", response_model=GitOperationResponse)
@handle_git_error
async def create_branch(repo_id: str, request: CreateBranchRequest):
    """Create a new branch"""
    branch_name = git_service.create_branch(
        repo_id=repo_id,
        branch_name=request.branch_name,
        base_branch=request.base_branch
    )

    return GitOperationResponse(
        success=True,
        message=f"Branch '{branch_name}' created successfully",
        data={"branch_name": branch_name}
    )


@router.post("/repositories/{repo_id}/branches/{branch_name}/checkout", response_model=GitOperationResponse)
@handle_git_error
async def switch_branch(repo_id: str, branch_name: str):
    """Switch to a different branch"""
    git_service.switch_branch(repo_id, branch_name)

    return GitOperationResponse(
        success=True,
        message=f"Switched to branch '{branch_name}'",
        data={"branch_name": branch_name}
    )


@router.get("/repositories/{repo_id}/files/{file_path:path}")
@handle_git_error
async def read_file(repo_id: str, file_path: str, commit_hash: Optional[str] = None):
    """Read file content from repository"""
    content = git_service.read_file(repo_id, file_path, commit_hash=commit_hash)
    return {"content": content}


@router.post("/repositories/{repo_id}/files/{file_path:path}", response_model=GitOperationResponse)
@handle_git_error
async def write_file(repo_id: str, file_path: str, request: FileOperationRequest):
    """Write file content to repository"""
    git_service.write_file(repo_id, file_path, request.content)

    return GitOperationResponse(
        success=True,
        message=f"File '{file_path}' written successfully"
    )


@router.post("/repositories/{repo_id}/push", response_model=GitOperationResponse)
@handle_git_error
async def push_changes(repo_id: str, request: PushPullRequest):
    """Push changes to remote repository"""
    git_service.push(
        repo_id=repo_id,
        remote=request.remote,
        branch=request.branch,
        username=request.username,
        password=request.password,
        token=request.token
    )

    return GitOperationResponse(
        success=True,
        message="Changes pushed successfully",
        data={"remote": request.remote, "branch": request.branch}
    )


@router.post("/repositories/{repo_id}/pull", response_model=GitOperationResponse)
@handle_git_error
async def pull_changes(repo_id: str, request: PushPullRequest):
    """Pull changes from remote repository"""
    git_service.pull(
        repo_id=repo_id,
        remote=request.remote,
        branch=request.branch,
        username=request.username,
        password=request.password,
        token=request.token
    )

    return GitOperationResponse(
        success=True,
        message="Changes pulled successfully",
        data={"remote": request.remote, "branch": request.branch}
    )