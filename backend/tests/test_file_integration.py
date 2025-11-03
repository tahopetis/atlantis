"""
Integration tests for the complete file storage system
"""

import pytest
import tempfile
import shutil
import json
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from app.main import app
from app.core.security import create_access_token
from app.services.file_service import FileStorageService
from app.utils.file_validators import FileValidator


@pytest.fixture
def client():
    """Test client"""
    return TestClient(app)


@pytest.fixture
def temp_storage():
    """Create temporary storage directory"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def auth_headers():
    """Authentication headers for test user"""
    token = create_access_token(data={"sub": "1", "username": "testuser"})
    return {"Authorization": f"Bearer {token}"}


class TestFileStorageIntegration:
    """Integration tests for the complete file storage system"""

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_complete_file_workflow(self, mock_file_service, mock_get_db, mock_get_user,
                                   client, auth_headers, temp_storage):
        """Test complete file workflow: create -> update -> version -> delete"""
        # Setup mocks
        mock_user = Mock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        mock_db = Mock()
        mock_get_db.return_value = mock_db

        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        # Mock file responses
        mock_created_file = Mock()
        mock_created_file.id = 1
        mock_created_file.display_name = "Test Diagram"
        mock_created_file.file_type.value = "mmd"
        mock_created_file.mermaid_code = "graph TD\n    A --> B"
        mock_created_file.tags = ["test"]
        mock_created_file.project_name = "Test Project"
        mock_created_file.created_at = "2024-01-01T00:00:00Z"
        mock_created_file.updated_at = "2024-01-01T00:00:00Z"
        mock_created_file.user_id = 1
        mock_created_file.file_size = 100
        mock_created_file.file_hash = "abc123"

        mock_updated_file = Mock()
        mock_updated_file.id = 1
        mock_updated_file.display_name = "Updated Diagram"
        mock_updated_file.file_type.value = "mmd"
        mock_updated_file.mermaid_code = "graph TD\n    A --> B --> C"
        mock_updated_file.tags = ["test", "updated"]
        mock_updated_file.updated_at = "2024-01-01T01:00:00Z"
        mock_updated_file.user_id = 1
        mock_updated_file.file_size = 150
        mock_updated_file.file_hash = "def456"

        mock_service_instance.create_file.return_value = mock_created_file
        mock_service_instance.get_file.return_value = mock_created_file
        mock_service_instance.update_file.return_value = mock_updated_file
        mock_service_instance.delete_file.return_value = True

        # 1. Create file
        file_data = {
            "display_name": "Test Diagram",
            "file_type": "mmd",
            "content": "graph TD\n    A[Start] --> B[End]",
            "tags": ["test"],
            "project_name": "Test Project"
        }

        response = client.post("/api/files/", json=file_data, headers=auth_headers)
        assert response.status_code == 200
        created_data = response.json()
        assert created_data["success"] == True
        assert created_data["file"]["display_name"] == "Test Diagram"

        # 2. Get file
        response = client.get("/api/files/1", headers=auth_headers)
        assert response.status_code == 200
        file_data = response.json()
        assert file_data["display_name"] == "Test Diagram"

        # 3. Update file
        update_data = {
            "display_name": "Updated Diagram",
            "content": "graph TD\n    A[Start] --> B[Process] --> C[End]",
            "tags": ["test", "updated"]
        }

        response = client.put("/api/files/1", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        updated_data = response.json()
        assert updated_data["display_name"] == "Updated Diagram"

        # 4. Delete file
        response = client.delete("/api/files/1", headers=auth_headers)
        assert response.status_code == 200
        delete_data = response.json()
        assert delete_data["success"] == True

    def test_file_validator_mermaid_content(self):
        """Test Mermaid content validation"""
        # Valid Mermaid content
        valid_content = """graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E"""

        is_valid, error = FileValidator.validate_content_by_type(
            valid_content, FileValidator.ALLOWED_EXTENSIONS['.mmd']
        )
        assert is_valid == True
        assert error is None

        # Invalid Mermaid content
        invalid_content = "This is not a Mermaid diagram"

        is_valid, error = FileValidator.validate_content_by_type(
            invalid_content, FileValidator.ALLOWED_EXTENSIONS['.mmd']
        )
        assert is_valid == False
        assert "Invalid Mermaid diagram syntax" in error

    def test_file_validator_json_content(self):
        """Test JSON content validation"""
        # Valid JSON content
        valid_json = json.dumps({
            "display_name": "Test Diagram",
            "mermaid_code": "graph TD\n    A --> B",
            "diagram_data": {
                "nodes": [{"id": "A", "label": "Start"}],
                "edges": [{"from": "A", "to": "B"}]
            }
        })

        is_valid, error = FileValidator.validate_content_by_type(
            valid_json, FileValidator.ALLOWED_EXTENSIONS['.json']
        )
        assert is_valid == True
        assert error is None

        # Invalid JSON content
        invalid_json = "This is not valid JSON"

        is_valid, error = FileValidator.validate_content_by_type(
            invalid_json, FileValidator.ALLOWED_EXTENSIONS['.json']
        )
        assert is_valid == False
        assert "Invalid JSON format" in error

    def test_file_validator_markdown_content(self):
        """Test Markdown content validation"""
        # Valid Markdown with Mermaid
        valid_md = """# My Diagram

