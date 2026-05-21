import sys
import os
from fastapi.testclient import TestClient
sys.path.append(os.getcwd())
from app.main import app

client = TestClient(app)

# Dummy check - no real token needed for simple routing test if we skip auth or mock it.
# Actually, I'll just check if the parameters are accepted by the route (no 422).
# I'll mock the dependency get_current_active_user if needed, but TestClient works best with real app.

print("Checking /api/v1/ health...")
resp = client.get("/api/v1/")
print(f"Status: {resp.status_code}, Resp: {resp.json()}")

# Mocking the user for endpoint tests
from app.api.deps import get_current_active_user, get_db
from app.models.usuario import Usuario

class MockUser:
    id = 1
    empresa_id = 1
    rol = "Superadministrador"

def mock_get_current_user():
    return MockUser()

app.dependency_overrides[get_current_active_user] = mock_get_current_user
# Also for read_apus which might use get_current_user
from app.api.deps import get_current_user
app.dependency_overrides[get_current_user] = mock_get_current_user

print("\nChecking /api/v1/recursos/ with base_id=1...")
# Note: it will fail if DB check fails, but we care about 422 vs something else.
resp = client.get("/api/v1/recursos/", params={"base_id": 1})
print(f"Status: {resp.status_code}")
if resp.status_code == 422:
    print(f"Detail: {resp.json()}")

print("\nChecking /api/v1/apus/ with base_id=1...")
resp = client.get("/api/v1/apus/", params={"base_id": 1})
print(f"Status: {resp.status_code}")
if resp.status_code == 422:
    print(f"Detail: {resp.json()}")

print("\nChecking /api/v1/subcategorias-items/ with base_id=1...")
resp = client.get("/api/v1/subcategorias-items/", params={"base_id": 1})
print(f"Status: {resp.status_code}")
if resp.status_code == 422:
    print(f"Detail: {resp.json()}")

print("\nCleanup overrides...")
app.dependency_overrides = {}
