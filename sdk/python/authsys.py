import requests
import hashlib
import platform
import subprocess
import json
import time
import threading
from typing import Optional, Dict, Any, Tuple

class AuthSys:
    """
    🛡️ AuthSys Enterprise SDK
    Professional Security Orchestration & Licensing
    """
    def __init__(self, app_secret: str, version: str = "1.0.0", api_url: str = "http://localhost:8000/api/v1/client"):
        self.app_secret = app_secret
        self.version = version
        self.api_url = api_url
        self.session_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        self.is_running: bool = False
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._last_hwid: Optional[str] = None

    def _get_hwid(self) -> str:
        """Generates a high-entropy hardware identifier for this machine."""
        if self._last_hwid:
            return self._last_hwid
            
        system = platform.system()
        try:
            if system == "Windows":
                # Get BIOS UUID and Motherboard Serial
                uuid_cmd = "wmic csproduct get uuid"
                mb_cmd = "wmic baseboard get serialnumber"
                
                raw_uuid = subprocess.check_output(uuid_cmd, shell=True).decode().split('\n')[1].strip()
                raw_mb = subprocess.check_output(mb_cmd, shell=True).decode().split('\n')[1].strip()
                combined = f"{raw_uuid}-{raw_mb}"
            elif system == "Linux":
                try:
                    with open("/etc/machine-id", "r") as f:
                        combined = f.read().strip()
                except:
                    combined = platform.node()
            elif system == "Darwin": # macOS
                cmd = "ioreg -rd1 -c IOPlatformExpertDevice | grep -E '(UUID)'"
                combined = subprocess.check_output(cmd, shell=True).decode().split('"')[-2]
            else:
                combined = platform.node()
        except:
            combined = platform.processor() + platform.node()

        self._last_hwid = hashlib.sha256(combined.encode()).hexdigest()
        return self._last_hwid

    def login(self, username, password) -> Tuple[bool, str]:
        """Initializes a secure session using credentials."""
        payload = {
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "hwid": self._get_hwid(),
            "version": self.version
        }
        return self._send_request("login", payload)

    def login_license(self, key) -> Tuple[bool, str]:
        """Authenticates using only a license key (automated user creation)."""
        payload = {
            "app_secret": self.app_secret,
            "key": key,
            "hwid": self._get_hwid()
        }
        return self._send_request("login/license", payload)

    def _send_request(self, endpoint, payload) -> Tuple[bool, str]:
        try:
            response = requests.post(f"{self.api_url}/{endpoint}", json=payload)
            data = response.json()
            if response.status_code == 200:
                self.session_token = data.get("token")
                self.user_data = data.get("user")
                # Start heartbeat if authenticated
                self._start_heartbeat()
                return True, "Success"
            return False, data.get("detail", "Operation failed")
        except Exception as e:
            return False, f"Connection Error: {str(e)}"

    def _start_heartbeat(self):
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return
        self.is_running = True
        self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self._heartbeat_thread.start()

    def _heartbeat_loop(self):
        while self.is_running and self.session_token:
            try:
                headers = {"Authorization": f"Bearer {self.session_token}"}
                resp = requests.post(f"{self.api_url}/session/heartbeat", headers=headers, timeout=5)
                if resp.status_code != 200:
                    self.session_token = None # Session invalidated
                    break
            except:
                pass # Silent retry on connection blip
            time.sleep(60) # Sync every 60 seconds

    def get_var(self, name: str) -> Optional[str]:
        """Retrieves a secure server-side variable."""
        if not self.session_token: return None
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            resp = requests.get(f"{self.api_url}/vars/{name}", headers=headers)
            if resp.status_code == 200:
                return resp.json().get("value")
        except: pass
        return None

    def logout(self):
        self.is_running = False
        self.session_token = None
        self.user_data = None
