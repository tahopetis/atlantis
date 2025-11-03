# Atlantis Backend

FastAPI backend service for the Atlantis diagramming tool with complete authentication, Git integration, and file storage capabilities.

## Features

### Core Functionality
- **RESTful API** for diagram management and operations
- **JWT Authentication** with access and refresh tokens
- **Git Integration** with real repository operations
- **File Storage System** with versioning and security
- **User Management** with profiles and preferences
- **Git Token Support** for GitHub, GitLab, and Bitbucket

### Security Features
- **Rate Limiting** for API endpoints
- **Audit Logging** for all operations
- **Security Headers** for comprehensive protection
- **Input Validation** and sanitization
- **Password Security** with bcrypt hashing
- **Token Management** with rotation and blacklisting

### Git Operations
- **Repository Management** - Clone, browse, and manage repositories
- **Commit Operations** - Create commits with custom messages
- **Branch Management** - Switch between and create branches
- **File History** - Track changes and restore versions
- **Diff Visualization** - View file changes and conflicts

### File Storage
- **Multi-format Support** - .mmd, .json, .md, .png, .svg files
- **User Isolation** - Secure user-specific directories
- **Version Control** - Automatic versioning with rollback
- **Advanced Search** - Filter by type, tags, projects, dates
- **Import/Export** - Support for various diagram formats

## Development Setup

```bash
# Install dependencies
uv sync

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python -c "from app.core.database import create_tables; create_tables()"

# Run development server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

When running, visit:
- **Interactive Swagger Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Testing

```bash
# Run all tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app

# Run specific test modules
uv run pytest tests/test_auth.py -v
uv run pytest tests/test_file_service.py -v
uv run pytest tests/test_git_service.py -v

# Run with verbose output
uv run pytest -v --tb=short
```

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=sqlite:///./atlantis.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_MIN_LENGTH=8

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=300

# Git Settings
GIT_BASE_PATH=./repositories
GIT_MAX_REPO_SIZE_MB=1000
GIT_MAX_FILE_SIZE_MB=10
GIT_DISABLE_PUSH=false
GIT_DISABLE_PULL=false

# File Storage
FILE_STORAGE_PATH=./storage
FILE_MAX_SIZE_MB=10
FILE_MAX_FILES_PER_USER=1000
FILE_AUTO_VERSIONING=true

# Application
APP_NAME=Atlantis API
DEBUG=false
ENVIRONMENT=development

# CORS
ALLOWED_HOSTS=http://localhost:3000,http://localhost:5173
```

## API Endpoints

### Authentication
```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login user
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Logout user
GET    /api/auth/me                 # Get current user info
PUT    /api/auth/me                 # Update user profile
```

### File Management
```
GET    /api/files/                  # List user files
POST   /api/files/                  # Create new file
GET    /api/files/{id}              # Get file metadata
GET    /api/files/{id}/content      # Get file content
PUT    /api/files/{id}              # Update file
DELETE /api/files/{id}              # Delete file
POST   /api/files/import            # Import file
GET    /api/files/{id}/export       # Export file
```

### Git Operations
```
GET    /api/git/repositories        # List repositories
POST   /api/git/repositories        # Add repository
GET    /api/git/repositories/{id}   # Get repository details
POST   /api/git/repositories/{id}/commit  # Commit changes
GET    /api/git/repositories/{id}/branches # List branches
POST   /api/git/repositories/{id}/branches # Create branch
```

### Git Tokens
```
GET    /api/git-tokens/             # List Git tokens
POST   /api/git-tokens/             # Create Git token
PUT    /api/git-tokens/{id}         # Update Git token
DELETE /api/git-tokens/{id}         # Delete Git token
POST   /api/git-tokens/{id}/validate # Validate token
```

## Architecture

### Directory Structure
```
backend/
├── app/
│   ├── api/                    # API endpoints and routers
│   ├── core/                   # Core configuration and security
│   ├── models/                 # Database models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic services
│   └── utils/                  # Utility functions
├── tests/                      # Test suite
├── alembic/                    # Database migrations
├── requirements.txt            # Python dependencies
├── pyproject.toml             # Project configuration
└── main.py                    # Application entry point
```

### Key Components
- **FastAPI Application** - Modern async web framework
- **SQLAlchemy** - Database ORM with migrations
- **JWT Authentication** - Secure token-based auth
- **GitPython** - Git repository operations
- **Pydantic** - Data validation and serialization
- **Bcrypt** - Password hashing and security

## Security Features

### Authentication
- JWT tokens with expiration and rotation
- Secure password hashing with bcrypt
- Rate limiting on auth endpoints
- Audit logging for security events

### File Security
- User isolation with hashed directories
- Path traversal protection
- File size and type validation
- Content sanitization and validation

### Git Security
- Token-based Git authentication
- Repository access control
- Secure path handling
- Operation auditing

## Development Guidelines

### Code Quality
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Add comprehensive docstrings
- Include error handling for all operations

### Testing
- Write unit tests for all services
- Include integration tests for API endpoints
- Test error scenarios and edge cases
- Maintain high test coverage

### Security
- Validate all input data
- Use parameterized queries for database
- Implement proper error handling
- Follow secure coding practices

## Deployment

### Docker
```bash
# Build production image
docker build -t atlantis-backend .

# Run with environment variables
docker run -p 8000:8000 --env-file .env atlantis-backend
```

### Production Considerations
- Use PostgreSQL or MySQL for production database
- Configure proper logging and monitoring
- Set up backup procedures
- Use HTTPS with proper certificates
- Configure reverse proxy (nginx)

## Monitoring

### Health Checks
- `GET /health` - Application health status
- `GET /api/files/stats/overview` - System statistics

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking and reporting
- Security event logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## License

This backend service is part of the Atlantis project. See the main project license for details.