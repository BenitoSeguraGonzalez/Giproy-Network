
import requests

def test_apus():
    url = "http://localhost:3000/api/v1/login/access-token"
    data = {
        "username": "benito.segura@gmail.com",
        "password": "Kathiana96!a!"
    }
    response = requests.post(url, data=data)
    token = response.json().get("access_token")
    
    headers = {"Authorization": f"Bearer {token}"}
    url_apus = "http://localhost:3000/api/v1/apus/"
    response = requests.get(url_apus, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        apus = response.json()
        print(f"Total APUs: {len(apus)}")
        if len(apus) > 0:
            print(f"First APU Subcat ID: {apus[0].get('subcategoria_item_id')}")

if __name__ == "__main__":
    test_apus()
