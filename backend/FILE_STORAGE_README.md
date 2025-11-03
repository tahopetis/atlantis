# Atlantis File Storage System

A comprehensive, secure file storage system for the Atlantis diagramming application, supporting .mmd (Mermaid), .json, and other diagram file formats with user authentication, version control, and Git integration.

## 🚀 Features

### Core Functionality
- **Multi-format Support**: .mmd (Mermaid), .json, .md, .png, .svg files
- **Secure User Storage**: User-specific directories with hashed paths
- **File Versioning**: Automatic version history with rollback capability
- **Git Integration**: Commit files to Git repositories
- **Advanced Search**: Filter by type, tags, projects, date ranges
- **File Sharing**: Secure sharing with optional password protection
- **Import/Export**: Support for various diagram formats

### Security Features
- **Path Traversal Protection**: Secure filename handling
- **Content Validation**: Malicious code detection
- **File Size Limits**: Configurable size restrictions per file type
- **User Access Control**: Users can only access their own files
- **Audit Logging**: Complete operation tracking
- **Secure File Storage**: Hashed user directories, sanitized filenames

### Performance & Scalability
- **Efficient Storage**: Deduplication by file hash
- **Pagination**: Large file collection handling
- **Background Processing**: Async file operations
- **Caching**: Metadata caching for frequently accessed files
- **Backup Support**: Automated backup system

## 📁 Architecture

### Directory Structure
```
storage/
├── users/                 # User-specific storage (hashed paths)
│   ├── a1b2c3d4/         # User 1 files
│   └── e5f6g7h8/         # User 2 files
├── versions/             # File version history
├── temp/                 # Temporary upload files
├── backups/              # System backups
└── uploads/              # Upload staging area
```

### Database Schema
- **`diagram_files`**: File metadata and relationships
- **`file_versions`**: Version history with change tracking
- **`file_shares`**: Sharing links and permissions
- **`users`**: User authentication and ownership

### Service Layer
- **`FileStorageService`**: Core file operations
- **`FileValidator`**: Security and format validation
- **GitService Integration**: Version control operations
- **Authentication Middleware**: User access control

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- SQLAlchemy
- FastAPI
- SQLite/PostgreSQL database

### Quick Setup

1. **Run the setup script**:
```bash
cd backend
python setup_file_storage.py
```

2. **Configure environment variables**:
```bash
# File storage settings
FILE_STORAGE_PATH=./storage
FILE_MAX_SIZE_MB=10
FILE_MAX_FILES_PER_USER=1000
FILE_AUTO_VERSIONING=true
```

3. **Start the API server**:
```bash
python -m uvicorn main:app --reload
```

## 📖 API Documentation

### File Operations

#### Create File
```http
POST /api/files/
Content-Type: application/json
Authorization: Bearer {token}

{
  "display_name": "My Diagram",
  "description": "A sample diagram",
  "file_type": "mmd",
  "content": "graph TD\n    A[Start] --> B[End]",
  "tags": ["example", "flowchart"],
  "project_name": "Sample Project"
}
```

#### List Files
```http
GET /api/files/?query=example&file_type=mmd&page=1&per_page=20
Authorization: Bearer {token}
```

#### Get File
```http
GET /api/files/{file_id}
Authorization: Bearer {token}
```

#### Get File Content
```http
GET /api/files/{file_id}/content
Authorization: Bearer {token}
```

#### Update File
```http
PUT /api/files/{file_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "display_name": "Updated Diagram",
  "content": "graph TD\n    A[Start] --> B[Process] --> C[End]"
}
```

#### Delete File
```http
DELETE /api/files/{file_id}?permanent=false
Authorization: Bearer {token}
```

### Import/Export

#### Import File
```http
POST /api/files/import
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "graph TD\n    A --> B",
  "filename": "imported.mmd",
  "file_type": "mmd",
  "display_name": "Imported Diagram"
}
```

#### Export File
```http
GET /api/files/{file_id}/export?format=json
Authorization: Bearer {token}
```

Supported formats: `json`, `mmd`, `md`

### Version Control

#### Get File Versions
```http
GET /api/files/{file_id}/versions
Authorization: Bearer {token}
```

#### Restore Version
```http
POST /api/files/{file_id}/versions/{version_id}/restore
Authorization: Bearer {token}
```

### Statistics

#### Get User Stats
```http
GET /api/files/stats/overview
Authorization: Bearer {token}
```

