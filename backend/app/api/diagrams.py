from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from app.models.diagram import Diagram, DiagramCreate, DiagramUpdate

router = APIRouter()

# Temporary in-memory storage (will be replaced with database)
diagrams_db = {}


class DiagramResponse(BaseModel):
    success: bool
    data: Optional[Diagram] = None
    message: Optional[str] = None


class DiagramsResponse(BaseModel):
    success: bool
    data: Optional[List[Diagram]] = None
    message: Optional[str] = None


@router.get("/", response_model=DiagramsResponse)
async def get_diagrams():
    """Get all diagrams"""
    diagrams = list(diagrams_db.values())
    return DiagramsResponse(success=True, data=diagrams)


@router.get("/{diagram_id}", response_model=DiagramResponse)
async def get_diagram(diagram_id: str):
    """Get a specific diagram by ID"""
    diagram = diagrams_db.get(diagram_id)
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return DiagramResponse(success=True, data=diagram)


@router.post("/", response_model=DiagramResponse)
async def create_diagram(diagram_data: DiagramCreate):
    """Create a new diagram"""
    import uuid
    from datetime import datetime

    diagram = Diagram(
        id=str(uuid.uuid4()),
        title=diagram_data.title,
        description=diagram_data.description,
        mermaid_code=diagram_data.mermaid_code,
        tags=diagram_data.tags or [],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    diagrams_db[diagram.id] = diagram
    return DiagramResponse(success=True, data=diagram, message="Diagram created successfully")


@router.put("/{diagram_id}", response_model=DiagramResponse)
async def update_diagram(diagram_id: str, diagram_data: DiagramUpdate):
    """Update an existing diagram"""
    if diagram_id not in diagrams_db:
        raise HTTPException(status_code=404, detail="Diagram not found")

    diagram = diagrams_db[diagram_id]
    update_data = diagram_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(diagram, field, value)

    diagrams_db[diagram_id] = diagram
    return DiagramResponse(success=True, data=diagram, message="Diagram updated successfully")


@router.delete("/{diagram_id}")
async def delete_diagram(diagram_id: str):
    """Delete a diagram"""
    if diagram_id not in diagrams_db:
        raise HTTPException(status_code=404, detail="Diagram not found")

    del diagrams_db[diagram_id]
    return {"success": True, "message": "Diagram deleted successfully"}


@router.get("/{diagram_id}/export")
async def export_diagram(diagram_id: str, format: str = "json"):
    """Export a diagram in various formats"""
    if diagram_id not in diagrams_db:
        raise HTTPException(status_code=404, detail="Diagram not found")

    diagram = diagrams_db[diagram_id]

    # This is a placeholder - actual export logic will be implemented later
    if format == "json":
        from fastapi.responses import JSONResponse
        return JSONResponse(content=diagram.dict())
    elif format == "markdown":
        content = f"# {diagram.title}\n\n{diagram.description or ''}\n\n```mermaid\n{diagram.mermaid_code}\n```"
        return {"content": content, "filename": f"{diagram.title}.md"}
    else:
        raise HTTPException(status_code=400, detail=f"Export format '{format}' not supported")