This is a sample diagram:

```mermaid
graph TD
    A[Start] --> B[End]
```

End of document."""

        is_valid, error = FileValidator.validate_content_by_type(
            valid_md, FileValidator.ALLOWED_EXTENSIONS['.md']
        )
        assert is_valid == True
        assert error is None

        # Invalid Markdown (no Mermaid blocks)
        invalid_md = """# Just Text

This is regular markdown without any diagrams."""

        is_valid, error = FileValidator.validate_content_by_type(
            invalid_md, FileValidator.ALLOWED_EXTENSIONS['.md']
        )
        assert is_valid == False
        assert "must contain at least one Mermaid code block" in error

    def test_filename_validation_and_sanitization(self):
        """Test filename validation and sanitization"""
        # Valid filenames
        valid_filenames = [
            "diagram.mmd",
            "my-diagram-v1.json",
            "simple_flowchart.md"
        ]

        for filename in valid_filenames:
            is_valid, error = FileValidator.validate_filename(filename)
            assert is_valid == True
            assert error is None

        # Invalid filenames
        invalid_filenames = [
            "../../../etc/passwd",
            "file<name>.mmd",
            "file:name.mmd",
            "",
            "a" * 300  # Too long
        ]

        for filename in invalid_filenames:
            is_valid, error = FileValidator.validate_filename(filename)
            assert is_valid == False
            assert error is not None

        # Test sanitization
        dangerous_name = "../../../dangerous<file>.mmd"
        sanitized = FileValidator.sanitize_filename(dangerous_name)
        assert ".." not in sanitized
        assert "<" not in sanitized
        assert ">" not in sanitized
        assert sanitized.endswith(".mmd")

    def test_mermaid_extraction_from_markdown(self):
        """Test Mermaid code extraction from Markdown"""
        markdown_content = """# Document

Here's a diagram:

```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```

Another diagram:

```mermaid
flowchart LR
    Input --> Processing --> Output
```