## 🔧 Configuration

### Environment Variables

```bash
# File Storage
FILE_STORAGE_PATH=./storage
FILE_MAX_SIZE_MB=10
FILE_MAX_FILES_PER_USER=1000
FILE_ALLOWED_EXTENSIONS=.mmd,.json,.md,.png,.svg
FILE_AUTO_VERSIONING=true
FILE_BACKUP_ENABLED=true
FILE_SHARE_EXPIRE_DAYS=30

# Git Integration
GIT_BASE_PATH=./repositories
GIT_MAX_REPO_SIZE_MB=1000
GIT_MAX_FILE_SIZE_MB=10
```

### File Type Settings

| Type | Max Size | Extensions | Description |
|------|----------|------------|-------------|
| Mermaid (.mmd) | 100KB | .mmd, .mermaid | Pure Mermaid syntax |
| JSON (.json) | 1MB | .json | Complete diagram data |
| Markdown (.md) | 500KB | .md, .markdown | Markdown with Mermaid blocks |
| PNG (.png) | 5MB | .png | Image files |
| SVG (.svg) | 1MB | .svg | Vector graphics |

## 🔒 Security Features

### File Validation
- **Filename Sanitization**: Removes dangerous characters
- **Content Security**: Scans for malicious code
- **Size Limits**: Prevents DoS attacks
- **Type Validation**: Ensures file format compliance

### Access Control
- **User Isolation**: Users can only access their files
- **JWT Authentication**: Secure token-based access
- **Path Protection**: Prevents directory traversal
- **Audit Logging**: Complete operation tracking

### Data Protection
- **Secure Storage**: Hashed user directories
- **Content Deduplication**: Hash-based duplicate detection
- **Backup System**: Automated file backups
- **Version History**: Complete change tracking

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/test_file_*.py -v

# Run specific test file
pytest tests/test_file_service.py -v

# Run with coverage
pytest tests/test_file_*.py --cov=app.services.file_service
```

### Test Coverage
- **File Service Tests**: Core functionality validation
- **API Endpoint Tests**: HTTP interface testing
- **Security Tests**: Vulnerability scanning
- **Performance Tests**: Load and stress testing

## 🚀 Advanced Features

### Git Integration

Files can be automatically committed to Git repositories:

```json
{
  "git_repo_id": 1,
  "git_path": "diagrams/my-diagram.mmd",
  "git_branch": "main"
}
```

### File Sharing

Create secure sharing links with expiration:

```http
POST /api/files/{file_id}/share
{
  "share_type": "link",
  "expires_at": "2024-12-31T23:59:59Z",
  "can_view": true,
  "can_download": true,
  "max_views": 100
}
```

### Batch Operations

Upload multiple files:

```http
POST /api/files/batch
Content-Type: multipart/form-data

files: [File1, File2, File3]
```

### Search & Filtering

Advanced search capabilities:

```http
GET /api/files/?query=flowchart&tags=important&project=Main&date_from=2024-01-01&sort_by=updated_at&sort_order=desc
```

## 🔧 Troubleshooting

### Common Issues

#### File Upload Fails
- Check file size limits
- Verify file format support
- Ensure proper authentication
- Check storage permissions

#### Git Integration Issues
- Verify Git repository access
- Check token permissions
- Ensure valid Git paths
- Review branch permissions

#### Performance Issues
- Monitor storage usage
- Check database indexes
- Review file cleanup processes
- Optimize large file handling

### Logging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Monitor logs for:
- File access attempts
- Validation failures
- Storage quota exceeded
- Git operation errors

## 📊 Monitoring & Metrics

### Key Metrics
- **Storage Usage**: Per-user and system-wide
- **File Operations**: Upload, download, update counts
- **Error Rates**: Validation and operation failures
- **Performance**: Response times and throughput

### Health Checks
```http
GET /health
GET /api/files/stats/overview
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies
3. Run setup script
4. Create feature branch
5. Add tests
6. Submit pull request

### Code Standards
- Follow PEP 8 style guidelines
- Add comprehensive tests
- Update documentation
- Security review required

## 📄 License

This file storage system is part of the Atlantis project. See the main project license for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting guide
2. Review API documentation
3. Search existing issues
4. Create new issue with details

---

**🌊 Atlantis File Storage System - Secure, Scalable Diagram Storage**