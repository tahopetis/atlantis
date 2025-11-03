import pytest
import tempfile
import shutil
import json
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.file import DiagramFile, FileType
from app.schemas.file import FileCreate, FileUpdate, FileSearchQuery
from app.services.file_service import FileStorageService
from app.core.config import settings


@pytest.fixture
def temp_storage():
    """Create temporary storage directory"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def mock_user():
    """Mock user"""
    user = Mock(spec=User)
    user.id = 1
    user.username = "testuser"
    user.email = "test@example.com"
    return user


@pytest.fixture
def file_service(mock_db, temp_storage):
    """File storage service with temporary storage"""
    # Patch the storage path
    with patch.object(settings, 'FILE_STORAGE_PATH', temp_storage):
        return FileStorageService(mock_db)


@pytest.fixture
def sample_mermaid_content():
    """Sample Mermaid diagram content"""
    return """
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
"""


@pytest.fixture
def sample_json_content():
    """Sample JSON diagram content"""
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


class TestFileStorageService:
    """Test file storage service"""

    def test_init_creates_directories(self, file_service, temp_storage):
        """Test that initialization creates required directories"""
        assert (Path(temp_storage) / "users").exists()
        assert (Path(temp_storage) / "temp").exists()
        assert (Path(temp_storage) / "versions").exists()
        assert (Path(temp_storage) / "backups").exists()

    def test_get_user_storage_path(self, file_service, temp_storage):
        """Test user storage path generation"""
        user_path = file_service._get_user_storage_path(1)
        expected_path = Path(temp_storage) / "users" / "6b86b273ff34fce19d6b804eff5a3f57"
        assert user_path == expected_path
        assert user_path.exists()

    def test_validate_filename_valid(self, file_service):
        """Test valid filename validation"""
        assert file_service._validate_filename("test.mmd") == True
        assert file_service._validate_filename("diagram-v1.json") == True
        assert file_service._validate_filename("simple_diagram") == True

    def test_validate_filename_invalid(self, file_service):
        """Test invalid filename validation"""
        assert file_service._validate_filename("../etc/passwd") == False
        assert file_service._validate_filename("../../../test") == False
        assert file_service._validate_filename("test/file.mmd") == False
        assert file_service._validate_filename("") == False
        assert file_service._validate_filename("a" * 300) == False

    def test_sanitize_filename(self, file_service):
        """Test filename sanitization"""
        assert file_service._sanitize_filename("test.mmd") == "test.mmd"
        assert file_service._sanitize_filename("test/file.mmd") == "test_file.mmd"
        assert file_service._sanitize_filename("test:file.mmd") == "testfile.mmd"
        assert file_service._sanitize_filename("") == "untitled.mmd"
        assert file_service._sanitize_filename("test") == "test.mmd"

    def test_generate_unique_filename(self, file_service, mock_user):
        """Test unique filename generation"""
        filename1 = file_service._generate_unique_filename(1, "test.mmd")
        filename2 = file_service._generate_unique_filename(1, "test.mmd")
        assert filename1 != filename2
        assert filename1.endswith(".mmd")
        assert filename2.endswith(".mmd")
        assert "test" in filename1
        assert "test" in filename2

    def test_calculate_file_hash(self, file_service, sample_mermaid_content):
        """Test file hash calculation"""
        hash1 = file_service._calculate_file_hash(sample_mermaid_content)
        hash2 = file_service._calculate_file_hash(sample_mermaid_content)
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256 hash length

    def test_validate_file_content_mermaid_valid(self, file_service, sample_mermaid_content):
        """Test valid Mermaid content validation"""
        is_valid, error = file_service._validate_file_content(sample_mermaid_content, FileType.MERMAID)
        assert is_valid == True
        assert error is None

    def test_validate_file_content_mermaid_invalid(self, file_service):
        """Test invalid Mermaid content validation"""
        is_valid, error = file_service._validate_file_content("invalid content", FileType.MERMAID)
        assert is_valid == False
        assert "Invalid Mermaid diagram syntax" in error

    def test_validate_file_content_json_valid(self, file_service, sample_json_content):
        """Test valid JSON content validation"""
        is_valid, error = file_service._validate_file_content(sample_json_content, FileType.JSON)
        assert is_valid == True
        assert error is None

    def test_validate_file_content_json_invalid(self, file_service):
        """Test invalid JSON content validation"""
        is_valid, error = file_service._validate_file_content("invalid json", FileType.JSON)
        assert is_valid == False
        assert "Invalid JSON format" in error

    def test_validate_file_content_empty(self, file_service):
        """Test empty content validation"""
        is_valid, error = file_service._validate_file_content("", FileType.MERMAID)
        assert is_valid == False
        assert error == "Content cannot be empty"

    @patch('app.services.file_service.User')
    def test_create_file_success(self, mock_user_model, file_service, mock_user, sample_mermaid_content):
        """Test successful file creation"""
        # Mock database queries
        mock_user_model.query.return_value.filter.return_value.first.return_value = mock_user
        file_service.db.query.return_value.filter.return_value.first.return_value = None  # No duplicate
        file_service.db.add = Mock()
        file_service.db.commit = Mock()
        file_service.db.refresh = Mock()

        # Mock version creation
        file_service._create_file_version = Mock()

        file_data = FileCreate(
            display_name="Test Diagram",
            file_type="mmd",
            content=sample_mermaid_content,
            description="A test diagram",
            tags=["test", "mermaid"]
        )

        result = file_service.create_file(1, file_data)

        assert result.display_name == "Test Diagram"
        assert result.file_type == FileType.MERMAID
        assert result.mermaid_code == sample_mermaid_content
        assert result.user_id == 1

        file_service.db.add.assert_called_once()
        file_service.db.commit.assert_called_once()

    @patch('app.services.file_service.User')
    def test_create_file_user_not_found(self, mock_user_model, file_service, sample_mermaid_content):
        """Test file creation with non-existent user"""
        mock_user_model.query.return_value.filter.return_value.first.return_value = None

        file_data = FileCreate(
            display_name="Test Diagram",
            file_type="mmd",
            content=sample_mermaid_content
        )

        with pytest.raises(HTTPException) as exc_info:
            file_service.create_file(1, file_data)

        assert exc_info.value.status_code == 404
        assert "User not found" in str(exc_info.value.detail)

    def test_create_file_invalid_content(self, file_service, mock_user):
        """Test file creation with invalid content"""
        with patch('app.services.file_service.User') as mock_user_model:
            mock_user_model.query.return_value.filter.return_value.first.return_value = mock_user

            file_data = FileCreate(
                display_name="Invalid Diagram",
                file_type="mmd",
                content="invalid mermaid content"
            )

            with pytest.raises(HTTPException) as exc_info:
                file_service.create_file(1, file_data)

            assert exc_info.value.status_code == 400
            assert "Invalid Mermaid diagram syntax" in str(exc_info.value.detail)

    @patch('app.services.file_service.User')
    def test_create_file_duplicate_content(self, mock_user_model, file_service, mock_user, sample_mermaid_content):
        """Test file creation with duplicate content"""
        # Mock user exists
        mock_user_model.query.return_value.filter.return_value.first.return_value = mock_user

        # Mock duplicate file exists
        mock_duplicate = Mock()
        file_service.db.query.return_value.filter.return_value.first.return_value = mock_duplicate
        file_service.db.add = Mock()
        file_service.db.commit = Mock()

        file_data = FileCreate(
            display_name="Test Diagram",
            file_type="mmd",
            content=sample_mermaid_content
        )

        with pytest.raises(HTTPException) as exc_info:
            file_service.create_file(1, file_data)

        assert exc_info.value.status_code == 409
        assert "identical content already exists" in str(exc_info.value.detail)

    def test_get_file_success(self, file_service, mock_user):
        """Test successful file retrieval"""
        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.user_id = 1
        mock_file.is_deleted = False

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.commit = Mock()

        result = file_service.get_file(1, 1)

        assert result == mock_file
        file_service.db.commit.assert_called_once()

    def test_get_file_not_found(self, file_service):
        """Test file retrieval with non-existent file"""
        file_service.db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            file_service.get_file(999, 1)

        assert exc_info.value.status_code == 404
        assert "File not found or access denied" in str(exc_info.value.detail)

    def test_get_file_access_denied(self, file_service):
        """Test file retrieval with access denied"""
        mock_file = Mock(spec=DiagramFile)
        mock_file.user_id = 2  # Different user

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file

        with pytest.raises(HTTPException) as exc_info:
            file_service.get_file(1, 1)  # User 1 trying to access User 2's file

        assert exc_info.value.status_code == 404
        assert "File not found or access denied" in str(exc_info.value.detail)

    def test_get_file_content_success(self, file_service, mock_user, sample_mermaid_content, temp_storage):
        """Test successful file content retrieval"""
        # Create test file
        test_file_path = Path(temp_storage) / "test.mmd"
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(sample_mermaid_content)

        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.user_id = 1
        mock_file.is_deleted = False
        mock_file.file_path = str(test_file_path)
        mock_file.filename = "test.mmd"
        mock_file.file_type = FileType.MERMAID
        mock_file.file_size = len(sample_mermaid_content.encode('utf-8'))

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.commit = Mock()

        result = file_service.get_file_content(1, 1)

        assert result.success == True
        assert result.content == sample_mermaid_content
        assert result.content_type == "text/plain"
        assert result.size == len(sample_mermaid_content.encode('utf-8'))

    def test_get_file_content_file_not_found(self, file_service, mock_user):
        """Test file content retrieval with non-existent file on disk"""
        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.user_id = 1
        mock_file.is_deleted = False
        mock_file.file_path = "/nonexistent/path/test.mmd"

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.commit = Mock()

        with pytest.raises(HTTPException) as exc_info:
            file_service.get_file_content(1, 1)

        assert exc_info.value.status_code == 404
        assert "File not found on disk" in str(exc_info.value.detail)

    def test_update_file_success(self, file_service, mock_user, sample_mermaid_content, temp_storage):
        """Test successful file update"""
        # Create test file
        test_file_path = Path(temp_storage) / "test.mmd"
        original_content = "graph TD\n    A --> B"
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(original_content)

        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.user_id = 1
        mock_file.is_deleted = False
        mock_file.file_path = str(test_file_path)
        mock_file.file_type = FileType.MERMAID
        mock_file.diagram_data = None
        mock_file.file_metadata = {}

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.commit = Mock()
        file_service.db.refresh = Mock()
        file_service._create_file_version = Mock()

        file_data = FileUpdate(
            content=sample_mermaid_content,
            description="Updated diagram"
        )

        result = file_service.update_file(1, 1, file_data)

        assert result == mock_file
        file_service.db.commit.assert_called()

        # Verify file was updated on disk
        with open(test_file_path, 'r', encoding='utf-8') as f:
            updated_content = f.read()
        assert updated_content == sample_mermaid_content

    def test_delete_file_soft(self, file_service, mock_user):
        """Test soft file deletion"""
        mock_file = Mock(spec=DiagramFile)
        mock_file.user_id = 1
        mock_file.is_deleted = False

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.commit = Mock()

        result = file_service.delete_file(1, 1, permanent=False)

        assert result == True
        assert mock_file.is_deleted == True
        assert mock_file.deleted_at is not None
        file_service.db.commit.assert_called_once()

    def test_delete_file_permanent(self, file_service, mock_user, temp_storage):
        """Test permanent file deletion"""
        # Create test file
        test_file_path = Path(temp_storage) / "test.mmd"
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write("test content")

        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.user_id = 1
        mock_file.is_deleted = False
        mock_file.file_path = str(test_file_path)

        mock_version = Mock()
        mock_version.file_path = "/path/to/version"

        file_service.db.query.return_value.filter.return_value.first.side_effect = [mock_file, mock_version]
        file_service.db.delete = Mock()
        file_service.db.commit = Mock()

        with patch('os.path.exists', return_value=True):
            with patch('os.remove') as mock_remove:
                result = file_service.delete_file(1, 1, permanent=True)

        assert result == True
        mock_remove.assert_called()
        file_service.db.delete.assert_called()
        file_service.db.commit.assert_called()

    def test_list_files_no_filters(self, file_service, mock_user):
        """Test listing files without filters"""
        mock_files = [Mock(spec=DiagramFile) for _ in range(5)]
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = mock_files
        mock_query.count.return_value = len(mock_files)
        file_service.db.query.return_value = mock_query

        files, total = file_service.list_files(1)

        assert len(files) == 5
        assert total == 5
        mock_query.filter.assert_called()

    def test_list_files_with_search(self, file_service, mock_user):
        """Test listing files with search query"""
        mock_files = [Mock(spec=DiagramFile)]
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = mock_files
        mock_query.count.return_value = 1
        file_service.db.query.return_value = mock_query

        search_query = FileSearchQuery(
            query="test",
            file_type=["mmd"],
            page=1,
            per_page=10
        )

        files, total = file_service.list_files(1, search_query)

        assert len(files) == 1
        assert total == 1

    def test_get_user_storage_stats(self, file_service, mock_user):
        """Test user storage statistics"""
        mock_files = [
            Mock(spec=DiagramFile, file_type=FileType.MERMAID, file_size=1000, project_name="Project1", tags=["test"]),
            Mock(spec=DiagramFile, file_type=FileType.JSON, file_size=2000, project_name="Project1", tags=["test"]),
            Mock(spec=DiagramFile, file_type=FileType.MERMAID, file_size=1500, project_name="Project2", tags=["diagram"]),
        ]

        file_service.db.query.return_value.filter.return_value.all.return_value = mock_files

        stats = file_service.get_user_storage_stats(1)

        assert stats["total_files"] == 3
        assert stats["total_size"] == 4500
        assert stats["files_by_type"]["mmd"] == 2
        assert stats["files_by_type"]["json"] == 1
        assert stats["files_by_project"]["Project1"] == 2
        assert stats["files_by_project"]["Project2"] == 1
        assert len(stats["recent_files"]) == 3

    def test_create_file_version(self, file_service, mock_user, temp_storage):
        """Test file version creation"""
        versions_path = Path(temp_storage) / "versions"
        versions_path.mkdir(exist_ok=True)

        mock_file = Mock(spec=DiagramFile)
        mock_file.id = 1
        mock_file.filename = "test.mmd"
        mock_file.mermaid_code = "graph TD\n    A --> B"
        mock_file.diagram_data = {}
        mock_file.file_metadata = {}
        mock_file.versions = Mock()
        mock_file.versions.count.return_value = 0

        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        file_service.db.add = Mock()
        file_service.db.commit = Mock()
        file_service.db.refresh = Mock()

        version = file_service._create_file_version(1, 1, "new content", "Test version")

        assert version.file_id == 1
        assert version.version_number == 1
        assert version.change_description == "Test version"
        file_service.db.add.assert_called_once()