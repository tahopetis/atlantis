# 📡 Atlantis API Documentation

## 🌐 Base URL

**Development:** `http://localhost:8000`
**Production:** `http://localhost:8000` (when running with Docker)

## 🔐 Authentication

Currently in development. Authentication will be implemented in Phase 2.

## 📚 API Endpoints

### **Health & Status**

#### `GET /`
Root endpoint to verify API is running.

**Response:**
```json
{
  "message": "Welcome to Atlantis API",
  "version": "0.1.0",
  "status": "active"
}
```

#### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📊 Diagrams API

### `GET /api/diagrams/`
Get all diagrams.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "diagram-id",
      "title": "System Architecture",
      "description": "Overall system architecture",
      "mermaid_code": "graph TD\n    A --> B",
      "tags": ["architecture", "system"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "git_path": null,
      "git_branch": null,
      "git_commit": null
    }
  ]
}
```

### `GET /api/diagrams/{diagram_id}`
Get a specific diagram by ID.

**Parameters:**
- `diagram_id` (string): ID of the diagram

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "diagram-id",
    "title": "System Architecture",
    "description": "Overall system architecture",
    "mermaid_code": "graph TD\n    A --> B",
    "tags": ["architecture"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### `POST /api/diagrams/`
Create a new diagram.

**Request Body:**
```json
{
  "title": "New Diagram",
  "description": "Description of the diagram",
  "mermaid_code": "graph TD\n    A --> B",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-diagram-id",
    "title": "New Diagram",
    "description": "Description of the diagram",
    "mermaid_code": "graph TD\n    A --> B",
    "tags": ["tag1", "tag2"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Diagram created successfully"
}
```

### `PUT /api/diagrams/{diagram_id}`
Update an existing diagram.

**Parameters:**
- `diagram_id` (string): ID of the diagram

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "mermaid_code": "graph TD\n    A --> B --> C",
  "tags": ["updated"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "diagram-id",
    "title": "Updated Title",
    "description": "Updated description",
    "mermaid_code": "graph TD\n    A --> B --> C",
    "tags": ["updated"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T01:00:00Z"
  },
  "message": "Diagram updated successfully"
}
```

### `DELETE /api/diagrams/{diagram_id}`
Delete a diagram.

**Parameters:**
- `diagram_id` (string): ID of the diagram

**Response:**
```json
{
  "success": true,
  "message": "Diagram deleted successfully"
}
```

### `GET /api/diagrams/{diagram_id}/export`
Export a diagram in various formats.

**Parameters:**
- `diagram_id` (string): ID of the diagram
- `format` (query): Export format (`json`, `markdown`)

**Response (JSON format):**
```json
{
  "id": "diagram-id",
  "title": "System Architecture",
  "description": "Overall system architecture",
  "mermaid_code": "graph TD\n    A --> B",
  "tags": ["architecture"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Response (Markdown format):**
```json
{
  "content": "# System Architecture\n\nOverall system architecture\n\n```mermaid\ngraph TD\n    A --> B\n```",
  "filename": "System Architecture.md"
}
```

---

## 🔀 Git API

### `GET /api/git/repositories`
Get all Git repositories.

**Response:**
```json
[
  {
    "id": "repo-id",
    "name": "atlantis-diagrams",
    "url": "https://github.com/user/atlantis-diagrams.git",
    "local_path": "./repos/atlantis-diagrams",
    "default_branch": "main",
    "current_branch": "main"
  }
]
```

### `POST /api/git/repositories`
Add a new Git repository.

**Request Body:**
```json
{
  "name": "my-diagrams",
  "url": "https://github.com/user/my-diagrams.git",
  "local_path": "./repos/my-diagrams"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Repository added successfully",
  "data": {
    "id": "new-repo-id",
    "name": "my-diagrams",
    "url": "https://github.com/user/my-diagrams.git",
    "local_path": "./repos/my-diagrams",
    "default_branch": "main",
    "current_branch": "main"
  }
}
```

### `GET /api/git/repositories/{repo_id}/commits`
Get commits for a repository.

**Parameters:**
- `repo_id` (string): ID of the repository
- `branch` (query, optional): Branch name (default: current branch)

**Response:**
```json
[
  {
    "hash": "abc123",
    "message": "Initial commit",
    "author": "John Doe",
    "date": "2024-01-01T00:00:00Z",
    "files": ["diagram1.mmd", "diagram2.mmd"]
  },
  {
    "hash": "def456",
    "message": "Add new diagram",
    "author": "Jane Smith",
    "date": "2024-01-02T00:00:00Z",
    "files": ["diagram3.mmd"]
  }
]
```

### `POST /api/git/repositories/{repo_id}/commit`
Commit changes to a repository.

**Parameters:**
- `repo_id` (string): ID of the repository

**Request Body:**
```json
{
  "message": "Update system architecture diagram",
  "files": ["system-architecture.mmd", "database-schema.mmd"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Committed 2 files",
  "data": {
    "commit_hash": "def456"
  }
}
```

### `POST /api/git/repositories/{repo_id}/push`
Push changes to remote repository.

**Parameters:**
- `repo_id` (string): ID of the repository

**Request Body:**
```json
{
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes pushed successfully",
  "data": {
    "branch": "main"
  }
}
```

### `POST /api/git/repositories/{repo_id}/pull`
Pull changes from remote repository.

**Parameters:**
- `repo_id` (string): ID of the repository

**Request Body:**
```json
{
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes pulled successfully",
  "data": {
    "branch": "main"
  }
}
```

---

## 👤 Users API

### `GET /api/users/me`
Get the current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "username": "demo_user",
    "email": "demo@atlantis.dev",
    "avatar": null
  }
}
```

### `PUT /api/users/me`
Update current user profile.

**Request Body:**
```json
{
  "username": "new_username",
  "email": "new.email@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "username": "new_username",
    "email": "new.email@example.com",
    "avatar": null
  },
  "message": "User profile updated successfully"
}
```

---

## 🚨 Error Responses

All endpoints return error responses in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `404` - Resource not found
- `422` - Validation error
- `500` - Internal server error

### Example Error Response

```json
{
  "detail": "Diagram not found"
}
```

---

## 📖 Interactive API Documentation

When the backend is running, you can access interactive API documentation at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 🧪 Testing

The API includes comprehensive tests. Run tests with:

```bash
cd backend
uv run pytest
```

**Test Coverage:**
- ✅ All endpoints tested
- ✅ Error handling verified
- ✅ Data validation tested
- ✅ Response formats validated

---

## 🔜 Coming in Phase 2

- **Authentication:** JWT tokens, Git credentials, SSH keys
- **Real Git Operations:** Actual repository management
- **File Storage:** Persistent file system operations
- **Advanced Git Features:** Branching, merging, diff visualization
- **Webhooks:** Git event triggers
- **Real-time Updates:** WebSocket support

---

**Last Updated:** November 2, 2025
**API Version:** 0.1.0
**Status:** Phase 1 MVP - Foundation Complete