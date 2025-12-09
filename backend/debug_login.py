
import requests
import sys

BASE_URL = "http://localhost:5000/api"

def test_login():
    # 1. Try to login
    print("Attempting login...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "password123"
        })
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return

    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.text}")

    if response.status_code != 200:
        print("Login failed, cannot proceed.")
        return

    data = response.json()
    token = data.get("access_token")
    if not token:
        print("No access token received.")
        return
    
    print(f"Got token: {token[:20]}...")

    # 2. Try to access protected route
    print("\nAttempting to access protected route...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        # accessing common bases which was one of the failing endpoints
        resp2 = requests.get(f"{BASE_URL}/common/bases", headers=headers)
        print(f"Protected Route Status: {resp2.status_code}")
        print(f"Protected Route Response: {resp2.text[:200]}...")
    except Exception as e:
        print(f"Failed to access protected route: {e}")

if __name__ == "__main__":
    test_login()
