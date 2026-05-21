import requests

url = "http://127.0.0.1:8500/api/v1/login/access-token"
data = {
    "username": "benito.segura@gmail.com",
    "password": "Cocoliso.1"
}

try:
    print(f"Probando login en: {url}")
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error en la petición: {e}")
