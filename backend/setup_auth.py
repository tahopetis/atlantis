#!/usr/bin/env python3
"""
Setup script for Atlantis JWT Authentication System
This script initializes the database and creates the authentication system
"""

import os
import sys
import secrets
from pathlib import Path

def generate_secret_key():
    """Generate a secure secret key for JWT"""
    return secrets.token_urlsafe(32)

def setup_environment():
    """Setup environment file with proper configuration"""
    env_path = Path(".env")
    env_example_path = Path(".env.example")

    if env_path.exists():
        print("✅ .env file already exists")
        return

    if not env_example_path.exists():
        print("❌ .env.example file not found")
        return

    # Read example file
    with open(env_example_path, "r") as f:
        env_content = f.read()

    # Generate secure secret key
    secret_key = generate_secret_key()
    env_content = env_content.replace(
        "SECRET_KEY=atlantis-dev-secret-key-change-in-production",
        f"SECRET_KEY={secret_key}"
    )

    # Write to .env file
    with open(env_path, "w") as f:
        f.write(env_content)

    print(f"✅ Created .env file with secure secret key")

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")

    try:
        import subprocess
        result = subprocess.run([
            sys.executable, "-m", "uv", "add", "--dev"
        ], capture_output=True, text=True, cwd=Path.cwd())

        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
        else:
            print(f"❌ Failed to install dependencies: {result.stderr}")
            # Try with pip
            print("Trying with pip...")
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-e", "."
            ])
            print("✅ Dependencies installed with pip")
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")

def init_database():
    """Initialize database tables"""
    print("🗄️ Initializing database...")

    try:
        # Add current directory to Python path
        sys.path.insert(0, str(Path.cwd()))

        from app.core.database import create_tables
        create_tables()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        print("Make sure all dependencies are installed")
        sys.exit(1)

def create_admin_user():
    """Create a default admin user (optional)"""
    print("👤 Creating admin user...")

    try:
        sys.path.insert(0, str(Path.cwd()))

        from app.core.database import SessionLocal
        from app.services.auth_service import AuthService
        from app.schemas.auth import UserCreate

        db = SessionLocal()
        auth_service = AuthService(db)

        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print("ℹ️ Admin user already exists")
            return

        # Create admin user
        admin_data = UserCreate(
            email="admin@atlantis.local",
            username="admin",
            full_name="Atlantis Administrator",
            password="AdminPassword123!"  # Change this in production
        )

        admin = auth_service.create_user(admin_data)
        print(f"✅ Admin user created: {admin.username}")
        print("⚠️  Please change the default admin password in production!")

        db.close()
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")

def print_usage_instructions():
    """Print instructions for using the authentication system"""
    print("\n" + "="*60)
    print("🎉 Atlantis JWT Authentication System Setup Complete!")
    print("="*60)
    print("\n📚 API Endpoints:")
    print("  POST /api/auth/register     - Register new user")
    print("  POST /api/auth/login        - Login user")
    print("  POST /api/auth/refresh      - Refresh access token")
    print("  POST /api/auth/logout       - Logout user")
    print("  GET  /api/auth/me           - Get current user")
    print("  PUT  /api/auth/me           - Update user profile")
    print("  POST /api/auth/change-password - Change password")
    print("\n🔐 Git Token Endpoints:")
    print("  POST /api/git-tokens/       - Create Git token")
    print("  GET  /api/git-tokens/       - List Git tokens")
    print("  PUT  /api/git-tokens/{id}   - Update Git token")
    print("  DELETE /api/git-tokens/{id} - Delete Git token")
    print("  POST /api/git-tokens/validate - Validate token")
    print("\n🚀 To start the server:")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\n📖 API Documentation:")
    print("  http://localhost:8000/docs")
    print("\n⚠️  Important Security Notes:")
    print("  - Change the default admin password")
    print("  - Use HTTPS in production")
    print("  - Set proper CORS origins")
    print("  - Configure rate limiting")
    print("  - Set up proper secret management")
    print("="*60)

def main():
    """Main setup function"""
    print("🔧 Setting up Atlantis JWT Authentication System...")
    print("📍 Working directory:", Path.cwd())

    # Check if we're in the right directory
    if not Path("main.py").exists():
        print("❌ main.py not found. Please run this script from the backend directory.")
        sys.exit(1)

    # Setup environment
    setup_environment()

    # Install dependencies
    install_dependencies()

    # Initialize database
    init_database()

    # Create admin user
    try:
        create_admin_user()
    except ImportError:
        print("⚠️ Could not create admin user (missing dependencies)")

    # Print usage instructions
    print_usage_instructions()

if __name__ == "__main__":
    main()