import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app
from app.services.git_service import (
    GitServiceError,
    RepositoryNotFoundError,
    InvalidRepositoryError,
    GitOperationError,
    SecurityError,
    GitRepositoryInfo,
    GitCommitInfo
)

client = TestClient(app)


class TestGitAPI:
    """Test cases for Git API endpoints"""

    @pytest.fixture
    def mock_git_service(self):
        """Mock GitService for testing"""
        with patch('app.api.git.git_service') as mock:
            yield mock

    def test_get_repositories_empty(self, mock_git_service):
        """Test getting repositories when none exist"""
        mock_git_service.list_repositories.return_value = []

        response = client.get("/api/git/repositories")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_repositories_with_data(self, mock_git_service):
        """Test getting repositories with data"""
        mock_repo = GitRepositoryInfo(
            id="test-id",
            name="test-repo",
            url="https://github.com/test/repo.git",
            local_path="/tmp/test-repo",
            default_branch="main",
            current_branch="main",
            is_bare=False,
            is_dirty=False,
            last_commit_hash="abc123",
            last_commit_message="Initial commit",
            last_commit_author="Test User <test@example.com>",
            last_commit_date=None
        )
        mock_git_service.list_repositories.return_value = [mock_repo]

        response = client.get("/api/git/repositories")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "test-id"
        assert data[0]["name"] == "test-repo"

    def test_create_repository(self, mock_git_service):
        """Test creating a repository"""
        mock_repo = GitRepositoryInfo(
            id="new-id",
            name="new-repo",
            url="",
            local_path="/tmp/new-repo",
            default_branch="main",
            current_branch="main",
            is_bare=False,
            is_dirty=False,
            last_commit_hash="abc123",
            last_commit_message="Initial commit",
            last_commit_author="Atlantis <atlantis@example.com>",
            last_commit_date=None
        )
        mock_git_service.create_repository.return_value = mock_repo

        request_data = {
            "name": "new-repo",
            "url": None,
            "init_bare": False
        }

        response = client.post("/api/git/repositories", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Repository created successfully"
        assert data["data"]["id"] == "new-id"
        assert data["data"]["name"] == "new-repo"

        mock_git_service.create_repository.assert_called_once_with(
            name="new-repo",
            url=None,
            init_bare=False
        )

    def test_create_repository_with_url(self, mock_git_service):
        """Test creating a repository by cloning"""
        mock_repo = GitRepositoryInfo(
            id="clone-id",
            name="cloned-repo",
            url="https://github.com/test/repo.git",
            local_path="/tmp/cloned-repo",
            default_branch="main",
            current_branch="main",
            is_bare=False,
            is_dirty=False
        )
        mock_git_service.create_repository.return_value = mock_repo

        request_data = {
            "name": "cloned-repo",
            "url": "https://github.com/test/repo.git",
            "init_bare": False
        }

        response = client.post("/api/git/repositories", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["data"]["url"] == "https://github.com/test/repo.git"

        mock_git_service.create_repository.assert_called_once_with(
            name="cloned-repo",
            url="https://github.com/test/repo.git",
            init_bare=False
        )

    def test_create_repository_invalid_data(self, mock_git_service):
        """Test creating repository with invalid data"""
        request_data = {
            "name": "",  # Empty name should fail
            "url": "https://github.com/test/repo.git"
        }

        response = client.post("/api/git/repositories", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_get_repository(self, mock_git_service):
        """Test getting a specific repository"""
        mock_repo = GitRepositoryInfo(
            id="test-id",
            name="test-repo",
            url="",
            local_path="/tmp/test-repo",
            default_branch="main",
            current_branch="main",
            is_bare=False,
            is_dirty=False
        )
        mock_git_service.get_repository_info.return_value = mock_repo

        response = client.get("/api/git/repositories/test-id")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == "test-id"
        assert data["name"] == "test-repo"

    def test_get_repository_not_found(self, mock_git_service):
        """Test getting non-existent repository"""
        mock_git_service.get_repository_info.side_effect = RepositoryNotFoundError("Repository not found")

        response = client.get("/api/git/repositories/non-existent")
        assert response.status_code == 404
        assert "Repository not found" in response.json()["detail"]

    def test_delete_repository(self, mock_git_service):
        """Test deleting a repository"""
        response = client.delete("/api/git/repositories/test-id")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Repository deleted successfully"

        mock_git_service.delete_repository.assert_called_once_with("test-id")

    def test_delete_repository_not_found(self, mock_git_service):
        """Test deleting non-existent repository"""
        mock_git_service.delete_repository.side_effect = RepositoryNotFoundError("Repository not found")

        response = client.delete("/api/git/repositories/non-existent")
        assert response.status_code == 404

    def test_get_commits(self, mock_git_service):
        """Test getting commits for a repository"""
        mock_commit = GitCommitInfo(
            hash="abc123",
            message="Test commit",
            author="Test User <test@example.com>",
            date=None,
            files=["file1.txt", "file2.txt"],
            parents=[]
        )
        mock_git_service.get_commits.return_value = [mock_commit]

        response = client.get("/api/git/repositories/test-id/commits")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["hash"] == "abc123"
        assert data[0]["message"] == "Test commit"
        assert data[0]["files"] == ["file1.txt", "file2.txt"]

        mock_git_service.get_commits.assert_called_once_with(
            "test-id", branch=None, limit=50, skip=0
        )

    def test_get_commits_with_params(self, mock_git_service):
        """Test getting commits with parameters"""
        mock_git_service.get_commits.return_value = []

        response = client.get("/api/git/repositories/test-id/commits?branch=feature&limit=10&skip=5")
        assert response.status_code == 200

        mock_git_service.get_commits.assert_called_once_with(
            "test-id", branch="feature", limit=10, skip=5
        )

    def test_get_commit_details(self, mock_git_service):
        """Test getting detailed commit information"""
        mock_commit = GitCommitInfo(
            hash="abc123",
            message="Test commit",
            author="Test User <test@example.com>",
            date=None,
            files=["file1.txt"],
            parents=[]
        )
        mock_git_service.get_commit_details.return_value = mock_commit

        response = client.get("/api/git/repositories/test-id/commits/abc123")
        assert response.status_code == 200

        data = response.json()
        assert data["hash"] == "abc123"
        assert data["message"] == "Test commit"

        mock_git_service.get_commit_details.assert_called_once_with("test-id", "abc123")

    def test_create_commit(self, mock_git_service):
        """Test creating a commit"""
        mock_git_service.create_commit.return_value = "def456"

        request_data = {
            "message": "Test commit message",
            "files": ["file1.txt", "file2.txt"],
            "author_name": "Test User",
            "author_email": "test@example.com"
        }

        response = client.post("/api/git/repositories/test-id/commit", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Changes committed successfully"
        assert data["data"]["commit_hash"] == "def456"

        mock_git_service.create_commit.assert_called_once_with(
            repo_id="test-id",
            message="Test commit message",
            files=["file1.txt", "file2.txt"],
            author_name="Test User",
            author_email="test@example.com"
        )

    def test_get_status(self, mock_git_service):
        """Test getting repository status"""
        mock_status = {
            "is_bare": False,
            "is_dirty": True,
            "current_branch": "main",
            "files": [
                {"path": "file1.txt", "status": "modified", "size": 100},
                {"path": "file2.txt", "status": "untracked", "size": 50}
            ]
        }
        mock_git_service.get_status.return_value = mock_status

        response = client.get("/api/git/repositories/test-id/status")
        assert response.status_code == 200

        data = response.json()
        assert data["is_dirty"] is True
        assert data["current_branch"] == "main"
        assert len(data["files"]) == 2

    def test_get_branches(self, mock_git_service):
        """Test getting repository branches"""
        mock_git_service.get_branches.return_value = ["main", "feature", "develop"]

        response = client.get("/api/git/repositories/test-id/branches")
        assert response.status_code == 200

        data = response.json()
        assert data == ["main", "feature", "develop"]

    def test_create_branch(self, mock_git_service):
        """Test creating a new branch"""
        mock_git_service.create_branch.return_value = "feature-branch"

        request_data = {
            "branch_name": "feature-branch",
            "base_branch": "main"
        }

        response = client.post("/api/git/repositories/test-id/branches", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Branch 'feature-branch' created successfully"
        assert data["data"]["branch_name"] == "feature-branch"

        mock_git_service.create_branch.assert_called_once_with(
            "test-id", "feature-branch", "main"
        )

    def test_switch_branch(self, mock_git_service):
        """Test switching branches"""
        response = client.post("/api/git/repositories/test-id/branches/feature/checkout")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Switched to branch 'feature'"

        mock_git_service.switch_branch.assert_called_once_with("test-id", "feature")

    def test_read_file(self, mock_git_service):
        """Test reading a file"""
        mock_git_service.read_file.return_value = "file content"

        response = client.get("/api/git/repositories/test-id/files/path/to/file.txt")
        assert response.status_code == 200

        data = response.json()
        assert data["content"] == "file content"

        mock_git_service.read_file.assert_called_once_with("test-id", "path/to/file.txt", None)

    def test_read_file_from_commit(self, mock_git_service):
        """Test reading a file from a specific commit"""
        mock_git_service.read_file.return_value = "old file content"

        response = client.get("/api/git/repositories/test-id/files/path/to/file.txt?commit_hash=abc123")
        assert response.status_code == 200

        data = response.json()
        assert data["content"] == "old file content"

        mock_git_service.read_file.assert_called_once_with("test-id", "path/to/file.txt", "abc123")

    def test_write_file(self, mock_git_service):
        """Test writing a file"""
        request_data = {
            "file_path": "path/to/file.txt",
            "content": "new file content"
        }

        response = client.post("/api/git/repositories/test-id/files/path/to/file.txt", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "File 'path/to/file.txt' written successfully"

        mock_git_service.write_file.assert_called_once_with("test-id", "path/to/file.txt", "new file content")

    def test_push(self, mock_git_service):
        """Test pushing changes"""
        request_data = {
            "remote": "origin",
            "branch": "main",
            "username": "testuser",
            "password": "testpass",
            "token": None
        }

        response = client.post("/api/git/repositories/test-id/push", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Changes pushed successfully"

        mock_git_service.push.assert_called_once_with(
            repo_id="test-id",
            remote="origin",
            branch="main",
            username="testuser",
            password="testpass",
            token=None
        )

    def test_pull(self, mock_git_service):
        """Test pulling changes"""
        request_data = {
            "remote": "origin",
            "branch": "main",
            "token": "ghp_xxxxxxxxxxxx"
        }

        response = client.post("/api/git/repositories/test-id/pull", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Changes pulled successfully"

        mock_git_service.pull.assert_called_once_with(
            repo_id="test-id",
            remote="origin",
            branch="main",
            username=None,
            password=None,
            token="ghp_xxxxxxxxxxxx"
        )

    def test_security_error_handling(self, mock_git_service):
        """Test handling of security errors"""
        mock_git_service.create_repository.side_effect = SecurityError("Invalid URL")

        request_data = {
            "name": "test-repo",
            "url": "file:///etc/passwd"
        }

        response = client.post("/api/git/repositories", json=request_data)
        assert response.status_code == 403
        assert "Invalid URL" in response.json()["detail"]

    def test_git_operation_error_handling(self, mock_git_service):
        """Test handling of Git operation errors"""
        mock_git_service.create_commit.side_effect = GitOperationError("Merge conflicts")

        request_data = {
            "message": "Test commit",
            "files": ["file.txt"]
        }

        response = client.post("/api/git/repositories/test-id/commit", json=request_data)
        assert response.status_code == 422
        assert "Merge conflicts" in response.json()["detail"]

    def test_invalid_repository_error_handling(self, mock_git_service):
        """Test handling of invalid repository errors"""
        mock_git_service.get_repository_info.side_effect = InvalidRepositoryError("Not a git repository")

        response = client.get("/api/git/repositories/invalid-id")
        assert response.status_code == 400
        assert "Not a git repository" in response.json()["detail"]

    def test_general_error_handling(self, mock_git_service):
        """Test handling of unexpected errors"""
        mock_git_service.list_repositories.side_effect = Exception("Unexpected error")

        response = client.get("/api/git/repositories")
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]

    def test_push_disabled(self, mock_git_service):
        """Test pushing when push operations are disabled"""
        mock_git_service.push.side_effect = GitOperationError("Push operations are disabled")

        request_data = {"remote": "origin", "branch": "main"}

        response = client.post("/api/git/repositories/test-id/push", json=request_data)
        assert response.status_code == 422
        assert "Push operations are disabled" in response.json()["detail"]

    def test_pull_disabled(self, mock_git_service):
        """Test pulling when pull operations are disabled"""
        mock_git_service.pull.side_effect = GitOperationError("Pull operations are disabled")

        request_data = {"remote": "origin", "branch": "main"}

        response = client.post("/api/git/repositories/test-id/pull", json=request_data)
        assert response.status_code == 422
        assert "Pull operations are disabled" in response.json()["detail"]


class TestGitAPIIntegration:
    """Integration tests for Git API with real Git operations"""

    @pytest.fixture
    def temp_repos_dir(self):
        """Create a temporary directory for repositories"""
        import tempfile
        import shutil
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    def test_full_api_workflow(self, temp_repos_dir):
        """Test a complete workflow through the API"""
        # Patch the GitService to use our temporary directory
        with patch('app.services.git_service.settings') as mock_settings:
            mock_settings.GIT_BASE_PATH = temp_repos_dir
            mock_settings.GIT_MAX_REPO_SIZE_MB = 100
            mock_settings.GIT_MAX_FILE_SIZE_MB = 10
            mock_settings.GIT_ALLOWED_SCHEMES = ["http://", "https://", "ssh://", "git://", "git@"]
            mock_settings.GIT_DISABLE_PUSH = False
            mock_settings.GIT_DISABLE_PULL = False

            # Import here to use patched settings
            from app.services.git_service import GitService
            real_git_service = GitService()

            with patch('app.api.git.git_service', real_git_service):
                # Create repository
                create_response = client.post("/api/git/repositories", json={
                    "name": "integration-test-repo",
                    "url": None,
                    "init_bare": False
                })
                assert create_response.status_code == 200
                repo_data = create_response.json()["data"]
                repo_id = repo_data["id"]

                # Get repository info
                get_response = client.get(f"/api/git/repositories/{repo_id}")
                assert get_response.status_code == 200
                assert get_response.json()["name"] == "integration-test-repo"

                # Get initial commits
                commits_response = client.get(f"/api/git/repositories/{repo_id}/commits")
                assert commits_response.status_code == 200
                initial_commits = commits_response.json()
                assert len(initial_commits) == 1
                assert initial_commits[0]["message"] == "Initial commit"

                # Write a file
                write_response = client.post(f"/api/git/repositories/{repo_id}/files/test.txt", json={
                    "file_path": "test.txt",
                    "content": "test content"
                })
                assert write_response.status_code == 200

                # Create a commit
                commit_response = client.post(f"/api/git/repositories/{repo_id}/commit", json={
                    "message": "Add test file",
                    "files": ["test.txt"]
                })
                assert commit_response.status_code == 200
                commit_hash = commit_response.json()["data"]["commit_hash"]

                # Verify the commit was created
                commits_response = client.get(f"/api/git/repositories/{repo_id}/commits")
                assert len(commits_response.json()) == 2

                # Get commit details
                detail_response = client.get(f"/api/git/repositories/{repo_id}/commits/{commit_hash}")
                assert detail_response.status_code == 200
                commit_detail = detail_response.json()
                assert commit_detail["message"] == "Add test file"
                assert "test.txt" in commit_detail["files"]

                # Read the file
                read_response = client.get(f"/api/git/repositories/{repo_id}/files/test.txt")
                assert read_response.status_code == 200
                assert read_response.json()["content"] == "test content"

                # Check repository status
                status_response = client.get(f"/api/git/repositories/{repo_id}/status")
                assert status_response.status_code == 200
                status = status_response.json()
                assert not status["is_dirty"]

                # Create a branch
                branch_response = client.post(f"/api/git/repositories/{repo_id}/branches", json={
                    "branch_name": "feature",
                    "base_branch": "main"
                })
                assert branch_response.status_code == 200

                # Switch to the branch
                checkout_response = client.post(f"/api/git/repositories/{repo_id}/branches/feature/checkout")
                assert checkout_response.status_code == 200

                # Verify current branch
                repo_response = client.get(f"/api/git/repositories/{repo_id}")
                assert repo_response.json()["current_branch"] == "feature"

                # List branches
                branches_response = client.get(f"/api/git/repositories/{repo_id}/branches")
                assert "feature" in branches_response.json()
                assert "main" in branches_response.json()

                # Delete repository
                delete_response = client.delete(f"/api/git/repositories/{repo_id}")
                assert delete_response.status_code == 200