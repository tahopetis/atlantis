import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.models.file import DiagramFile, FileType, FileVersion
from app.schemas.file import FileResponse, FileListResponse, FileUploadResponse
from app.core.security import create_access_token


@pytest.fixture
def client():
    """Test client"""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    user = Mock(spec=User)
    user.id = 1
    user.username = "testuser"
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def auth_headers(mock_user):
    """Authentication headers"""
    token = create_access_token(data={"sub": str(mock_user.id), "username": mock_user.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def sample_file():
    """Sample diagram file"""
    file_mock = Mock(spec=DiagramFile)
    file_mock.id = 1
    file_mock.filename = "test_diagram.mmd"
    file_mock.display_name = "Test Diagram"
    file_mock.description = "A test diagram"
    file_mock.file_type = FileType.MERMAID
    file_mock.file_size = 500
    file_mock.file_hash = "abc123"
    file_mock.mermaid_code = "graph TD\n    A --> B"
    file_mock.diagram_data = None
    file_mock.tags = ["test", "diagram"]
    file_mock.file_metadata = {}
    file_mock.user_id = 1
    file_mock.project_name = "Test Project"
    file_mock.folder_path = None
    file_mock.is_public = False
    file_mock.is_archived = False
    file_mock.git_repo_id = None
    file_mock.git_path = None
    file_mock.git_branch = None
    file_mock.git_commit = None
    file_mock.created_at = "2024-01-01T00:00:00Z"
    file_mock.updated_at = "2024-01-01T00:00:00Z"
    file_mock.last_accessed_at = None
    return file_mock


@pytest.fixture
def sample_mermaid_content():
    """Sample Mermaid content"""
    return """graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E"""


@pytest.fixture
def sample_json_content():
    """Sample JSON content"""
    return json.dumps({
        "display_name": "Test Diagram",
        "description": "A test diagram",
        "mermaid_code": "graph TD\n    A --> B",
        "diagram_data": {
            "nodes": [{"id": "A", "label": "Start"}, {"id": "B", "label": "End"}],
            "edges": [{"from": "A", "to": "B"}]
        },
        "tags": ["test", "diagram"],
        "file_metadata": {"created_by": "test"}
    })


class TestFileAPI:
    """Test file API endpoints"""

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_create_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                                client, auth_headers, mock_user, sample_file, sample_mermaid_content):
        """Test successful file creation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.create_file.return_value = sample_file

        file_data = {
            "display_name": "Test Diagram",
            "description": "A test diagram",
            "file_type": "mmd",
            "content": sample_mermaid_content,
            "tags": ["test", "diagram"]
        }

        response = client.post("/api/files/", json=file_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "File created successfully"
        assert data["file"]["display_name"] == "Test Diagram"

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    def test_create_file_unauthorized(self, mock_get_db, mock_get_user, client, sample_mermaid_content):
        """Test file creation without authentication"""
        file_data = {
            "display_name": "Test Diagram",
            "file_type": "mmd",
            "content": sample_mermaid_content
        }

        response = client.post("/api/files/", json=file_data)

        assert response.status_code == 401

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_list_files_success(self, mock_file_service, mock_get_db, mock_get_user,
                               client, auth_headers, mock_user, sample_file):
        """Test successful file listing"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.list_files.return_value = ([sample_file], 1)

        response = client.get("/api/files/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["files"]) == 1
        assert data["files"][0]["display_name"] == "Test Diagram"

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_list_files_with_filters(self, mock_file_service, mock_get_db, mock_get_user,
                                    client, auth_headers, mock_user, sample_file):
        """Test file listing with filters"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.list_files.return_value = ([sample_file], 1)

        response = client.get("/api/files/?query=test&file_type=mmd&page=1&per_page=10", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["files"]) == 1

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_get_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                             client, auth_headers, mock_user, sample_file):
        """Test successful file retrieval"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.get_file.return_value = sample_file

        response = client.get("/api/files/1", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["display_name"] == "Test Diagram"

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_get_file_not_found(self, mock_file_service, mock_get_db, mock_get_user,
                               client, auth_headers, mock_user):
        """Test file retrieval with non-existent file"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.get_file.side_effect = Exception("File not found or access denied")

        response = client.get("/api/files/999", headers=auth_headers)

        assert response.status_code == 500

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_get_file_content_success(self, mock_file_service, mock_get_db, mock_get_user,
                                     client, auth_headers, mock_user, sample_mermaid_content):
        """Test successful file content retrieval"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        mock_response = Mock()
        mock_response.success = True
        mock_response.content = sample_mermaid_content
        mock_response.content_type = "text/plain"
        mock_response.size = len(sample_mermaid_content.encode('utf-8'))
        mock_response.filename = "test.mmd"
        mock_service_instance.get_file_content.return_value = mock_response

        response = client.get("/api/files/1/content", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["content"] == sample_mermaid_content
        assert data["content_type"] == "text/plain"

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_download_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                                  client, auth_headers, mock_user, sample_file):
        """Test successful file download"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.get_file.return_value = sample_file

        with patch('app.api.files.FileResponse') as mock_file_response:
            mock_file_response.return_value = Mock()
            response = client.get("/api/files/1/download", headers=auth_headers)

            assert response.status_code == 200
            mock_file_response.assert_called_once()

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_update_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                                client, auth_headers, mock_user, sample_file):
        """Test successful file update"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.update_file.return_value = sample_file

        update_data = {
            "display_name": "Updated Diagram",
            "description": "Updated description"
        }

        response = client.put("/api/files/1", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Test Diagram"  # Mock returns original file

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_delete_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                                client, auth_headers, mock_user):
        """Test successful file deletion"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.delete_file.return_value = True

        response = client.delete("/api/files/1", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "File deleted successfully"
        assert data["file_id"] == 1

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_delete_file_permanent(self, mock_file_service, mock_get_db, mock_get_user,
                                  client, auth_headers, mock_user):
        """Test permanent file deletion"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.delete_file.return_value = True

        response = client.delete("/api/files/1?permanent=true", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_get_file_versions_success(self, mock_file_service, mock_get_db, mock_get_user,
                                      client, auth_headers, mock_user):
        """Test successful file versions retrieval"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        mock_version = Mock(spec=FileVersion)
        mock_version.id = 1
        mock_version.version_number = 1
        mock_version.change_description = "Initial version"
        mock_service_instance.get_file_versions.return_value = [mock_version]
        mock_service_instance.get_file.return_value = Mock()

        response = client.get("/api/files/1/versions", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["versions"]) == 1
        assert data["current_version"] == 1

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_restore_file_version_success(self, mock_file_service, mock_get_db, mock_get_user,
                                         client, auth_headers, mock_user, sample_file):
        """Test successful file version restoration"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.update_file.return_value = sample_file

        mock_version = Mock(spec=FileVersion)
        mock_version.id = 1
        mock_version.file_id = 1
        mock_version.file_path = "/path/to/version"
        mock_version.mermaid_code = "graph TD\n    A --> B"
        mock_version.diagram_data = {}
        mock_version.file_metadata = {}

        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_version
        mock_db.query.return_value = mock_query

        with patch('builtins.open', mock_open(read_data="graph TD\n    A --> B")):
            response = client.post("/api/files/1/versions/1/restore", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_get_file_stats_success(self, mock_file_service, mock_get_db, mock_get_user,
                                   client, auth_headers, mock_user):
        """Test successful file statistics retrieval"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        stats = {
            "total_files": 10,
            "total_size": 50000,
            "files_by_type": {"mmd": 8, "json": 2},
            "files_by_project": {"Project1": 5, "Project2": 5},
            "recent_files": [],
            "storage_limit": 1000000
        }
        mock_service_instance.get_user_storage_stats.return_value = stats

        response = client.get("/api/files/stats/overview", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total_files"] == 10
        assert data["total_size"] == 50000
        assert data["files_by_type"]["mmd"] == 8

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_import_file_success(self, mock_file_service, mock_get_db, mock_get_user,
                                client, auth_headers, mock_user, sample_file, sample_mermaid_content):
        """Test successful file import"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance
        mock_service_instance.create_file.return_value = sample_file

        import_data = {
            "content": sample_mermaid_content,
            "filename": "imported.mmd",
            "file_type": "mmd",
            "display_name": "Imported Diagram"
        }

        response = client.post("/api/files/import", json=import_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "File imported successfully"

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_export_file_json(self, mock_file_service, mock_get_db, mock_get_user,
                             client, auth_headers, mock_user, sample_file, sample_mermaid_content):
        """Test file export as JSON"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        mock_response = Mock()
        mock_response.success = True
        mock_response.content = sample_mermaid_content
        mock_service_instance.get_file_content.return_value = mock_response
        mock_service_instance.get_file.return_value = sample_file

        response = client.get("/api/files/1/export?format=json", headers=auth_headers)

        assert response.status_code == 200

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_export_file_mermaid(self, mock_file_service, mock_get_db, mock_get_user,
                                client, auth_headers, mock_user, sample_file):
        """Test file export as Mermaid"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        mock_response = Mock()
        mock_response.success = True
        mock_response.content = "graph TD\n    A --> B"
        mock_service_instance.get_file_content.return_value = mock_response
        mock_service_instance.get_file.return_value = sample_file

        response = client.get("/api/files/1/export?format=mmd", headers=auth_headers)

        assert response.status_code == 200

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_export_file_markdown(self, mock_file_service, mock_get_db, mock_get_user,
                                  client, auth_headers, mock_user, sample_file):
        """Test file export as Markdown"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        mock_response = Mock()
        mock_response.success = True
        mock_response.content = "graph TD\n    A --> B"
        mock_service_instance.get_file_content.return_value = mock_response
        mock_service_instance.get_file.return_value = sample_file

        response = client.get("/api/files/1/export?format=md", headers=auth_headers)

        assert response.status_code == 200

    def test_import_file_invalid_type(self, client, auth_headers):
        """Test file import with invalid file type"""
        import_data = {
            "content": "test content",
            "filename": "test.txt",
            "file_type": "txt",  # Invalid file type
            "display_name": "Test File"
        }

        response = client.post("/api/files/import", json=import_data, headers=auth_headers)

        assert response.status_code == 422  # Validation error

    def test_export_file_invalid_format(self, client, auth_headers):
        """Test file export with invalid format"""
        response = client.get("/api/files/1/export?format=invalid", headers=auth_headers)

        assert response.status_code == 422  # Validation error


def mock_open(read_data=""):
    """Mock file open for testing"""
    from unittest.mock import mock_open as _mock_open
    return _mock_open(read_data=read_data)