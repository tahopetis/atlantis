from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.user import User
from app.models.file import DiagramFile, FileVersion
from app.schemas.file import (
    FileCreate, FileUpdate, FileResponse, FileListResponse,
    FileDeleteResponse, FileUploadResponse, FileDownloadResponse,
    FileVersionCreate, FileVersionResponse, FileVersionListResponse,
    FileSearchQuery, FileStatsResponse
)
from app.services.file_service import FileStorageService
from app.services.git_service import GitService

router = APIRouter()


@router.post("/", response_model=FileUploadResponse)
async def create_file(
    file_data: FileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new diagram file"""
    try:
        file_service = FileStorageService(db)
        db_file = file_service.create_file(current_user.id, file_data)

        # Integrate with Git if repository specified
        if file_data.git_repo_id and file_data.git_path:
            try:
                git_service = GitService(db)
                # Add file to Git repository
                await git_service.add_file_to_repository(
                    file_data.git_repo_id,
                    db_file.file_path,
                    file_data.git_path,
                    f"Add diagram: {file_data.display_name}"
                )
            except Exception as git_error:
                # Log Git error but don't fail file creation
                print(f"Git integration failed: {git_error}")

        return FileUploadResponse(
            success=True,
            message="File created successfully",
            file=db_file
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create file: {str(e)}"
        )


@router.get("/", response_model=FileListResponse)
async def list_files(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    query: Optional[str] = Query(None, description="Search query"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    project_name: Optional[str] = Query(None, description="Filter by project name"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's files with search and filtering"""
    try:
        file_service = FileStorageService(db)

        # Build search query
        search_query = FileSearchQuery(
            query=query,
            file_types=[file_type] if file_type else None,
            tags=tags.split(',') if tags else None,
            project_name=project_name,
            is_public=is_public,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )

        files, total = file_service.list_files(current_user.id, search_query)

        # Convert to response format
        file_responses = [FileResponse.from_orm(f) for f in files]

        has_next = (page * per_page) < total
        has_prev = page > 1

        return FileListResponse(
            files=file_responses,
            total=total,
            page=page,
            per_page=per_page,
            has_next=has_next,
            has_prev=has_prev
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific file"""
    try:
        file_service = FileStorageService(db)
        db_file = file_service.get_file(file_id, current_user.id)
        return FileResponse.from_orm(db_file)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file: {str(e)}"
        )


@router.get("/{file_id}/content", response_model=FileDownloadResponse)
async def get_file_content(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get file content"""
    try:
        file_service = FileStorageService(db)
        return file_service.get_file_content(file_id, current_user.id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file content: {str(e)}"
        )


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download a file"""
    try:
        file_service = FileStorageService(db)
        db_file = file_service.get_file(file_id, current_user.id)

        # Determine media type
        media_types = {
            "mmd": "text/plain",
            "json": "application/json",
            "md": "text/markdown",
            "png": "image/png",
            "svg": "image/svg+xml"
        }
        media_type = media_types.get(db_file.file_type.value, "text/plain")

        return FileResponse(
            path=db_file.file_path,
            filename=db_file.filename,
            media_type=media_type
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )


@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: int,
    file_data: FileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a file"""
    try:
        file_service = FileStorageService(db)
        updated_file = file_service.update_file(file_id, current_user.id, file_data)

        # Update in Git if repository specified
        if updated_file.git_repo_id and updated_file.git_path and file_data.content:
            try:
                git_service = GitService(db)
                await git_service.update_file_in_repository(
                    updated_file.git_repo_id,
                    updated_file.file_path,
                    updated_file.git_path,
                    f"Update diagram: {file_data.display_name or updated_file.display_name}"
                )
            except Exception as git_error:
                print(f"Git integration failed: {git_error}")

        return FileResponse.from_orm(updated_file)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update file: {str(e)}"
        )


@router.delete("/{file_id}", response_model=FileDeleteResponse)
async def delete_file(
    file_id: int,
    permanent: bool = Query(False, description="Permanently delete file"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a file (soft delete by default)"""
    try:
        file_service = FileStorageService(db)
        success = file_service.delete_file(file_id, current_user.id, permanent)

        if success:
            return FileDeleteResponse(
                success=True,
                message="File deleted successfully",
                file_id=file_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.get("/{file_id}/versions", response_model=FileVersionListResponse)
async def get_file_versions(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a file"""
    try:
        file_service = FileStorageService(db)
        versions = file_service.get_file_versions(file_id, current_user.id)

        # Get current file to determine current version
        current_file = file_service.get_file(file_id, current_user.id)
        current_version = len(versions)  # Latest version is current

        version_responses = [FileVersionResponse.from_orm(v) for v in versions]

        return FileVersionListResponse(
            versions=version_responses,
            total=len(versions),
            current_version=current_version
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file versions: {str(e)}"
        )


@router.post("/{file_id}/versions/{version_id}/restore", response_model=FileResponse)
async def restore_file_version(
    file_id: int,
    version_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Restore a file to a specific version"""
    try:
        file_service = FileStorageService(db)

        # Get the version to restore
        version = db.query(FileVersion).filter(
            FileVersion.id == version_id,
            FileVersion.file_id == file_id
        ).first()

        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Version not found"
            )

        # Read version content
        with open(version.file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update file with version content
        file_data = FileUpdate(
            content=content,
            mermaid_code=version.mermaid_code,
            diagram_data=version.diagram_data,
            metadata=version.metadata
        )

        updated_file = file_service.update_file(file_id, current_user.id, file_data)

        return FileResponse.from_orm(updated_file)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore file version: {str(e)}"
        )


@router.get("/stats/overview", response_model=FileStatsResponse)
async def get_file_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get file storage statistics for current user"""
    try:
        file_service = FileStorageService(db)
        stats = file_service.get_user_storage_stats(current_user.id)

        # Convert recent files to response format
        recent_files = [FileResponse.from_orm(f) for f in stats["recent_files"]]

        return FileStatsResponse(
            total_files=stats["total_files"],
            total_size=stats["total_size"],
            files_by_type=stats["files_by_type"],
            files_by_project=stats["files_by_project"],
            recent_files=recent_files,
            storage_used=stats["total_size"],
            storage_limit=stats["storage_limit"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file statistics: {str(e)}"
        )


@router.post("/import")
async def import_file(
    content: str,
    filename: str,
    file_type: str,
    display_name: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import a file from content"""
    try:
        file_service = FileStorageService(db)

        # Validate file type
        from app.models.file import FileType
        if file_type not in [ft.value for ft in FileType]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type"
            )

        # Extract Mermaid code if it's a JSON or Markdown file
        mermaid_code = None
        diagram_data = None

        if file_type == "json":
            import json
            try:
                diagram_data = json.loads(content)
                mermaid_code = diagram_data.get("mermaid_code")
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid JSON format"
                )
        elif file_type == "md":
            # Extract Mermaid code from markdown
            import re
            mermaid_match = re.search(r'```mermaid\n(.*?)\n```', content, re.DOTALL)
            if mermaid_match:
                mermaid_code = mermaid_match.group(1).strip()
        elif file_type == "mmd":
            mermaid_code = content.strip()

        # Create file
        file_data = FileCreate(
            display_name=display_name or filename,
            file_type=file_type,
            content=content,
            mermaid_code=mermaid_code,
            diagram_data=diagram_data
        )

        db_file = file_service.create_file(current_user.id, file_data)

        return FileUploadResponse(
            success=True,
            message="File imported successfully",
            file=db_file
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import file: {str(e)}"
        )


@router.get("/{file_id}/export")
async def export_file(
    file_id: int,
    format: str = Query("json", regex="^(json|mmd|md)$", description="Export format"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export a file in different formats"""
    try:
        file_service = FileStorageService(db)
        file_content = file_service.get_file_content(file_id, current_user.id)
        db_file = file_service.get_file(file_id, current_user.id)

        # Transform content based on format
        if format == "json":
            # Return as JSON with complete diagram data
            export_data = {
                "id": db_file.id,
                "display_name": db_file.display_name,
                "description": db_file.description,
                "mermaid_code": db_file.mermaid_code,
                "diagram_data": db_file.diagram_data,
                "tags": db_file.tags,
                "metadata": db_file.metadata,
                "created_at": db_file.created_at.isoformat(),
                "updated_at": db_file.updated_at.isoformat()
            }
            return Response(
                content=export_data,
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={db_file.display_name}.json"}
            )

        elif format == "mmd":
            # Export as pure Mermaid
            content = db_file.mermaid_code or file_content.content
            return Response(
                content=content,
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename={db_file.display_name}.mmd"}
            )

        elif format == "md":
            # Export as Markdown with Mermaid code block
            mermaid_code = db_file.mermaid_code or file_content.content
            content = f"# {db_file.display_name}\n\n"
            if db_file.description:
                content += f"{db_file.description}\n\n"
            content += f"```mermaid\n{mermaid_code}\n```"
            return Response(
                content=content,
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename={db_file.display_name}.md"}
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export file: {str(e)}"
        )