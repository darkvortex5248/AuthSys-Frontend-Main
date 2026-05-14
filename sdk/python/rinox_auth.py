import requests
import json
import hashlib
import platform
import subprocess

class RinoxAuth:
    def __init__(self, app_secret, version="1.0.0", base_url="http://127.0.0.1:8000/api/v1"):
        self.app_secret = app_secret
        self.version = version
        self.base_url = base_url
        self.session_token = None
        self.hwid = self._get_hwid()

    def _get_hwid(self):
        """Generates a unique hardware ID for the current machine."""
        system = platform.system()
        if system == "Windows":
            cmd = "wmic csproduct get uuid"
            uuid = subprocess.check_output(cmd, shell=True).decode().split('\n')[1].strip()
            return hashlib.sha256(uuid.encode()).hexdigest()
        else:
            # Fallback for non-windows
            import uuid
            return hashlib.sha256(str(uuid.getnode()).encode()).hexdigest()

    def init(self):
        url = f"{self.base_url}/client/init"
        payload = {
            "app_secret": self.app_secret,
            "version": self.version
        }
        try:
            response = requests.post(url, json=payload)
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def register(self, username, password, license_key, email=None):
        url = f"{self.base_url}/client/register"
        payload = {
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": self.hwid,
            "email": email
        }
        response = requests.post(url, json=payload)
        return response.json()

    def login(self, username, password, session_length=3600):
        url = f"{self.base_url}/client/login"
        payload = {
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "hwid": self.hwid,
            "session_length": session_length
        }
        response = requests.post(url, json=payload)
        data = response.json()
        if data.get("success"):
            self.session_token = data.get("token")
        return data

    def verify(self):
        if not self.session_token:
            return {"valid": False, "message": "No active session"}
            
        url = f"{self.base_url}/client/verify"
        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "X-HWID": self.hwid
        }
        response = requests.post(url, headers=headers)
        return response.json()

# Example Usage:
# auth = RinoxAuth("YOUR_APP_SECRET")
# print(auth.init())
# print(auth.login("user", "pass"))
# print(auth.verify())
