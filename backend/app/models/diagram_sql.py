from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from ..core.database import Base


class Diagram(Base):
    """SQLAlchemy model for diagrams"""
    __tablename__ = "diagrams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    mermaid_code = Column(Text, nullable=False)
    tags = Column(JSON)  # Store tags as JSON
    git_path = Column(String)  # Path to diagram file in Git repository
    git_branch = Column(String)  # Git branch where diagram is stored
    git_commit = Column(String)  # Git commit hash

    # Foreign key to user (owner)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="diagrams")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Diagram(id={self.id}, title='{self.title}', owner_id={self.user_id})>"