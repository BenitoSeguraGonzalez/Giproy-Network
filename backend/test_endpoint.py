import urllib.request
import urllib.error

def test_edo_endpoint():
    url = "http://localhost:3000/api/v1/edo/project/1"
    print(f"Testing URL: {url}")
    try:
        with urllib.request.urlopen(url) as response:
            print(f"Status: {response.getcode()}")
            print(f"Body: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Content: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Unexpected Error: {e}")

if __name__ == "__main__":
    test_edo_endpoint()
