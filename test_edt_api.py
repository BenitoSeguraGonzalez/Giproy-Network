
import urllib.request
import urllib.parse
import json

base_url = "http://127.0.0.1:8010/api/v1"
email = "benito.segura@gmail.com"
password = "Kathiana96!a!"

try:
    # 1. Login
    login_data = urllib.parse.urlencode({"username": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/login/access-token", data=login_data, method="POST")
    
    with urllib.request.urlopen(req) as response:
        r_data = json.loads(response.read().decode())
        token = r_data.get("access_token")

    # 2. Get EDT
    proyecto_id = 5
    headers = {"Authorization": f"Bearer {token}"}
    req2 = urllib.request.Request(f"{base_url}/edt/project/{proyecto_id}", headers=headers, method="GET")
    
    with urllib.request.urlopen(req2) as response2:
        data = json.loads(response2.read().decode())
        print(f"Status EDT project {proyecto_id}: {response2.status}")
        print(f"Found {len(data)} nodes")
        print(json.dumps(data, indent=2))
        
except Exception as e:
    print(f"Error: {e}")
