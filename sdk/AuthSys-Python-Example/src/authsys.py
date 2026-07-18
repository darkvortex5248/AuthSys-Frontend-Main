import requests
import platform
import subprocess
import json
import urllib.parse

class AuthSys:
    def __init__(self, name, ownerid, secret, version, api_url="https://authsys-main-production.up.railway.app/api/v1"):
        self.name = name
        self.ownerid = ownerid
        self.secret = secret
        self.version = version
        self.api_url = api_url.rstrip('/')

        self.session_token = None
        self.initialized = False
        self.app_data = {}
        self.user_data = {}
        self.last_response = {}
        self.last_error = ""

    def get_hwid(self):
        try:
            if platform.system() == "Windows":
                cmd = subprocess.Popen(["wmic", "csproduct", "get", "uuid"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                hwid = cmd.stdout.read().decode('utf-8').split('\n')[1].strip()
                return hwid
            elif platform.system() == "Linux":
                with open("/etc/machine-id", "r") as f:
                    return f.read().strip()
            elif platform.system() == "Darwin":
                cmd = subprocess.Popen(["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"], stdout=subprocess.PIPE)
                return cmd.stdout.read().decode('utf-8').split('"')[3]
        except Exception:
            pass
        return "UNKNOWN_HWID"

    def _post(self, endpoint, data=None, headers=None):
        url = f"{self.api_url}/client/{endpoint}"
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
            self.last_response = {"success": False, "detail": f"Connection error: {str(e)}"}
            return self.last_response

    def init(self):
        self.last_error = ""
        self.last_response = {}
        self.initialized = False

        data = {
            "app_secret": self.secret,
            "version": self.version,
            "app_name": self.name,
            "hwid": self.get_hwid()
        }
        res = self._post("init", data)

        if res.get("status") in ["success", "update_available"]:
            self.initialized = True
            self.app_data["variables"] = res.get("variables", {})
        else:
            self.last_error = res.get("detail", res.get("message", "Init failed"))
        return res

    def register(self, username, password, license_key, email=None):
        self.last_error = ""
        self.last_response = {}
        if not self.initialized:
            self.last_error = "init() failed or not called"
            return {"success": False, "detail": self.last_error}

        data = {
            "app_secret": self.secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": self.get_hwid()
        }
        if email:
            data["email"] = email

        res = self._post("register", data)

        if "detail" in res:
            self.last_error = res["detail"]
        elif not res.get("success"):
            self.last_error = "Registration failed"
        return res

    def login(self, username, password, session_length=86400):
        self.last_error = ""
        self.last_response = {}
        self.session_token = None
        if not self.initialized:
            self.last_error = "init() failed or not called"
            return {"success": False, "detail": self.last_error}

        data = {
            "app_secret": self.secret,
            "username": username,
            "password": password,
            "hwid": self.get_hwid(),
            "session_length": session_length
        }
        res = self._post("login", data)

        if "detail" in res:
            self.last_error = res["detail"]
        elif res.get("success") and res.get("token"):
            self.session_token = res["token"]
            self.user_data = {
                "username": res.get("username", username),
                "email": res.get("email", "")
            }
        elif not res.get("success"):
            self.last_error = "Login failed: server returned success=false"
        return res

    def license_login(self, license_key, session_length=86400):
        self.last_error = ""
        self.last_response = {}
        self.session_token = None
        if not self.initialized:
            self.last_error = "init() failed or not called"
            return {"success": False, "detail": self.last_error}

        data = {
            "app_secret": self.secret,
            "license_key": license_key,
            "hwid": self.get_hwid(),
            "session_length": session_length
        }
        res = self._post("license-login", data)

        if "detail" in res:
            self.last_error = res["detail"]
        elif res.get("success") and res.get("token"):
            self.session_token = res["token"]
            self.user_data = {"username": res.get("username", ""), "email": ""}
        elif not res.get("success"):
            self.last_error = "License login failed: server returned success=false"
        return res

    def license_check(self, license_key):
        self.last_error = ""
        self.last_response = {}
        data = {
            "app_secret": self.secret,
            "license_key": license_key
        }
        res = self._post("license/check", data)
        if "detail" in res:
            self.last_error = res["detail"]
        return res

    def verify(self):
        self.last_error = ""
        self.last_response = {}
        if not self.session_token:
            self.last_error = "No active session. Login first."
            return {"success": False, "detail": self.last_error}

        headers = {
            "Authorization": f"Bearer {self.session_token}",
            "X-HWID": self.get_hwid()
        }
        res = self._post("verify", headers=headers)

        if "detail" in res:
            self.last_error = res["detail"]
        elif res.get("valid"):
            pass
        else:
            self.last_error = "Session verification failed"
        return res

    def chat_send(self, room_id, message):
        self.last_error = ""
        self.last_response = {}
        if not self.session_token:
            self.last_error = "No active session. Login first."
            return {"success": False, "detail": self.last_error}

        headers = {"Authorization": f"Bearer {self.session_token}"}
        res = self._post(f"chat/send?room_id={room_id}&message={urllib.parse.quote(message)}", headers=headers)
        if "detail" in res:
            self.last_error = res["detail"]
        return res

    def var(self, var_name):
        if not self.initialized:
            return None
        return self.app_data.get("variables", {}).get(var_name)

    def logout(self):
        self.session_token = None
        self.user_data = {}
