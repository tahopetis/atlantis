from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌊 Atlantis API is starting up...")
    yield
    # Shutdown
    print("🌊 Atlantis API is shutting down...")


app = FastAPI(
    title="Atlantis API",
    description="Backend API for Atlantis diagramming tool",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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