import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_routes():
    print("Listing all registered routes:")
    for path, operations in app.openapi()["paths"].items():
        print(f"Path: {path}, Methods: {', '.join(method.upper() for method in operations)}")

    # Test the specific EDO route
    # Note: This doesn't need the server running, it tests the app object directly
    response = client.get("/api/v1/edo/project/1")
    print(f"\nTest GET /api/v1/edo/project/1")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")

if __name__ == "__main__":
    test_routes()
