import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to Atlantis API"
    assert data["version"] == "0.1.0"
    assert data["status"] == "active"


def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_diagrams_api():
    """Test the diagrams API endpoints"""
    # Test getting empty diagrams list
    response = client.get("/api/diagrams/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == []


def test_create_diagram():
    """Test creating a new diagram"""
    diagram_data = {
        "title": "Test Diagram",
        "description": "A test diagram",
        "mermaid_code": "graph TD\n    A --> B",
        "tags": ["test"]
    }

    response = client.post("/api/diagrams/", json=diagram_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "Test Diagram"
    assert "id" in data["data"]


def test_git_api():
    """Test the Git API endpoints"""
    # Test getting empty repositories list
    response = client.get("/api/git/repositories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_users_api():
    """Test the users API endpoints"""
    # Test getting current user
    response = client.get("/api/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["username"] == "demo_user"