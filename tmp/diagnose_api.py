from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

def test_diagnose_api():
    presupuesto_id = 2
    
    # 1. Test SIN_DESGLOSE
    print("\n--- Requesting SIN_DESGLOSE ---")
    response = client.post(f"/api/v1/polinomica/{presupuesto_id}/regenerate?tipo=SIN_DESGLOSE")
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Tipo in response: {data.get('tipo')}")
        monomios = [m['simbolo'] for m in data.get('monomios', [])]
        print(f"Monomios symbols: {monomios}")
    else:
        print(f"Error {response.status_code}: {response.text}")

    # 2. Test CON_DESGLOSE
    print("\n--- Requesting CON_DESGLOSE ---")
    response = client.post(f"/api/v1/polinomica/{presupuesto_id}/regenerate?tipo=CON_DESGLOSE")
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Tipo in response: {data.get('tipo')}")
        monomios = [m['simbolo'] for m in data.get('monomios', [])]
        print(f"Monomios symbols: {monomios}")
    else:
        print(f"Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    test_diagnose_api()
