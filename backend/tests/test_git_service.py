import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, MagicMock

from app.services.git_service import (
    GitService,
    GitServiceError,
    RepositoryNotFoundError,
    InvalidRepositoryError,
    GitOperationError,
    SecurityError,
    GitRepositoryInfo,
    GitCommitInfo
)


@pytest.fixture
def temp_git_base():
    """Create a temporary directory for Git repositories"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def git_service(temp_git_base):
    """Create GitService instance with temporary base path"""
    return GitService(base_path=temp_git_base)


@pytest.fixture
def sample_repo(git_service):
    """Create a sample repository for testing"""
    repo_info = git_service.create_repository("test-repo")
    return repo_info


class TestGitService:
    """Test cases for GitService"""

    def test_create_repository_new(self, git_service):
        """Test creating a new repository"""
        repo_info = git_service.create_repository("new-repo")

        assert repo_info.name == "new-repo"
        assert repo_info.default_branch in ["main", "master"]  # Git may use either
        assert repo_info.current_branch in ["main", "master"]
        assert not repo_info.is_bare
        assert repo_info.last_commit_message == "Initial commit"
        assert repo_info.last_commit_author == "Atlantis <atlantis@example.com>"

        # Check that repository exists
        repo_path = Path(repo_info.local_path)
        assert repo_path.exists()
        assert (repo_path / ".git").exists()
        assert (repo_path / "README.md").exists()

    def test_create_repository_bare(self, git_service):
        """Test creating a bare repository"""
        repo_info = git_service.create_repository("bare-repo", init_bare=True)

        assert repo_info.name == "bare-repo"
        assert repo_info.is_bare
        assert repo_info.last_commit_hash is None  # No commits in bare repo

        # Check that repository exists
        repo_path = Path(repo_info.local_path)
        assert repo_path.exists()
        assert not (repo_path / "README.md").exists()  # No working tree

    def test_create_repository_clone(self, git_service):
        """Test cloning a repository"""
        # First create a source repository
        source_repo = git_service.create_repository("source-repo")

        # Clone it
        repo_info = git_service.create_repository(
            "cloned-repo",
            url=f"file://{source_repo.local_path}"
        )

        assert repo_info.name == "cloned-repo"
        assert repo_info.last_commit_hash == source_repo.last_commit_hash

    def test_create_repository_invalid_name(self, git_service):
        """Test creating repository with invalid name"""
        with pytest.raises(GitOperationError):
            git_service.create_repository("invalid name with spaces")

    def test_create_repository_invalid_url(self, git_service):
        """Test creating repository with invalid URL"""
        with pytest.raises(SecurityError):
            git_service.create_repository("test-repo", url="file:///invalid")

        with pytest.raises(SecurityError):
            git_service.create_repository("test-repo", url="http://evil.com/../../../etc/passwd")

    def test_get_repository_info(self, git_service, sample_repo):
        """Test getting repository information"""
        repo_info = git_service.get_repository_info(sample_repo.id)

        assert repo_info.id == sample_repo.id
        assert repo_info.name == sample_repo.name
        assert repo_info.local_path == sample_repo.local_path
        assert not repo_info.is_bare
        assert repo_info.last_commit_message == "Initial commit"

    def test_get_repository_info_not_found(self, git_service):
        """Test getting info for non-existent repository"""
        with pytest.raises(RepositoryNotFoundError):
            git_service.get_repository_info("non-existent-id")

    def test_list_repositories(self, git_service):
        """Test listing repositories"""
        # Create multiple repositories
        repo1 = git_service.create_repository("repo1")
        repo2 = git_service.create_repository("repo2")

        repos = git_service.list_repositories()
        repo_ids = [repo.id for repo in repos]

        assert len(repos) >= 2
        assert repo1.id in repo_ids
        assert repo2.id in repo_ids

    def test_delete_repository(self, git_service, sample_repo):
        """Test deleting a repository"""
        repo_path = Path(sample_repo.local_path)
        assert repo_path.exists()

        git_service.delete_repository(sample_repo.id)

        assert not repo_path.exists()

    def test_delete_repository_not_found(self, git_service):
        """Test deleting non-existent repository"""
        with pytest.raises(RepositoryNotFoundError):
            git_service.delete_repository("non-existent-id")

    def test_get_commits(self, git_service, sample_repo):
        """Test getting commit history"""
        commits = git_service.get_commits(sample_repo.id)

        assert len(commits) == 1
        assert commits[0].message == "Initial commit"
        assert "README.md" in commits[0].files

    def test_get_commits_bare_repo(self, git_service):
        """Test getting commits from bare repository"""
        bare_repo = git_service.create_repository("bare-repo", init_bare=True)

        with pytest.raises(GitOperationError):
            git_service.get_commits(bare_repo.id)

    def test_get_commit_details(self, git_service, sample_repo):
        """Test getting detailed commit information"""
        commits = git_service.get_commits(sample_repo.id)
        commit_hash = commits[0].hash

        commit = git_service.get_commit_details(sample_repo.id, commit_hash)

        assert commit.hash == commit_hash
        assert commit.message == "Initial commit"
        assert "README.md" in commit.files

    def test_create_commit(self, git_service, sample_repo):
        """Test creating a commit"""
        # Add a file
        git_service.write_file(sample_repo.id, "test.txt", "test content")

        # Commit the file
        commit_hash = git_service.create_commit(
            sample_repo.id,
            "Add test file",
            files=["test.txt"]
        )

        assert commit_hash is not None

        # Check commits
        commits = git_service.get_commits(sample_repo.id)
        assert len(commits) == 2
        assert commits[0].message == "Add test file"

    def test_create_commit_all_files(self, git_service, sample_repo):
        """Test creating a commit with all changes"""
        # Add a file
        git_service.write_file(sample_repo.id, "test.txt", "test content")

        # Commit without specifying files (should commit all changes)
        commit_hash = git_service.create_commit(
            sample_repo.id,
            "Add test file"
        )

        assert commit_hash is not None

    def test_create_commit_bare_repo(self, git_service):
        """Test creating commit in bare repository"""
        bare_repo = git_service.create_repository("bare-repo", init_bare=True)

        with pytest.raises(GitOperationError):
            git_service.create_commit(bare_repo.id, "Test commit")

    def test_get_branches(self, git_service, sample_repo):
        """Test getting branches"""
        branches = git_service.get_branches(sample_repo.id)

        assert "main" in branches

    def test_create_branch(self, git_service, sample_repo):
        """Test creating a new branch"""
        branch_name = git_service.create_branch(
            sample_repo.id,
            "feature-branch"
        )

        assert branch_name == "feature-branch"

        branches = git_service.get_branches(sample_repo.id)
        assert "feature-branch" in branches

    def test_create_branch_with_base(self, git_service, sample_repo):
        """Test creating branch from specific base"""
        # First create another commit
        git_service.write_file(sample_repo.id, "test.txt", "test content")
        git_service.create_commit(sample_repo.id, "Add test file")

        # Create branch
        branch_name = git_service.create_branch(
            sample_repo.id,
            "feature-branch",
            base_branch="main"
        )

        assert branch_name == "feature-branch"

    def test_create_branch_bare_repo(self, git_service):
        """Test creating branch in bare repository"""
        bare_repo = git_service.create_repository("bare-repo", init_bare=True)

        with pytest.raises(GitOperationError):
            git_service.create_branch(bare_repo.id, "feature-branch")

    def test_switch_branch(self, git_service, sample_repo):
        """Test switching branches"""
        # Create a new branch
        git_service.create_branch(sample_repo.id, "feature-branch")

        # Switch to the branch
        git_service.switch_branch(sample_repo.id, "feature-branch")

        # Check current branch
        repo_info = git_service.get_repository_info(sample_repo.id)
        assert repo_info.current_branch == "feature-branch"

    def test_switch_branch_not_found(self, git_service, sample_repo):
        """Test switching to non-existent branch"""
        with pytest.raises(GitOperationError):
            git_service.switch_branch(sample_repo.id, "non-existent-branch")

    def test_get_status(self, git_service, sample_repo):
        """Test getting repository status"""
        status = git_service.get_status(sample_repo.id)

        assert not status["is_bare"]
        assert not status["is_dirty"]
        assert status["current_branch"] == "main"
        assert isinstance(status["files"], list)

    def test_get_status_with_changes(self, git_service, sample_repo):
        """Test getting status with uncommitted changes"""
        # Add an untracked file
        git_service.write_file(sample_repo.id, "untracked.txt", "untracked content")

        status = git_service.get_status(sample_repo.id)

        assert status["is_dirty"]
        assert any(f["path"] == "untracked.txt" and f["status"] == "untracked"
                  for f in status["files"])

    def test_read_file(self, git_service, sample_repo):
        """Test reading a file"""
        # Write a file first
        git_service.write_file(sample_repo.id, "test.txt", "test content")

        # Read it back
        content = git_service.read_file(sample_repo.id, "test.txt")

        assert content == "test content"

    def test_read_file_from_commit(self, git_service, sample_repo):
        """Test reading a file from a specific commit"""
        # Write and commit a file
        git_service.write_file(sample_repo.id, "test.txt", "test content")
        commit_hash = git_service.create_commit(sample_repo.id, "Add test file", ["test.txt"])

        # Read from the commit
        content = git_service.read_file(sample_repo.id, "test.txt", commit_hash)

        assert content == "test content"

    def test_read_file_not_found(self, git_service, sample_repo):
        """Test reading non-existent file"""
        with pytest.raises(GitOperationError):
            git_service.read_file(sample_repo.id, "non-existent.txt")

    def test_write_file(self, git_service, sample_repo):
        """Test writing a file"""
        git_service.write_file(sample_repo.id, "test.txt", "test content")

        file_path = Path(sample_repo.local_path) / "test.txt"
        assert file_path.exists()
        assert file_path.read_text() == "test content"

    def test_write_file_with_subdirectories(self, git_service, sample_repo):
        """Test writing a file in subdirectories"""
        git_service.write_file(sample_repo.id, "subdir/test.txt", "test content")

        file_path = Path(sample_repo.local_path) / "subdir" / "test.txt"
        assert file_path.exists()
        assert file_path.read_text() == "test content"

    def test_write_file_bare_repo(self, git_service):
        """Test writing file to bare repository"""
        bare_repo = git_service.create_repository("bare-repo", init_bare=True)

        with pytest.raises(GitOperationError):
            git_service.write_file(bare_repo.id, "test.txt", "test content")

    def test_write_file_security_check(self, git_service, sample_repo):
        """Test writing file outside repository directory"""
        with pytest.raises(SecurityError):
            git_service.write_file(sample_repo.id, "../../../etc/passwd", "malicious content")

    def test_file_size_limit(self, git_service):
        """Test file size limits"""
        # Mock the config to set a small file size limit
        with patch('app.services.git_service.settings') as mock_settings:
            mock_settings.GIT_MAX_FILE_SIZE_MB = 0.001  # 1KB limit

            repo_info = git_service.create_repository("size-test-repo")

            # Try to write a large file
            large_content = "x" * 2000  # 2KB
            with pytest.raises(GitOperationError, match="exceeds maximum allowed size"):
                git_service.write_file(repo_info.id, "large.txt", large_content)

    def test_repository_size_limit(self, git_service):
        """Test repository size limits"""
        # Mock the config to set a small repository size limit
        with patch('app.services.git_service.settings') as mock_settings:
            mock_settings.GIT_MAX_REPO_SIZE_MB = 0.001  # 1KB limit

            # Create repository that would exceed limit
            with pytest.raises(GitOperationError, match="exceeds maximum allowed size"):
                git_service.create_repository("large-repo")

    def test_push_pull_disabled(self, git_service, sample_repo):
        """Test disabled push/pull operations"""
        with patch('app.services.git_service.settings') as mock_settings:
            mock_settings.GIT_DISABLE_PUSH = True
            mock_settings.GIT_DISABLE_PULL = True

            # Test push disabled
            with pytest.raises(GitOperationError, match="Push operations are disabled"):
                git_service.push(sample_repo.id)

            # Test pull disabled
            with pytest.raises(GitOperationError, match="Pull operations are disabled"):
                git_service.pull(sample_repo.id)

    def test_invalid_repo_id(self, git_service):
        """Test operations with invalid repository ID"""
        with pytest.raises(RepositoryNotFoundError):
            git_service.get_repository_info("invalid-uuid")

        with pytest.raises(RepositoryNotFoundError):
            git_service.get_commits("invalid-uuid")

        with pytest.raises(RepositoryNotFoundError):
            git_service.create_commit("invalid-uuid", "test message")


class TestGitServiceIntegration:
    """Integration tests for GitService"""

    def test_full_workflow(self, git_service):
        """Test a complete Git workflow"""
        # Create repository
        repo_info = git_service.create_repository("workflow-test")

        # Create and checkout a feature branch
        git_service.create_branch(repo_info.id, "feature")
        git_service.switch_branch(repo_info.id, "feature")

        # Add some files
        git_service.write_file(repo_info.id, "feature.txt", "feature implementation")
        git_service.write_file(repo_info.id, "docs/readme.md", "# Feature Documentation")

        # Commit changes
        commit_hash = git_service.create_commit(
            repo_info.id,
            "Implement feature",
            files=["feature.txt", "docs/readme.md"]
        )

        # Check status
        status = git_service.get_status(repo_info.id)
        assert not status["is_dirty"]

        # Check commits
        commits = git_service.get_commits(repo_info.id)
        assert len(commits) == 2  # Initial commit + feature commit
        assert commits[0].message == "Implement feature"

        # Switch back to main
        git_service.switch_branch(repo_info.id, "main")

        # Verify feature file doesn't exist on main
        with pytest.raises(GitOperationError):
            git_service.read_file(repo_info.id, "feature.txt")

        # Check commit details
        commit = git_service.get_commit_details(repo_info.id, commit_hash)
        assert commit.message == "Implement feature"
        assert "feature.txt" in commit.files
        assert "docs/readme.md" in commit.files

    def test_multiple_branches_workflow(self, git_service):
        """Test working with multiple branches"""
        # Create repository
        repo_info = git_service.create_repository("multi-branch-test")

        # Create feature branch from main
        git_service.create_branch(repo_info.id, "feature1")
        git_service.switch_branch(repo_info.id, "feature1")
        git_service.write_file(repo_info.id, "feature1.txt", "feature 1 content")
        git_service.create_commit(repo_info.id, "Add feature 1", ["feature1.txt"])

        # Switch back to main and create another feature
        git_service.switch_branch(repo_info.id, "main")
        git_service.create_branch(repo_info.id, "feature2")
        git_service.switch_branch(repo_info.id, "feature2")
        git_service.write_file(repo_info.id, "feature2.txt", "feature 2 content")
        git_service.create_commit(repo_info.id, "Add feature 2", ["feature2.txt"])

        # Check that each branch has its own commits
        git_service.switch_branch(repo_info.id, "feature1")
        commits = git_service.get_commits(repo_info.id)
        assert any("Add feature 1" in c.message for c in commits)

        git_service.switch_branch(repo_info.id, "feature2")
        commits = git_service.get_commits(repo_info.id)
        assert any("Add feature 2" in c.message for c in commits)

        # Check available branches
        branches = git_service.get_branches(repo_info.id)
        assert "main" in branches
        assert "feature1" in branches
        assert "feature2" in branches