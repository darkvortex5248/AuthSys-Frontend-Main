import platform
import subprocess
import hashlib
import json
import os
import time
import requests

class AuthException(Exception): pass
class BannedException(Exception): pass
class ExpiredException(Exception): pass
class HWIDException(Exception): pass
class VersionException(Exception): pass

class RinoxAuth:
    def __init__(self, app_name, app_secret, api_url):
        self.app_name = app_name
        self.app_secret = app_secret
        self.api_url = api_url.rstrip("/")
        self.session_token = None
        self.user_data = None
        self.variables = {}
        self.hwid = self._generate_hwid()
        self.offline_grace_period = 24 * 3600
        self.last_verify = 0
    
    def _generate_hwid(self):
        try:
            if platform.system() == "Windows":
                mac = subprocess.check_output("getmac").decode().split("\n")[3].split()[0]
                return hashlib.sha256(mac.encode()).hexdigest()
            else:
                with open("/etc/machine-id", "r") as f:
                    return hashlib.sha256(f.read().strip().encode()).hexdigest()
        except Exception:
            return hashlib.sha256(platform.node().encode()).hexdigest()
            
    def _post(self, endpoint, data=None):
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        try:
            res = requests.post(f"{self.api_url}{endpoint}", json=data, headers=headers, timeout=10)
            if res.status_code == 403 and "HWID mismatch" in res.text:
                raise HWIDException(res.json().get("detail"))
            if res.status_code == 403 and "banned" in res.text.lower():
                raise BannedException(res.json().get("detail"))
            if res.status_code == 403 and "expired" in res.text.lower():
                raise ExpiredException(res.json().get("detail"))
            res.raise_for_status()
            return res.json()
        except requests.exceptions.RequestException as e:
            if self.session_token and time.time() - self.last_verify < self.offline_grace_period:
                return {"offline": True}
            raise AuthException(f"Network error: {e}")

    def init(self, version):
        data = {"app_name": self.app_name, "app_secret": self.app_secret, "version": version, "hwid": self.hwid}
        res = self._post("/client/init", data)
        if res.get("status") == "update_required":
            raise VersionException(res.get("message"))
        self.variables = res.get("variables", {})
        return res

    def register(self, username, password, license_key, email=None):
        data = {"app_secret": self.app_secret, "username": username, "password": password, "license_key": license_key, "email": email, "hwid": self.hwid}
        return self._post("/client/register", data)

    def login(self, username, password):
        data = {"app_secret": self.app_secret, "username": username, "password": password, "hwid": self.hwid}
        res = self._post("/client/login", data)
        self.session_token = res["token"]
        self.user_data = res
        self.last_verify = time.time()
        return res

    def license_check(self, license_key):
        data = {"app_secret": self.app_secret, "license_key": license_key}
        return self._post("/client/license/check", data)

    def verify(self):
        res = self._post("/client/verify")
        if not res.get("offline"):
            self.last_verify = time.time()
        return res

    def get_variables(self):
        return self.variables
