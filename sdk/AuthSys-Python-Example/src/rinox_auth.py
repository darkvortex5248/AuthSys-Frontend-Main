import requests
import hashlib
import platform
import subprocess

class RinoxAuth:
    def __init__(self, app_secret, version="1.0.0", base_url="https://authsys-main-production.up.railway.app/api/v1"):
        self.app_secret = app_secret
        self.version = version
        self.base_url = base_url.rstrip('/')
        self.session_token = None
        self.last_response = {}
        self.last_error = ""
        self.hwid = self._get_hwid()

    def _get_hwid(self):
        system = platform.system()
        try:
            if system == "Windows":
                cmd = "wmic csproduct get uuid"
                uuid = subprocess.check_output(cmd, shell=True).decode().split('\n')[1].strip()
                return hashlib.sha256(uuid.encode()).hexdigest()
            elif system == "Linux":
                with open("/etc/machine-id") as f:
                    return hashlib.sha256(f.read().strip().encode()).hexdigest()
            elif system == "Darwin":
                cmd = "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID"
                uuid = subprocess.check_output(cmd, shell=True).decode().split('"')[3]
                return hashlib.sha256(uuid.encode()).hexdigest()
        except Exception:
            import uuid
            return hashlib.sha256(str(uuid.getnode()).encode()).hexdigest()

    def _post(self, endpoint, data=None, headers=None):
        url = f"{self.base_url}/client/{endpoint}"
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)
        try:
            response = requests.post(url, json=data, headers=req_headers, timeout=30)
            self.last_response = response.json()
            return self.last_response
        except requests.exceptions.Timeout:
            self.last_response = {"success": False, "detail": "Request timed out"}
            return self.last_response
        except requests.exceptions.RequestException as e:
            self.last_response = {"success": False, "detail": str(e)}
            return self.last_response

    def init(self):
        self.last_error = ""
        self.last_response = {}
        payload = {"app_secret": self.app_secret, "version": self.version, "hwid": self.hwid}
        res = self._post("init", payload)
        if res.get("status") not in ["success", "update_available"]:
            self.last_error = res.get("detail", res.get("message", "Init failed"))
        return res

    def register(self, username, password, license_key, email=None):
        self.last_error = ""
        self.last_response = {}
        payload = {"app_secret": self.app_secret, "username": username, "password": password,
                    "license_key": license_key, "hwid": self.hwid, "email": email}
        res = self._post("register", payload)
        if res.get("detail"):
            self.last_error = res["detail"]
        return res

    def login(self, username, password, session_length=86400):
        self.last_error = ""
        self.last_response = {}
        self.session_token = None
        payload = {"app_secret": self.app_secret, "username": username, "password": password,
                    "hwid": self.hwid, "session_length": session_length}
        res = self._post("login", payload)
        if res.get("detail"):
            self.last_error = res["detail"]
        elif res.get("success") and res.get("token"):
            self.session_token = res["token"]
        return res

    def verify(self):
        self.last_error = ""
        self.last_response = {}
        if not self.session_token:
            self.last_error = "No active session"
            return {"valid": False}
        headers = {"Authorization": f"Bearer {self.session_token}", "X-HWID": self.hwid}
        res = self._post("verify", headers=headers)
        if res.get("detail"):
            self.last_error = res["detail"]
        return res
