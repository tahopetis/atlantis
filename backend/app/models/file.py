from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..core.database import Base


class FileType(enum.Enum):
    """Supported file types for diagram storage"""
    MERMAID = "mmd"
    JSON = "json"
    MARKDOWN = "md"
    PNG = "png"
    SVG = "svg"


class DiagramFile(Base):
    """File metadata model for diagram files"""
    __tablename__ = "diagram_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)  # Original filename
    display_name = Column(String(255), nullable=False)  # User-friendly name
    description = Column(Text)  # Optional description
    file_type = Column(Enum(FileType), nullable=False)
    file_path = Column(String(500), nullable=False)  # Secure file path on disk
    file_size = Column(Integer, nullable=False)  # File size in bytes
    file_hash = Column(String(64), nullable=False)  # SHA-256 hash for integrity

    # Content metadata
    mermaid_code = Column(Text)  # Extracted Mermaid code (for .mmd files)
    diagram_data = Column(JSON)  # Complete diagram data (for .json files)
    tags = Column(JSON)  # Tags as JSON array
    metadata = Column(JSON)  # Additional metadata as JSON

    # Foreign key to user (owner)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="files")

    # Project/folder organization
    project_name = Column(String(255))  # Optional project grouping
    folder_path = Column(String(500))  # Internal folder structure

    # Version control integration
    git_repo_id = Column(Integer, ForeignKey("git_tokens.id"))  # Associated Git repo
    git_repo = relationship("GitToken")
    git_path = Column(String(500))  # Path in Git repository
    git_branch = Column(String(100))  # Git branch
    git_commit = Column(String(40))  # Last commit hash

    # Status and flags
    is_public = Column(Boolean, default=False)  # Public sharing flag
    is_archived = Column(Boolean, default=False)  # Archive flag
    is_deleted = Column(Boolean, default=False)  # Soft delete flag
    is_versioned = Column(Boolean, default=True)  # Version control enabled

    # Access control
    share_token = Column(String(64))  # Unique token for sharing
    share_expires_at = Column(DateTime(timezone=True))  # Share expiration

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_accessed_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<DiagramFile(id={self.id}, filename='{self.filename}', owner_id={self.user_id})>"


class FileVersion(Base):
    """Version history for diagram files"""
    __tablename__ = "file_versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("diagram_files.id"), nullable=False)
    file = relationship("DiagramFile", back_populates="versions")

    version_number = Column(Integer, nullable=False)  # Sequential version number
    version_name = Column(String(255))  # Optional version name/tag
    change_description = Column(Text)  # Description of changes

    # File state at this version
    file_path = Column(String(500), nullable=False)  # Path to version file
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False)

    # Content snapshots
    mermaid_code = Column(Text)
    diagram_data = Column(JSON)
    metadata = Column(JSON)

    # Git integration
    git_commit = Column(String(40))  # Git commit hash for this version
    git_branch = Column(String(100))

    # Author information
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<FileVersion(id={self.id}, file_id={self.file_id}, version={self.version_number})>"


class FileShare(Base):
    """File sharing information"""
    __tablename__ = "file_shares"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("diagram_files.id"), nullable=False)
    file = relationship("DiagramFile")

    # Sharing details
    share_token = Column(String(64), unique=True, nullable=False, index=True)
    share_type = Column(Enum(enum.Enum('ShareType', 'PUBLIC LINK PASSWORD')),
                       default='LINK', nullable=False)
    password_hash = Column(String(255))  # For password-protected shares

    # Access control
    can_view = Column(Boolean, default=True)
    can_edit = Column(Boolean, default=False)
    can_download = Column(Boolean, default=True)
    can_comment = Column(Boolean, default=False)

    # Sharing metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User")

    # Usage tracking
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True))

    # Expiration and limits
    expires_at = Column(DateTime(timezone=True))
    max_views = Column(Integer)  # Maximum number of views allowed
    max_downloads = Column(Integer)  # Maximum number of downloads allowed

    # Status
    is_active = Column(Boolean, default=True)
    is_revoked = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<FileShare(id={self.id}, file_id={self.file_id}, token='{self.share_token}')>"


# Add relationships to User model
User.files = relationship("DiagramFile", back_populates="owner", cascade="all, delete-orphan")
DiagramFile.versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")