End of document."""

        mermaid_blocks = FileValidator.extract_mermaid_from_markdown(markdown_content)
        assert len(mermaid_blocks) == 2
        assert "graph TD" in mermaid_blocks[0]
        assert "flowchart LR" in mermaid_blocks[1]

    def test_diagram_data_extraction_from_json(self):
        """Test diagram data extraction from JSON"""
        json_content = json.dumps({
            "display_name": "Test",
            "mermaid_code": "graph TD\n    A --> B",
            "nodes": [{"id": "A", "label": "Start"}, {"id": "B", "label": "End"}],
            "edges": [{"from": "A", "to": "B"}],
            "theme": "dark",
            "metadata": {"author": "test"}
        })

        diagram_data = FileValidator.extract_diagram_data_from_json(json_content)

        assert diagram_data["mermaid_code"] == "graph TD\n    A --> B"
        assert len(diagram_data["nodes"]) == 2
        assert len(diagram_data["edges"]) == 1
        assert diagram_data["theme"] == "dark"
        assert diagram_data["metadata"]["author"] == "test"

    def test_content_security_validation(self):
        """Test content security validation"""
        # Safe content
        safe_content = "graph TD\n    A[Start] --> B[End]"
        is_safe, error = FileValidator.validate_file_content_security(safe_content)
        assert is_safe == True
        assert error is None

        # Dangerous content with script
        dangerous_content = "graph TD\n    A[Start] --> B[<script>alert('xss')</script>]"
        is_safe, error = FileValidator.validate_file_content_security(dangerous_content)
        assert is_safe == False
        assert "dangerous code" in error

        # Dangerous content with file path
        path_content = "graph TD\n    A[Start] --> B[../../../etc/passwd]"
        is_safe, error = FileValidator.validate_file_content_security(path_content)
        assert is_safe == False
        assert "dangerous file paths" in error

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_import_export_workflow(self, mock_file_service, mock_get_db, mock_get_user,
                                   client, auth_headers):
        """Test import and export workflow"""
        # Setup mocks
        mock_user = Mock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        mock_db = Mock()
        mock_get_db.return_value = mock_db

        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        # Mock file for import
        mock_imported_file = Mock()
        mock_imported_file.id = 1
        mock_imported_file.display_name = "Imported Diagram"
        mock_service_instance.create_file.return_value = mock_imported_file

        # Mock file content for export
        mock_content_response = Mock()
        mock_content_response.success = True
        mock_content_response.content = "graph TD\n    A --> B"
        mock_service_instance.get_file_content.return_value = mock_content_response
        mock_service_instance.get_file.return_value = mock_imported_file

        # 1. Import file
        import_data = {
            "content": "graph TD\n    A[Start] --> B[End]",
            "filename": "imported.mmd",
            "file_type": "mmd",
            "display_name": "Imported Diagram"
        }

        response = client.post("/api/files/import", json=import_data, headers=auth_headers)
        assert response.status_code == 200
        import_result = response.json()
        assert import_result["success"] == True
        assert import_result["file"]["display_name"] == "Imported Diagram"

        # 2. Export as JSON
        response = client.get("/api/files/1/export?format=json", headers=auth_headers)
        assert response.status_code == 200

        # 3. Export as Mermaid
        response = client.get("/api/files/1/export?format=mmd", headers=auth_headers)
        assert response.status_code == 200

        # 4. Export as Markdown
        response = client.get("/api/files/1/export?format=md", headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.files.get_current_active_user')
    @patch('app.api.files.get_db')
    @patch('app.api.files.FileStorageService')
    def test_file_statistics(self, mock_file_service, mock_get_db, mock_get_user,
                            client, auth_headers):
        """Test file statistics functionality"""
        # Setup mocks
        mock_user = Mock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        mock_db = Mock()
        mock_get_db.return_value = mock_db

        mock_service_instance = Mock()
        mock_file_service.return_value = mock_service_instance

        # Mock statistics data
        stats_data = {
            "total_files": 25,
            "total_size": 1024000,
            "files_by_type": {"mmd": 20, "json": 5},
            "files_by_project": {"Project A": 15, "Project B": 10},
            "recent_files": [],
            "storage_limit": 10485760
        }
        mock_service_instance.get_user_storage_stats.return_value = stats_data

        response = client.get("/api/files/stats/overview", headers=auth_headers)
        assert response.status_code == 200

        stats = response.json()
        assert stats["total_files"] == 25
        assert stats["total_size"] == 1024000
        assert stats["files_by_type"]["mmd"] == 20
        assert stats["storage_limit"] == 10485760


if __name__ == "__main__":
    pytest.main([__file__, "-v"])