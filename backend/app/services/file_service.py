import os
import hashlib
import shutil
import json
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple, BinaryIO
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from fastapi import HTTPException, status, UploadFile
import mimetypes
import secrets
import re

from ..models.file import DiagramFile, FileVersion, FileType
from ..models.user import User
from ..schemas.file import (
    FileCreate, FileUpdate, FileVersionCreate, FileShareCreate,
    FileSearchQuery, FileUploadResponse, FileDownloadResponse
)
from ..core.config import settings
from ..core.database import get_db_context
from ..utils.file_validators import FileValidator


class FileStorageService:
    """Service for secure file storage operations"""

    def __init__(self, db: Session):
        self.db = db
        self.base_storage_path = Path(settings.FILE_STORAGE_PATH if hasattr(settings, 'FILE_STORAGE_PATH') else "./storage")
        self.max_file_size = settings.FILE_MAX_SIZE_MB * 1024 * 1024 if hasattr(settings, 'FILE_MAX_SIZE_MB') else 10 * 1024 * 1024
        self.allowed_extensions = {'.mmd', '.json', '.md', '.png', '.svg'}
        self._ensure_storage_directories()

    def _ensure_storage_directories(self):
        """Ensure storage directories exist"""
        # Create base storage directory
        self.base_storage_path.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        (self.base_storage_path / "users").mkdir(exist_ok=True)
        (self.base_storage_path / "temp").mkdir(exist_ok=True)
        (self.base_storage_path / "versions").mkdir(exist_ok=True)
        (self.base_storage_path / "backups").mkdir(exist_ok=True)

    def _get_user_storage_path(self, user_id: int) -> Path:
        """Get secure storage path for a user"""
        user_hash = hashlib.sha256(str(user_id).encode()).hexdigest()[:16]
        user_path = self.base_storage_path / "users" / user_hash
        user_path.mkdir(exist_ok=True)
        return user_path

    def _generate_unique_filename(self, user_id: int, original_filename: str, file_type: FileType) -> str:
        """Generate unique filename to prevent conflicts"""
        # Use the FileValidator for secure filename generation
        return FileValidator.generate_safe_filename(original_filename, file_type, user_id)

    def _calculate_file_hash(self, content: str) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _validate_file_content(self, content: str, file_type: FileType) -> Tuple[bool, Optional[str]]:
        """Validate file content based on type"""
        # Use the FileValidator for comprehensive validation
        return FileValidator.validate_content_by_type(content, file_type)

    def create_file(self, user_id: int, file_data: FileCreate) -> DiagramFile:
        """Create a new diagram file"""
        # Validate user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Validate file content and get file type
        file_type_enum = FileType(file_data.file_type.value)
        is_valid, error_msg = self._validate_file_content(file_data.content, file_type_enum)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # Generate secure filename
        original_filename = f"{file_data.display_name}.{file_data.file_type.value}"
        unique_filename = self._generate_unique_filename(user_id, original_filename, file_type_enum)
        user_path = self._get_user_storage_path(user_id)
        file_path = user_path / unique_filename

        # Calculate file hash
        file_hash = self._calculate_file_hash(file_data.content)

        # Check for duplicate files
        existing_file = self.db.query(DiagramFile).filter(
            and_(
                DiagramFile.user_id == user_id,
                DiagramFile.file_hash == file_hash,
                DiagramFile.is_deleted == False
            )
        ).first()

        if existing_file:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="File with identical content already exists"
            )

        try:
            # Write file to secure storage
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_data.content)

            # Create database record
            db_file = DiagramFile(
                filename=unique_filename,
                display_name=file_data.display_name,
                description=file_data.description,
                file_type=file_type_enum,
                file_path=str(file_path),
                file_size=len(file_data.content.encode('utf-8')),
                file_hash=file_hash,
                mermaid_code=file_data.mermaid_code or file_data.content if file_type_enum == FileType.MERMAID else None,
                diagram_data=file_data.diagram_data,
                tags=file_data.tags or [],
                file_metadata=file_data.file_metadata or {},
                user_id=user_id,
                project_name=file_data.project_name,
                folder_path=file_data.folder_path,
                is_public=file_data.is_public,
                git_repo_id=file_data.git_repo_id,
                git_path=file_data.git_path,
                git_branch=file_data.git_branch,
                is_versioned=True
            )

            self.db.add(db_file)
            self.db.commit()
            self.db.refresh(db_file)

            # Create initial version
            self._create_file_version(db_file.id, user_id, file_data.content, "Initial version")

            return db_file

        except Exception as e:
            # Clean up file if database operation fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create file: {str(e)}"
            )

    def _create_file_version(self, file_id: int, user_id: int, content: str,
                           change_description: str, version_name: Optional[str] = None) -> FileVersion:
        """Create a new version of a file"""
        file_record = self.db.query(DiagramFile).filter(DiagramFile.id == file_id).first()
        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        # Generate version filename
        versions_path = self.base_storage_path / "versions"
        versions_path.mkdir(exist_ok=True)

        version_filename = f"{file_record.filename}_v{file_record.versions.count() + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        version_path = versions_path / version_filename

        try:
            # Write version file
            with open(version_path, 'w', encoding='utf-8') as f:
                f.write(content)

            # Get next version number
            latest_version = self.db.query(FileVersion).filter(
                FileVersion.file_id == file_id
            ).order_by(desc(FileVersion.version_number)).first()

            next_version = (latest_version.version_number + 1) if latest_version else 1

            # Create version record
            db_version = FileVersion(
                file_id=file_id,
                version_number=next_version,
                version_name=version_name,
                change_description=change_description,
                file_path=str(version_path),
                file_size=len(content.encode('utf-8')),
                file_hash=self._calculate_file_hash(content),
                mermaid_code=file_record.mermaid_code,
                diagram_data=file_record.diagram_data,
                file_metadata=file_record.file_metadata,
                created_by=user_id
            )

            self.db.add(db_version)
            self.db.commit()
            self.db.refresh(db_version)

            return db_version

        except Exception as e:
            # Clean up version file if database operation fails
            if version_path.exists():
                version_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create file version: {str(e)}"
            )

    def get_file(self, file_id: int, user_id: int) -> DiagramFile:
        """Get a specific file with access control"""
        file_record = self.db.query(DiagramFile).filter(
            and_(
                DiagramFile.id == file_id,
                DiagramFile.user_id == user_id,
                DiagramFile.is_deleted == False
            )
        ).first()

        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or access denied"
            )

        # Update last accessed time
        file_record.last_accessed_at = datetime.now(timezone.utc)
        self.db.commit()

        return file_record

    def get_file_content(self, file_id: int, user_id: int) -> FileDownloadResponse:
        """Get file content with access control"""
        file_record = self.get_file(file_id, user_id)

        try:
            # Read file content
            with open(file_record.file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Determine content type
            content_type_map = {
                FileType.MERMAID: 'text/plain',
                FileType.JSON: 'application/json',
                FileType.MARKDOWN: 'text/markdown',
                FileType.PNG: 'image/png',
                FileType.SVG: 'image/svg+xml'
            }
            content_type = content_type_map.get(file_record.file_type, 'text/plain')

            return FileDownloadResponse(
                success=True,
                message="File retrieved successfully",
                filename=file_record.filename,
                content_type=content_type,
                content=content,
                size=file_record.file_size
            )

        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on disk"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read file: {str(e)}"
            )

    def update_file(self, file_id: int, user_id: int, file_data: FileUpdate) -> DiagramFile:
        """Update an existing file"""
        file_record = self.get_file(file_id, user_id)

        # Store original content for versioning
        try:
            with open(file_record.file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original file not found"
            )

        # Update database fields
        update_data = file_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'content':
                # Validate new content
                is_valid, error_msg = self._validate_file_content(value, file_record.file_type)
                if not is_valid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=error_msg
                    )

                # Update file on disk
                try:
                    with open(file_record.file_path, 'w', encoding='utf-8') as f:
                        f.write(value)
                    file_record.file_size = len(value.encode('utf-8'))
                    file_record.file_hash = self._calculate_file_hash(value)

                    # Update extracted content
                    if file_record.file_type == FileType.MERMAID:
                        file_record.mermaid_code = value
                    elif file_data.mermaid_code:
                        file_record.mermaid_code = file_data.mermaid_code
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to update file content: {str(e)}"
                    )
            elif field in ['diagram_data', 'file_metadata']:
                setattr(file_record, field, value)
            else:
                setattr(file_record, field, value)

        file_record.updated_at = datetime.now(timezone.utc)
        self.db.commit()

        # Create new version if content changed
        if 'content' in update_data and update_data['content'] != original_content:
            self._create_file_version(
                file_id, user_id, update_data['content'],
                "Updated file", file_data.display_name
            )

        self.db.refresh(file_record)
        return file_record

    def delete_file(self, file_id: int, user_id: int, permanent: bool = False) -> bool:
        """Delete a file (soft delete by default)"""
        file_record = self.db.query(DiagramFile).filter(
            and_(
                DiagramFile.id == file_id,
                DiagramFile.user_id == user_id,
                DiagramFile.is_deleted == False
            )
        ).first()

        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        if permanent:
            try:
                # Delete physical file
                if os.path.exists(file_record.file_path):
                    os.remove(file_record.file_path)

                # Delete versions
                versions = self.db.query(FileVersion).filter(
                    FileVersion.file_id == file_id
                ).all()

                for version in versions:
                    if os.path.exists(version.file_path):
                        os.remove(version.file_path)
                    self.db.delete(version)

                # Delete file record
                self.db.delete(file_record)
                self.db.commit()

            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to permanently delete file: {str(e)}"
                )
        else:
            # Soft delete
            file_record.is_deleted = True
            file_record.deleted_at = datetime.now(timezone.utc)
            self.db.commit()

        return True

    def list_files(self, user_id: int, query: Optional[FileSearchQuery] = None) -> Tuple[List[DiagramFile], int]:
        """List files for a user with search and filtering"""
        base_query = self.db.query(DiagramFile).filter(
            and_(
                DiagramFile.user_id == user_id,
                DiagramFile.is_deleted == False
            )
        )

        # Apply search and filters
        if query:
            # Text search
            if query.query:
                search_filter = or_(
                    DiagramFile.display_name.ilike(f"%{query.query}%"),
                    DiagramFile.description.ilike(f"%{query.query}%"),
                    DiagramFile.tags.ilike(f"%{query.query}%")
                )
                base_query = base_query.filter(search_filter)

            # File type filter
            if query.file_types:
                type_filter = DiagramFile.file_type.in_([FileType(ft.value) for ft in query.file_types])
                base_query = base_query.filter(type_filter)

            # Tags filter
            if query.tags:
                for tag in query.tags:
                    base_query = base_query.filter(DiagramFile.tags.ilike(f"%{tag}%"))

            # Project filter
            if query.project_name:
                base_query = base_query.filter(DiagramFile.project_name == query.project_name)

            # Public filter
            if query.is_public is not None:
                base_query = base_query.filter(DiagramFile.is_public == query.is_public)

            # Date range filter
            if query.date_from:
                base_query = base_query.filter(DiagramFile.created_at >= query.date_from)
            if query.date_to:
                base_query = base_query.filter(DiagramFile.created_at <= query.date_to)

            # Sorting
            sort_column = getattr(DiagramFile, query.sort_by, DiagramFile.created_at)
            if query.sort_order == "desc":
                base_query = base_query.order_by(desc(sort_column))
            else:
                base_query = base_query.order_by(asc(sort_column))

            # Pagination
            offset = (query.page - 1) * query.per_page
            base_query = base_query.offset(offset).limit(query.per_page)

        files = base_query.all()
        total = base_query.count() if not query else base_query.count()

        return files, total

    def get_file_versions(self, file_id: int, user_id: int) -> List[FileVersion]:
        """Get all versions of a file"""
        # Verify access
        self.get_file(file_id, user_id)

        versions = self.db.query(FileVersion).filter(
            FileVersion.file_id == file_id
        ).order_by(desc(FileVersion.version_number)).all()

        return versions

    def get_user_storage_stats(self, user_id: int) -> Dict[str, Any]:
        """Get storage statistics for a user"""
        files = self.db.query(DiagramFile).filter(
            and_(
                DiagramFile.user_id == user_id,
                DiagramFile.is_deleted == False
            )
        ).all()

        total_files = len(files)
        total_size = sum(f.file_size for f in files)

        # Files by type
        files_by_type = {}
        for file_type in FileType:
            count = sum(1 for f in files if f.file_type == file_type)
            if count > 0:
                files_by_type[file_type.value] = count

        # Files by project
        files_by_project = {}
        for file in files:
            project = file.project_name or "No Project"
            files_by_project[project] = files_by_project.get(project, 0) + 1

        # Recent files
        recent_files = sorted(files, key=lambda f: f.created_at, reverse=True)[:5]

        return {
            "total_files": total_files,
            "total_size": total_size,
            "files_by_type": files_by_type,
            "files_by_project": files_by_project,
            "recent_files": recent_files,
            "storage_limit": self.max_file_size * 100  # 100 files max
        }