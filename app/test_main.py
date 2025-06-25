import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "User Management API is running"}

def test_register_user():
    response = client.post("/register", json={
        "email": "test@example.com",
        "name": "Test User",
        "password": "password123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data

def test_login_user():
    # First register a user
    client.post("/register", json={
        "email": "login@example.com", 
        "name": "Login User",
        "password": "password123"
    })
    
    # Then login
    response = client.post("/login", json={
        "email": "login@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_invalid_login():
    response = client.post("/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

# INTENTIONAL DEVIATION 8: Missing comprehensive test coverage as mentioned in Definition of Done
# The tests above are minimal and don't cover all edge cases or error scenarios 