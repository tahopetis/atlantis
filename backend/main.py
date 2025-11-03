from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.api import api_router
from app.middleware.security_headers import SecurityHeadersMiddleware, AuditLogMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌊 Atlantis API is starting up...")

    # Create database tables
    try:
        create_tables()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")

    yield
    # Shutdown
    print("🌊 Atlantis API is shutting down...")


app = FastAPI(
    title="Atlantis API",
    description="Backend API for Atlantis diagramming tool",
    version="0.1.0",
    lifespan=lifespan
)

# Add security middleware
app.add_middleware(AuditLogMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts_list,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Atlantis API",
        "version": "0.1.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )