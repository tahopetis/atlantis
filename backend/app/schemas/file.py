from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from ..models.file import FileType


class FileTypeEnum(str, Enum):
    """File type enumeration for API"""
    MERMAID = "mmd"
    JSON = "json"
    MARKDOWN = "md"
    PNG = "png"
    SVG = "svg"


class ShareTypeEnum(str, Enum):
    """Share type enumeration"""
    LINK = "link"
    PUBLIC = "public"
    PASSWORD = "password"


# Base schemas
class FileBase(BaseModel):
    """Base schema for file operations"""
    display_name: str = Field(..., min_length=1, max_length=255, description="Display name for the file")
    description: Optional[str] = Field(None, max_length=2000, description="Optional description")
    tags: Optional[List[str]] = Field(default_factory=list, description="List of tags")
    project_name: Optional[str] = Field(None, max_length=255, description="Project name for organization")
    folder_path: Optional[str] = Field(None, max_length=500, description="Folder path for organization")
    is_public: bool = Field(default=False, description="Whether the file is publicly accessible")


class FileCreate(FileBase):
    """Schema for creating new files"""
    file_type: FileTypeEnum = Field(..., description="File type")
    content: str = Field(..., description="File content")
    mermaid_code: Optional[str] = Field(None, description="Mermaid code (extracted from content)")
    diagram_data: Optional[Dict[str, Any]] = Field(None, description="Complete diagram data")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    git_repo_id: Optional[int] = Field(None, description="Associated Git repository ID")
    git_path: Optional[str] = Field(None, max_length=500, description="Path in Git repository")
    git_branch: Optional[str] = Field(None, max_length=100, description="Git branch")

    @validator('content')
    def validate_content(cls, v, values):
        """Validate content based on file type"""
        if 'file_type' in values:
            file_type = values['file_type']
            max_size = {
                'mmd': 100000,  # 100KB for Mermaid files
                'json': 1000000,  # 1MB for JSON files
                'md': 500000,  # 500KB for Markdown files
                'png': 5000000,  # 5MB for PNG files
                'svg': 1000000  # 1MB for SVG files
            }

            if len(v.encode('utf-8')) > max_size.get(file_type, 1000000):
                raise ValueError(f"Content too large for {file_type} files")

        return v

    @validator('mermaid_code')
    def validate_mermaid_code(cls, v, values):
        """Validate Mermaid code if provided"""
        if v and len(v) > 50000:  # 50KB max for Mermaid code
            raise ValueError("Mermaid code too large")
        return v


class FileUpdate(BaseModel):
    """Schema for updating files"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    tags: Optional[List[str]] = None
    project_name: Optional[str] = Field(None, max_length=255)
    folder_path: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    content: Optional[str] = None
    mermaid_code: Optional[str] = None
    diagram_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class FileResponse(BaseModel):
    """Schema for file response"""
    id: int
    filename: str
    display_name: str
    description: Optional[str]
    file_type: FileTypeEnum
    file_size: int
    file_hash: str
    mermaid_code: Optional[str]
    diagram_data: Optional[Dict[str, Any]]
    tags: List[str]
    metadata: Optional[Dict[str, Any]]
    user_id: int
    project_name: Optional[str]
    folder_path: Optional[str]
    is_public: bool
    is_archived: bool
    git_repo_id: Optional[int]
    git_path: Optional[str]
    git_branch: Optional[str]
    git_commit: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime]

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    """Schema for file list response"""
    files: List[FileResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class FileDeleteResponse(BaseModel):
    """Schema for file deletion response"""
    success: bool
    message: str
    file_id: int


class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    success: bool
    message: str
    file: FileResponse


class FileDownloadResponse(BaseModel):
    """Schema for file download response"""
    success: bool
    message: str
    filename: str
    content_type: str
    content: str
    size: int


# File version schemas
class FileVersionCreate(BaseModel):
    """Schema for creating file versions"""
    version_name: Optional[str] = Field(None, max_length=255)
    change_description: Optional[str] = Field(None, max_length=1000)
    content: str = Field(..., description="File content for this version")
    mermaid_code: Optional[str] = None
    diagram_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class FileVersionResponse(BaseModel):
    """Schema for file version response"""
    id: int
    file_id: int
    version_number: int
    version_name: Optional[str]
    change_description: Optional[str]
    file_size: int
    file_hash: str
    mermaid_code: Optional[str]
    diagram_data: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]
    git_commit: Optional[str]
    git_branch: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class FileVersionListResponse(BaseModel):
    """Schema for file version list response"""
    versions: List[FileVersionResponse]
    total: int
    current_version: int


# File sharing schemas
class FileShareCreate(BaseModel):
    """Schema for creating file shares"""
    share_type: ShareTypeEnum = Field(default=ShareTypeEnum.LINK)
    password: Optional[str] = Field(None, min_length=4, max_length=128)
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_download: bool = Field(default=True)
    can_comment: bool = Field(default=False)
    expires_at: Optional[datetime] = None
    max_views: Optional[int] = Field(None, ge=1, le=10000)
    max_downloads: Optional[int] = Field(None, ge=1, le=1000)

    @validator('password')
    def validate_password(cls, v, values):
        """Validate password for password-protected shares"""
        if v and len(v) < 4:
            raise ValueError("Password must be at least 4 characters long")
        if v and not v:
            raise ValueError("Password cannot be empty")
        return v


class FileShareResponse(BaseModel):
    """Schema for file share response"""
    id: int
    file_id: int
    share_token: str
    share_type: ShareTypeEnum
    can_view: bool
    can_edit: bool
    can_download: bool
    can_comment: bool
    view_count: int
    download_count: int
    last_accessed_at: Optional[datetime]
    expires_at: Optional[datetime]
    max_views: Optional[int]
    max_downloads: Optional[int]
    is_active: bool
    is_revoked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FileShareAccessResponse(BaseModel):
    """Schema for file share access response"""
    success: bool
    message: str
    file: Optional[FileResponse] = None
    share: Optional[FileShareResponse] = None
    requires_password: bool = False


# Search and filter schemas
class FileSearchQuery(BaseModel):
    """Schema for file search queries"""
    query: Optional[str] = Field(None, min_length=1, max_length=100)
    file_types: Optional[List[FileTypeEnum]] = None
    tags: Optional[List[str]] = None
    project_name: Optional[str] = None
    is_public: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = Field(default="created_at", regex="^(created_at|updated_at|display_name|file_size)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class FileStatsResponse(BaseModel):
    """Schema for file statistics response"""
    total_files: int
    total_size: int
    files_by_type: Dict[str, int]
    files_by_project: Dict[str, int]
    recent_files: List[FileResponse]
    storage_used: int
    storage_limit: int