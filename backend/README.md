# Atlantis Backend

FastAPI backend service for the Atlantis diagramming tool.

## Features

- RESTful API for diagram management
- Git repository operations
- User authentication and authorization
- File storage and retrieval
- Real-time collaboration support (future)

## Development Setup

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

When running, visit http://localhost:8000/docs for interactive API documentation.

## Testing

```bash
# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app
```

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=sqlite:///./atlantis.db

# JWT Secret
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Git settings
GIT_BASE_PATH=./repositories
```