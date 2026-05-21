import http.client
import json
import urllib.parse

def test_api():
    # 1. Login to get token
    conn = http.client.HTTPConnection("localhost", 8010)
    
    # Use standard test user
    payload = urllib.parse.urlencode({
        'username': 'soporte@redgiproy.com',
        'password': '123'
    })
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    conn.request("POST", "/api/v1/login/access-token", payload, headers)
    res = conn.getresponse()
    data = res.read()
    
    if res.status != 200:
        print(f"Login failed: {res.status} - {data.decode('utf-8')}")
        conn = http.client.HTTPConnection("localhost", 8010)
        payload = urllib.parse.urlencode({
            'username': 'soporte@redgiproy.com',
            'password': '123123'
        })
        conn.request("POST", "/api/v1/login/access-token", payload, headers)
        res = conn.getresponse()
        data = res.read()
        if res.status != 200:
            print(f"Login failed again: {res.status} - {data.decode('utf-8')}")
            return
            
    token_data = json.loads(data.decode('utf-8'))
    token = token_data.get('access_token')
    
    # 2. Trigger the error
    payload = json.dumps({
        "descripcion": "[MOCK] Recurso A (Equipos y Herramientas)",
        "precio": 100.5,
        "especificaciones": "Recurso de prueba generado automáticamente.",
        "subcategoria_item_id": 1945,
        "cod_cpc_id": None
    })

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    print("\nSending request to create mock recurso...")
    conn.request("POST", "/api/v1/recursos/?base_id=16&empresa_id=1", payload, headers)
    res = conn.getresponse()
    data = res.read()
    print(f"Status Code: {res.status}")
    print(data.decode("utf-8"))

if __name__ == "__main__":
    test_api()
