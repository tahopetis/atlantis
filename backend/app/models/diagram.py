from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class DiagramBase(BaseModel):
    title: str
    description: Optional[str] = None
    mermaid_code: str
    tags: Optional[List[str]] = None


class DiagramCreate(DiagramBase):
    pass


class DiagramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    mermaid_code: Optional[str] = None
    tags: Optional[List[str]] = None


class Diagram(DiagramBase):
    id: str
    created_at: datetime
    updated_at: datetime
    git_path: Optional[str] = None
    git_branch: Optional[str] = None
    git_commit: Optional[str] = None

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )