from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    # App settings
    APP_NAME: str = "Atlantis API"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./atlantis.db"

    # Security
    SECRET_KEY: str = "atlantis-dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8
    ENABLE_PASSWORD_STRENGTH_CHECK: bool = True

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW: int = 300  # 5 minutes
    RATE_LIMIT_REGISTER_ATTEMPTS: int = 3
    RATE_LIMIT_REGISTER_WINDOW: int = 600  # 10 minutes
    RATE_LIMIT_PASSWORD_RESET_ATTEMPTS: int = 3
    RATE_LIMIT_PASSWORD_RESET_WINDOW: int = 600  # 10 minutes
    RATE_LIMIT_DEFAULT_REQUESTS: int = 100
    RATE_LIMIT_DEFAULT_WINDOW: int = 3600  # 1 hour

    # Email settings (for password reset, verification)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    FROM_EMAIL: str = ""

    # Git settings
    GIT_BASE_PATH: str = "./repositories"
    GIT_MAX_REPO_SIZE_MB: int = 1000  # Maximum repository size in MB
    GIT_MAX_FILE_SIZE_MB: int = 10  # Maximum file size in MB
    GIT_ALLOWED_SCHEMES: List[str] = ["http://", "https://", "ssh://", "git://", "git@"]
    GIT_DISABLE_PUSH: bool = False  # Set to True to disable push operations
    GIT_DISABLE_PULL: bool = False  # Set to True to disable pull operations

    # File storage settings
    FILE_STORAGE_PATH: str = "./storage"  # Base path for file storage
    FILE_MAX_SIZE_MB: int = 10  # Maximum file size in MB for diagram files
    FILE_MAX_FILES_PER_USER: int = 1000  # Maximum number of files per user
    FILE_ALLOWED_EXTENSIONS: List[str] = [".mmd", ".json", ".md", ".png", ".svg"]
    FILE_AUTO_VERSIONING: bool = True  # Enable automatic versioning
    FILE_BACKUP_ENABLED: bool = True  # Enable automatic backups
    FILE_SHARE_EXPIRE_DAYS: int = 30  # Default expiration for file shares

    # API settings
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_HOSTS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    @property
    def allowed_hosts_list(self) -> List[str]:
        """Get allowed hosts as a list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    # Security headers
    ENABLE_SECURITY_HEADERS: bool = True
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]

    # Logging
    LOG_LEVEL: str = "INFO"
    ENABLE_ACCESS_LOG: bool = True
    ENABLE_AUDIT_LOG: bool = True

    # Session management
    SESSION_TIMEOUT_MINUTES: int = 1440  # 24 hours
    MAX_ACTIVE_SESSIONS: int = 5
    ENABLE_SESSION_MANAGEMENT: bool = True

    # Token validation
    ENABLE_TOKEN_BLACKLIST: bool = True
    TOKEN_CLEANUP_INTERVAL_HOURS: int = 24

    # Development settings
    ENABLE_DOCS: bool = True
    ENABLE_PROFILER: bool = False


settings = Settings()