from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class GitRepository(BaseModel):
    id: str
    name: str
    url: str
    local_path: str
    default_branch: str = "main"
    current_branch: str = "main"


class GitCommit(BaseModel):
    hash: str
    message: str
    author: str
    date: str
    files: List[str]


class GitOperationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


# Temporary in-memory storage
repositories_db = {}


@router.get("/repositories", response_model=List[GitRepository])
async def get_repositories():
    """Get all Git repositories"""
    return list(repositories_db.values())


@router.post("/repositories", response_model=GitOperationResponse)
async def add_repository(repo_data: dict):
    """Add a new Git repository"""
    import uuid
    repo = GitRepository(
        id=str(uuid.uuid4()),
        name=repo_data.get("name"),
        url=repo_data.get("url"),
        local_path=repo_data.get("local_path", f"./repos/{repo_data.get('name')}")
    )
    repositories_db[repo.id] = repo
    return GitOperationResponse(
        success=True,
        message="Repository added successfully",
        data=repo.dict()
    )


@router.get("/repositories/{repo_id}/commits", response_model=List[GitCommit])
async def get_commits(repo_id: str, branch: Optional[str] = None):
    """Get commits for a repository"""
    if repo_id not in repositories_db:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Placeholder data - actual Git operations will be implemented later
    return [
        GitCommit(
            hash="abc123",
            message="Initial commit",
            author="John Doe",
            date="2024-01-01T00:00:00Z",
            files=["diagram1.mmd", "diagram2.mmd"]
        )
    ]


@router.post("/repositories/{repo_id}/commit", response_model=GitOperationResponse)
async def commit_changes(repo_id: str, commit_data: dict):
    """Commit changes to a repository"""
    if repo_id not in repositories_db:
        raise HTTPException(status_code=404, detail="Repository not found")

    return GitOperationResponse(
        success=True,
        message=f"Committed {len(commit_data.get('files', []))} files",
        data={"commit_hash": "def456"}
    )


@router.post("/repositories/{repo_id}/push", response_model=GitOperationResponse)
async def push_changes(repo_id: str, push_data: dict):
    """Push changes to remote repository"""
    if repo_id not in repositories_db:
        raise HTTPException(status_code=404, detail="Repository not found")

    return GitOperationResponse(
        success=True,
        message="Changes pushed successfully",
        data={"branch": push_data.get("branch")}
    )


@router.post("/repositories/{repo_id}/pull", response_model=GitOperationResponse)
async def pull_changes(repo_id: str, pull_data: dict):
    """Pull changes from remote repository"""
    if repo_id not in repositories_db:
        raise HTTPException(status_code=404, detail="Repository not found")

    return GitOperationResponse(
        success=True,
        message="Changes pulled successfully",
        data={"branch": pull_data.get("branch")}
    )