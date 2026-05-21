import requests

# Try to create a mock resource to trigger the semantic error 
url = "http://localhost:8010/api/v1/recursos/?base_id=16&empresa_id=1"
payload = {
    "descripcion": "[MOCK] Recurso A (Equipos y Herramientas)",
    "precio": 100.5,
    "especificaciones": "Recurso de prueba generado automáticamente.",
    "subcategoria_item_id": 1945,  # Using the ID seen in the log
    "cod_cpc_id": None
}

try:
    # Need auth, so we'll just try to hit it and see if we get a 422 or 500
    # Actually, we might need a token. Let's send a bad request to get the schema error if any.
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
