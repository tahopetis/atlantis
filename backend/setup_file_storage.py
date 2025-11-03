#!/usr/bin/env python3
"""
Setup script for Atlantis file storage system

This script creates the necessary database tables and storage directories
for the file storage system.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import create_tables, engine
from app.core.config import settings
from app.models.file import DiagramFile, FileVersion, FileShare


def setup_storage_directories():
    """Create necessary storage directories"""
    print("🔧 Setting up storage directories...")

    base_storage_path = Path(settings.FILE_STORAGE_PATH)
    directories = [
        base_storage_path,
        base_storage_path / "users",
        base_storage_path / "temp",
        base_storage_path / "versions",
        base_storage_path / "backups",
        base_storage_path / "uploads"
    ]

    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Created directory: {directory}")
        except Exception as e:
            print(f"  ❌ Failed to create directory {directory}: {e}")
            return False

    print("✅ Storage directories created successfully")
    return True


def create_database_tables():
    """Create database tables for file storage"""
    print("🔧 Creating database tables...")

    try:
        # Create all tables
        create_tables()
        print("✅ Database tables created successfully")

        # Test database connection
        with engine.connect() as conn:
            result = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in result]
            print(f"  📊 Found {len(tables)} tables in database")

            file_tables = ['diagram_files', 'file_versions', 'file_shares']
            for table in file_tables:
                if table in tables:
                    print(f"  ✅ Table '{table}' exists")
                else:
                    print(f"  ⚠️  Table '{table}' not found")

        return True

    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        return False


def verify_configuration():
    """Verify configuration settings"""
    print("🔧 Verifying configuration...")

    required_settings = [
        'FILE_STORAGE_PATH',
        'FILE_MAX_SIZE_MB',
        'FILE_MAX_FILES_PER_USER',
        'DATABASE_URL'
    ]

    for setting in required_settings:
        if hasattr(settings, setting):
            value = getattr(settings, setting)
            print(f"  ✅ {setting}: {value}")
        else:
            print(f"  ❌ Missing setting: {setting}")
            return False

    # Check if storage path is writable
    try:
        storage_path = Path(settings.FILE_STORAGE_PATH)
        if storage_path.exists():
            test_file = storage_path / "test_write_permission.tmp"
            test_file.write_text("test")
            test_file.unlink()
            print(f"  ✅ Storage path is writable: {storage_path}")
        else:
            print(f"  ⚠️  Storage path does not exist: {storage_path}")
    except Exception as e:
        print(f"  ❌ Storage path is not writable: {e}")
        return False

    print("✅ Configuration verification completed")
    return True


def create_sample_data():
    """Create sample data for testing"""
    print("🔧 Creating sample data...")

    try:
        from app.core.database import SessionLocal
        from app.models.user import User
        from app.services.file_service import FileStorageService
        from app.schemas.file import FileCreate

        db = SessionLocal()

        # Check if any users exist
        user_count = db.query(User).count()
        if user_count == 0:
            print("  ⚠️  No users found. Creating sample user...")
            from app.services.auth_service import AuthService
            from app.schemas.auth import UserCreate

            auth_service = AuthService(db)
            user_data = UserCreate(
                username="demo",
                email="demo@example.com",
                password="demopassword123",
                full_name="Demo User"
            )
            demo_user = auth_service.create_user(user_data)
            print(f"  ✅ Created sample user: {demo_user.username}")
        else:
            print(f"  ℹ️  Found {user_count} existing users")

        db.close()
        print("✅ Sample data creation completed")
        return True

    except Exception as e:
        print(f"❌ Failed to create sample data: {e}")
        return False


def run_file_storage_diagnostics():
    """Run diagnostics on the file storage system"""
    print("🔧 Running file storage diagnostics...")

    try:
        from app.core.database import SessionLocal
        from app.services.file_service import FileStorageService
        from app.schemas.file import FileCreate

        db = SessionLocal()
        file_service = FileStorageService(db)

        # Test directory creation
        user_path = file_service._get_user_storage_path(999)  # Test user ID
        print(f"  ✅ User directory creation works: {user_path}")

        # Test file validation
        test_content = "graph TD\n    A[Start] --> B[End]"
        is_valid, error = file_service._validate_file_content(test_content, FileType.MERMAID)
        if is_valid:
            print("  ✅ Mermaid content validation works")
        else:
            print(f"  ❌ Mermaid validation failed: {error}")

        # Test filename generation
        test_filename = file_service._generate_unique_filename(999, "test.mmd", FileType.MERMAID)
        if test_filename and test_filename.endswith('.mmd'):
            print(f"  ✅ Filename generation works: {test_filename}")
        else:
            print(f"  ❌ Filename generation failed: {test_filename}")

        db.close()
        print("✅ File storage diagnostics completed")
        return True

    except Exception as e:
        print(f"❌ File storage diagnostics failed: {e}")
        return False


def main():
    """Main setup function"""
    print("🌊 Atlantis File Storage Setup")
    print("=" * 40)

    success = True

    # Verify configuration
    if not verify_configuration():
        success = False

    # Create storage directories
    if not setup_storage_directories():
        success = False

    # Create database tables
    if not create_database_tables():
        success = False

    # Run diagnostics
    if not run_file_storage_diagnostics():
        success = False

    # Create sample data
    if not create_sample_data():
        success = False

    print("\n" + "=" * 40)
    if success:
        print("🎉 File storage setup completed successfully!")
        print("\n📚 Next steps:")
        print("  1. Start the Atlantis API server")
        print("  2. Test file upload/download functionality")
        print("  3. Configure Git integration if needed")
        print("  4. Set up file sharing and collaboration features")
    else:
        print("❌ File storage setup failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()