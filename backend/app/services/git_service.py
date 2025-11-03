import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

import git
from git import Repo, InvalidGitRepositoryError, GitCommandError

from app.core.config import settings


@dataclass
class GitRepositoryInfo:
    id: str
    name: str
    url: str
    local_path: str
    default_branch: str
    current_branch: str
    is_bare: bool = False
    is_dirty: bool = False
    last_commit_hash: Optional[str] = None
    last_commit_message: Optional[str] = None
    last_commit_author: Optional[str] = None
    last_commit_date: Optional[datetime] = None


@dataclass
class GitCommitInfo:
    hash: str
    message: str
    author: str
    date: datetime
    files: List[str]
    parents: List[str]


@dataclass
class GitFileInfo:
    path: str
    name: str
    size: int
    is_tracked: bool
    is_modified: bool
    is_staged: bool
    is_untracked: bool


class GitServiceError(Exception):
    """Base exception for Git service errors"""
    pass


class RepositoryNotFoundError(GitServiceError):
    """Repository not found error"""
    pass


class InvalidRepositoryError(GitServiceError):
    """Invalid repository error"""
    pass


class GitOperationError(GitServiceError):
    """Git operation error"""
    pass


class SecurityError(GitServiceError):
    """Security-related error"""
    pass


class GitService:
    """Service for managing Git operations"""

    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or settings.GIT_BASE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

        # Validate base path is within expected directory
        self._validate_path_security(self.base_path)

    def _validate_path_security(self, path: Path) -> None:
        """Validate that path is within the base directory for security"""
        try:
            resolved_path = path.resolve()
            base_resolved = self.base_path.resolve()

            if not str(resolved_path).startswith(str(base_resolved)):
                raise SecurityError(f"Path {path} is outside allowed directory")
        except (OSError, ValueError) as e:
            raise SecurityError(f"Invalid path: {path}") from e

    def _get_repo_path(self, repo_id: str) -> Path:
        """Get the file system path for a repository"""
        repo_path = self.base_path / repo_id
        self._validate_path_security(repo_path)
        return repo_path

    def _validate_repo_url(self, url: str) -> None:
        """Validate repository URL for security"""
        from app.core.config import settings

        # Basic URL validation - allow HTTP, HTTPS, SSH, and Git protocols
        if not any(url.startswith(scheme) for scheme in settings.GIT_ALLOWED_SCHEMES):
            raise SecurityError(f"Invalid repository URL scheme: {url}")

        # Prevent file:// URLs for security
        if url.startswith('file://'):
            raise SecurityError("File:// URLs are not allowed")

        # Basic path traversal prevention
        if '..' in url or url.startswith('/'):
            raise SecurityError(f"Invalid repository URL format: {url}")

    def _get_repo_size_mb(self, repo_path: Path) -> float:
        """Calculate repository size in MB"""
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(repo_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total_size += os.path.getsize(fp)
        return total_size / (1024 * 1024)  # Convert to MB

    def _check_repository_size(self, repo_path: Path) -> None:
        """Check if repository size exceeds limits"""
        from app.core.config import settings

        size_mb = self._get_repo_size_mb(repo_path)
        if size_mb > settings.GIT_MAX_REPO_SIZE_MB:
            raise GitOperationError(f"Repository size ({size_mb:.1f}MB) exceeds maximum allowed size ({settings.GIT_MAX_REPO_SIZE_MB}MB)")

    def _check_file_size(self, file_path: Path) -> None:
        """Check if file size exceeds limits"""
        from app.core.config import settings

        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            if size_mb > settings.GIT_MAX_FILE_SIZE_MB:
                raise GitOperationError(f"File size ({size_mb:.1f}MB) exceeds maximum allowed size ({settings.GIT_MAX_FILE_SIZE_MB}MB)")

    def _get_repo(self, repo_id: str) -> Repo:
        """Get Git repository object"""
        repo_path = self._get_repo_path(repo_id)

        if not repo_path.exists():
            raise RepositoryNotFoundError(f"Repository {repo_id} not found")

        try:
            return Repo(repo_path)
        except InvalidGitRepositoryError as e:
            raise InvalidRepositoryError(f"Invalid Git repository: {repo_id}") from e

    def create_repository(self, name: str, url: Optional[str] = None,
                         init_bare: bool = False) -> GitRepositoryInfo:
        """Create a new Git repository"""
        # Validate repository name
        if not name or not name.replace('-', '').replace('_', '').isalnum():
            raise GitOperationError("Repository name must be alphanumeric with hyphens and underscores only")

        repo_id = str(uuid.uuid4())
        repo_path = self._get_repo_path(repo_id)

        try:
            # Create the repository
            if url:
                # Clone existing repository
                self._validate_repo_url(url)
                repo = Repo.clone_from(url, repo_path, bare=init_bare)
            else:
                # Initialize new repository
                repo = Repo.init(repo_path, bare=init_bare)

                # Create initial commit if not bare
                if not init_bare:
                    # Create a README file
                    readme_path = repo_path / "README.md"
                    readme_path.write_text(f"# {name}\n\nInitial repository created by Atlantis.\n")

                    # Configure git user (always set to ensure consistency)
                    with repo.config_writer() as config:
                        config.set_value('user', 'name', 'Atlantis')
                        config.set_value('user', 'email', 'atlantis@example.com')

                    # Add and commit
                    repo.index.add(['README.md'])
                    repo.index.commit("Initial commit")

            # Check repository size
            if not init_bare:
                self._check_repository_size(repo_path)

            # Store the repository name in a metadata file
            metadata_path = repo_path / ".atlantis-metadata.json"
            import json
            metadata = {"name": name, "url": url or ""}
            metadata_path.write_text(json.dumps(metadata))

            # Get repository info
            return self.get_repository_info(repo_id)

        except GitCommandError as e:
            # Clean up on failure
            if repo_path.exists():
                shutil.rmtree(repo_path)
            raise GitOperationError(f"Failed to create repository: {str(e)}") from e
        except Exception as e:
            # Clean up on failure
            if repo_path.exists():
                shutil.rmtree(repo_path)
            raise GitOperationError(f"Unexpected error creating repository: {str(e)}") from e

    def get_repository_info(self, repo_id: str) -> GitRepositoryInfo:
        """Get information about a repository"""
        repo = self._get_repo(repo_id)
        repo_path = self._get_repo_path(repo_id)

        # Check repository size
        if not repo.bare:
            self._check_repository_size(Path(repo.working_dir))

        # Read metadata
        metadata_path = repo_path / ".atlantis-metadata.json"
        name = repo_path.name  # Default to directory name
        url = ""

        if metadata_path.exists():
            try:
                import json
                metadata = json.loads(metadata_path.read_text())
                name = metadata.get("name", name)
                url = metadata.get("url", "")
            except Exception:
                pass  # Use defaults if metadata is corrupted

        # Get basic info
        is_bare = repo.bare
        is_dirty = repo.is_dirty()

        # Get branch info
        if is_bare:
            default_branch = "main"  # Default for bare repos
            current_branch = "main"
            last_commit_hash = None
            last_commit_message = None
            last_commit_author = None
            last_commit_date = None
        else:
            try:
                default_branch = repo.active_branch.name
                current_branch = repo.active_branch.name

                # Get last commit info
                try:
                    last_commit = repo.head.commit
                    last_commit_hash = last_commit.hexsha
                    last_commit_message = last_commit.message.strip()
                    last_commit_author = f"{last_commit.author.name} <{last_commit.author.email}>"
                    last_commit_date = last_commit.committed_datetime
                except Exception:
                    last_commit_hash = None
                    last_commit_message = None
                    last_commit_author = None
                    last_commit_date = None
            except Exception:
                default_branch = "main"
                current_branch = "main"
                last_commit_hash = None
                last_commit_message = None
                last_commit_author = None
                last_commit_date = None

        return GitRepositoryInfo(
            id=repo_id,
            name=name,
            url=url,
            local_path=str(repo_path),
            default_branch=default_branch,
            current_branch=current_branch,
            is_bare=is_bare,
            is_dirty=is_dirty,
            last_commit_hash=last_commit_hash,
            last_commit_message=last_commit_message,
            last_commit_author=last_commit_author,
            last_commit_date=last_commit_date
        )

    def list_repositories(self) -> List[GitRepositoryInfo]:
        """List all repositories"""
        repositories = []

        for repo_path in self.base_path.iterdir():
            if repo_path.is_dir():
                try:
                    # Try to get repo info
                    repo_id = repo_path.name
                    try:
                        uuid.UUID(repo_id)  # Validate it's a UUID
                        repo_info = self.get_repository_info(repo_id)
                        repositories.append(repo_info)
                    except (ValueError, RepositoryNotFoundError, InvalidRepositoryError):
                        # Skip invalid directories
                        continue
                except Exception:
                    # Skip directories that aren't valid repos
                    continue

        return repositories

    def delete_repository(self, repo_id: str, force: bool = False) -> None:
        """Delete a repository"""
        repo_path = self._get_repo_path(repo_id)

        if not repo_path.exists():
            raise RepositoryNotFoundError(f"Repository {repo_id} not found")

        try:
            shutil.rmtree(repo_path)
        except OSError as e:
            raise GitOperationError(f"Failed to delete repository: {str(e)}") from e

    def get_commits(self, repo_id: str, branch: Optional[str] = None,
                   limit: int = 50, skip: int = 0) -> List[GitCommitInfo]:
        """Get commit history for a repository"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot get commits from bare repository")

        try:
            # Determine which ref to use
            if branch:
                ref = f"refs/heads/{branch}"
                if ref not in repo.refs:
                    raise GitOperationError(f"Branch '{branch}' not found")
            else:
                ref = "HEAD"

            commits = []
            for i, commit in enumerate(repo.iter_commits(ref)):
                if i < skip:
                    continue
                if len(commits) >= limit:
                    break

                # Get changed files
                try:
                    if commit.parents:
                        # Compare with parent to get changed files
                        diff = commit.diff(commit.parents[0])
                        files = [item.a_path for item in diff if item.a_path]
                    else:
                        # Initial commit - show all files
                        files = list(commit.stats.files.keys())
                except Exception:
                    files = []

                commit_info = GitCommitInfo(
                    hash=commit.hexsha,
                    message=commit.message.strip(),
                    author=f"{commit.author.name} <{commit.author.email}>",
                    date=commit.committed_datetime,
                    files=files,
                    parents=[p.hexsha for p in commit.parents]
                )
                commits.append(commit_info)

            return commits

        except GitCommandError as e:
            raise GitOperationError(f"Failed to get commits: {str(e)}") from e

    def get_commit_details(self, repo_id: str, commit_hash: str) -> GitCommitInfo:
        """Get detailed information about a specific commit"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot get commit details from bare repository")

        try:
            commit = repo.commit(commit_hash)

            # Get changed files
            try:
                if commit.parents:
                    diff = commit.diff(commit.parents[0])
                    files = [item.a_path for item in diff if item.a_path]
                else:
                    files = list(commit.stats.files.keys())
            except Exception:
                files = []

            return GitCommitInfo(
                hash=commit.hexsha,
                message=commit.message.strip(),
                author=f"{commit.author.name} <{commit.author.email}>",
                date=commit.committed_datetime,
                files=files,
                parents=[p.hexsha for p in commit.parents]
            )

        except Exception as e:
            raise GitOperationError(f"Commit {commit_hash} not found: {str(e)}") from e

    def create_commit(self, repo_id: str, message: str, files: Optional[List[str]] = None,
                     author_name: Optional[str] = None, author_email: Optional[str] = None) -> str:
        """Create a commit in the repository"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot commit to bare repository")

        try:
            # Stage files
            if files:
                # Validate file paths
                for file_path in files:
                    file_full_path = Path(repo.working_dir) / file_path
                    self._validate_path_security(file_full_path)

                repo.index.add(files)
            else:
                # Add all changes
                repo.index.add(repo.untracked_files)

                # Also add modified files
                for item in repo.index.diff(None):
                    repo.index.add([item.a_path])

            # Configure author (always set to ensure consistency)
            with repo.config_writer() as config:
                if author_name and author_email:
                    config.set_value('user', 'name', author_name)
                    config.set_value('user', 'email', author_email)
                else:
                    # Set default author
                    config.set_value('user', 'name', 'Atlantis')
                    config.set_value('user', 'email', 'atlantis@example.com')

            # Create commit
            commit = repo.index.commit(message)
            return commit.hexsha

        except GitCommandError as e:
            raise GitOperationError(f"Failed to create commit: {str(e)}") from e

    def get_branches(self, repo_id: str) -> List[str]:
        """List all branches in the repository"""
        repo = self._get_repo(repo_id)

        try:
            branches = [ref.name for ref in repo.branches]
            return branches
        except Exception as e:
            raise GitOperationError(f"Failed to get branches: {str(e)}") from e

    def create_branch(self, repo_id: str, branch_name: str, base_branch: Optional[str] = None) -> str:
        """Create a new branch"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot create branch in bare repository")

        try:
            # Get base commit
            if base_branch:
                base_ref = f"refs/heads/{base_branch}"
                if base_ref not in repo.refs:
                    raise GitOperationError(f"Base branch '{base_branch}' not found")
                base_commit = repo.refs[base_ref]
            else:
                base_commit = repo.head.commit

            # Create new branch
            new_branch = repo.create_head(branch_name, base_commit)
            return new_branch.name

        except GitCommandError as e:
            raise GitOperationError(f"Failed to create branch: {str(e)}") from e

    def switch_branch(self, repo_id: str, branch_name: str) -> None:
        """Switch to a different branch"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot switch branches in bare repository")

        try:
            # Check if branch exists in heads
            if branch_name not in repo.heads:
                raise GitOperationError(f"Branch '{branch_name}' not found")

            # Checkout the branch
            repo.heads[branch_name].checkout()

        except GitCommandError as e:
            raise GitOperationError(f"Failed to switch branch: {str(e)}") from e

    def get_status(self, repo_id: str) -> Dict[str, Any]:
        """Get repository status"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            return {"is_bare": True, "is_dirty": False, "files": []}

        try:
            status = {
                "is_bare": False,
                "is_dirty": repo.is_dirty(),
                "current_branch": repo.active_branch.name,
                "files": []
            }

            # Get untracked files
            for file_path in repo.untracked_files:
                file_full_path = Path(repo.working_dir) / file_path
                file_info = {
                    "path": file_path,
                    "status": "untracked",
                    "size": file_full_path.stat().st_size if file_full_path.exists() else 0
                }
                status["files"].append(file_info)

            # Get modified files
            for item in repo.index.diff(None):
                file_info = {
                    "path": item.a_path,
                    "status": "modified",
                    "size": 0  # Could get actual size if needed
                }
                status["files"].append(file_info)

            # Get staged files
            for item in repo.index.diff("HEAD"):
                file_info = {
                    "path": item.a_path,
                    "status": "staged",
                    "size": 0
                }
                status["files"].append(file_info)

            return status

        except Exception as e:
            raise GitOperationError(f"Failed to get status: {str(e)}") from e

    def read_file(self, repo_id: str, file_path: str, commit_hash: Optional[str] = None) -> str:
        """Read file content from repository"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot read files from bare repository")

        try:
            # Validate file path
            file_full_path = Path(repo.working_dir) / file_path
            self._validate_path_security(file_full_path)

            if commit_hash:
                # Read from specific commit
                commit = repo.commit(commit_hash)
                try:
                    blob = commit.tree / file_path
                    return blob.data_stream.read().decode('utf-8')
                except KeyError:
                    raise GitOperationError(f"File {file_path} not found in commit {commit_hash}")
            else:
                # Read from working directory
                if not file_full_path.exists():
                    raise GitOperationError(f"File {file_path} not found")

                return file_full_path.read_text(encoding='utf-8')

        except GitCommandError as e:
            raise GitOperationError(f"Failed to read file: {str(e)}") from e

    def write_file(self, repo_id: str, file_path: str, content: str) -> None:
        """Write file content to repository working directory"""
        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot write files to bare repository")

        try:
            # Validate file path
            file_full_path = Path(repo.working_dir) / file_path
            self._validate_path_security(file_full_path)

            # Create parent directories if needed
            file_full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write file
            file_full_path.write_text(content, encoding='utf-8')

            # Check file size
            self._check_file_size(file_full_path)

        except Exception as e:
            raise GitOperationError(f"Failed to write file: {str(e)}") from e

    def push(self, repo_id: str, remote: str = "origin", branch: Optional[str] = None,
             username: Optional[str] = None, password: Optional[str] = None,
             token: Optional[str] = None) -> None:
        """Push changes to remote repository"""
        from app.core.config import settings

        # Check if push is disabled
        if settings.GIT_DISABLE_PUSH:
            raise GitOperationError("Push operations are disabled")

        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot push from bare repository")

        try:
            # Get remote
            if remote not in repo.remotes:
                raise GitOperationError(f"Remote '{remote}' not found")

            remote_obj = repo.remotes[remote]

            # Configure authentication if provided
            push_kwargs = {}

            if token:
                # Use token for authentication
                import os
                os.environ['GIT_USERNAME'] = 'x-access-token'
                os.environ['GIT_PASSWORD'] = token
                push_kwargs['force_with_lease'] = True
            elif username and password:
                # Use username/password for authentication
                import os
                os.environ['GIT_USERNAME'] = username
                os.environ['GIT_PASSWORD'] = password

            # Determine what to push
            if branch:
                refspec = f"refs/heads/{branch}"
            else:
                refspec = "HEAD"

            # Push
            remote_obj.push(refspec, **push_kwargs)

        except GitCommandError as e:
            raise GitOperationError(f"Failed to push: {str(e)}") from e
        finally:
            # Clean up environment variables
            import os
            os.environ.pop('GIT_USERNAME', None)
            os.environ.pop('GIT_PASSWORD', None)

    def pull(self, repo_id: str, remote: str = "origin", branch: Optional[str] = None,
             username: Optional[str] = None, password: Optional[str] = None,
             token: Optional[str] = None) -> None:
        """Pull changes from remote repository"""
        from app.core.config import settings

        # Check if pull is disabled
        if settings.GIT_DISABLE_PULL:
            raise GitOperationError("Pull operations are disabled")

        repo = self._get_repo(repo_id)

        if repo.bare:
            raise GitOperationError("Cannot pull to bare repository")

        try:
            # Get remote
            if remote not in repo.remotes:
                raise GitOperationError(f"Remote '{remote}' not found")

            remote_obj = repo.remotes[remote]

            # Configure authentication if provided
            pull_kwargs = {}

            if token:
                # Use token for authentication
                import os
                os.environ['GIT_USERNAME'] = 'x-access-token'
                os.environ['GIT_PASSWORD'] = token
            elif username and password:
                # Use username/password for authentication
                import os
                os.environ['GIT_USERNAME'] = username
                os.environ['GIT_PASSWORD'] = password

            # Pull
            if branch:
                remote_obj.pull(f"refs/heads/{branch}:refs/heads/{branch}", **pull_kwargs)
            else:
                remote_obj.pull(**pull_kwargs)

        except GitCommandError as e:
            raise GitOperationError(f"Failed to pull: {str(e)}") from e
        finally:
            # Clean up environment variables
            import os
            os.environ.pop('GIT_USERNAME', None)
            os.environ.pop('GIT_PASSWORD', None)


# Global git service instance
git_service = GitService()