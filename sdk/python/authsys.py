"""
🛡️ AuthSys Python SDK
Works with Python 3.7+

Website credentials order (Applications → Manage):
    auth = AuthSys(appSecret, ownerId, version, baseUrl)

The SDK auto-detects which value is the 64-char secret vs 12-char owner ID,
so swapped credentials still work.
"""
import requests
import hashlib
import platform
import subprocess
import json
import time
import threading
from typing import Optional, Dict, Any, Tuple, Union
from urllib.parse import urljoin

class AuthSys:
    def __init__(self, credentialA: str, credentialB: Optional[str] = None, 
                 version: str = "1.0.0", api_url: str = "http://localhost:8000/api/v1"):
        """
        Initialize AuthSys SDK.
        
        Args:
            credentialA: Either appSecret or ownerId (auto-detected)
            credentialB: Optional second credential (ownerId or appSecret)
            version: App version string
            api_url: Base API URL
        """
        resolved = self._resolve_credentials(credentialA, credentialB)
        self.app_secret = resolved[0]
        self.owner_id = resolved[1] or ""
        self.version = version or "1.0.0"
        self.api_url = self._normalize_base_url(api_url)
        self.session_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        self.is_running: bool = False
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._last_hwid: Optional[str] = None
        self.timeout = 90  # seconds

    # ── Credential resolution ──────────────────────────────────────────

    def _resolve_credentials(self, a: str, b: Optional[str]) -> Tuple[str, Optional[str]]:
        """Auto-detect which credential is appSecret vs ownerId."""
        a = (a or "").strip()
        b = (b or "").strip() if b else ""

        if not b:
            return (a, None)

        a_is_secret = self._looks_like_app_secret(a)
        b_is_secret = self._looks_like_app_secret(b)

        if a_is_secret and not b_is_secret:
            return (a, b)
        if b_is_secret and not a_is_secret:
            return (b, a)

        # Ambiguous — prefer longer string as secret (64-char hex vs 12-char id)
        if len(a) >= len(b):
            return (a, b)
        return (b, a)

    def _looks_like_app_secret(self, s: str) -> bool:
        """Check if string looks like a 64-char hex appSecret."""
        return len(s) >= 32 and all(c in '0123456789abcdefABCDEF' for c in s)

    def _normalize_base_url(self, url: str) -> str:
        """Normalize base URL to ensure it ends with /api/v1."""
        url = (url or "").strip().rstrip('/')
        if not url.endswith("/api/v1"):
            if "/api/v1" not in url:
                url += "/api/v1"
        return url

    # ── HWID Generation ────────────────────────────────────────────────

    def get_hwid(self) -> str:
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
            elif system == "Darwin":  # macOS
                cmd = "ioreg -rd1 -c IOPlatformExpertDevice | grep -E '(UUID)'"
                combined = subprocess.check_output(cmd, shell=True).decode().split('"')[-2]
            else:
                combined = platform.node()
        except:
            combined = platform.processor() + platform.node()

        self._last_hwid = hashlib.sha256(combined.encode()).hexdigest()
        return self._last_hwid

    # ── API Methods ─────────────────────────────────────────────────────

    def init(self) -> Dict[str, Any]:
        """
        Initialize the app — checks version and fetches global variables.
        Returns dict with "success": true/false.
        """
        payload = {
            "app_secret": self.app_secret,
            "version": self.version,
            "hwid": self.get_hwid(),
            "app_name": self.owner_id or "client"
        }
        return self._send_request("init", payload)

    def register(self, username: str, password: str, license_key: str, 
                 email: Optional[str] = None) -> Dict[str, Any]:
        """Register a new user with a license key."""
        payload = {
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": self.get_hwid()
        }
        if email:
            payload["email"] = email
        return self._send_request("register", payload)

    def login(self, username: str, password: str, 
              session_length: int = 86400) -> Dict[str, Any]:
        """Login with username and password."""
        payload = {
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "hwid": self.get_hwid(),
            "version": self.version,
            "session_length": session_length
        }
        result = self._send_request("login", payload)
        self._capture_token(result)
        return result

    def license_login(self, license_key: str, 
                    session_length: int = 86400) -> Dict[str, Any]:
        """Login with a license key only (no username/password needed)."""
        payload = {
            "app_secret": self.app_secret,
            "license_key": license_key,
            "hwid": self.get_hwid(),
            "session_length": session_length
        }
        result = self._send_request("license-login", payload)
        self._capture_token(result)
        return result

    def check_license(self, license_key: str) -> Dict[str, Any]:
        """Check if a license key is valid without logging in."""
        payload = {
            "app_secret": self.app_secret,
            "license_key": license_key
        }
        return self._send_request("license/check", payload)

    def verify(self) -> Dict[str, Any]:
        """Verify the current session token is still valid."""
        if not self.session_token:
            return {"success": False, "message": "No active session. Login first."}
        return self._send_request_with_auth("verify")

    # ── Helper Methods ─────────────────────────────────────────────────

    def _capture_token(self, result: Dict[str, Any]) -> None:
        """Extract and store session token from response."""
        if result.get("success") and result.get("token"):
            self.session_token = result["token"]
            self.user_data = result.get("user")

    def _send_request(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send POST request to API endpoint."""
        try:
            url = urljoin(self.api_url, f"client/{endpoint}")
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "AuthSys-Python-SDK/2.0"
            }
            response = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
            return self._parse_response(response)
        except requests.Timeout:
            return {
                "success": False,
                "message": "Request timed out. The server may be starting up — try again in a few seconds."
            }
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    def _send_request_with_auth(self, endpoint: str) -> Dict[str, Any]:
        """Send POST request with authentication headers."""
        try:
            url = urljoin(self.api_url, f"client/{endpoint}")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.session_token}",
                "X-HWID": self.get_hwid(),
                "User-Agent": "AuthSys-Python-SDK/2.0"
            }
            response = requests.post(url, headers=headers, timeout=self.timeout)
            return self._parse_response(response)
        except requests.Timeout:
            return {"success": False, "message": "Request timed out."}
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        """Parse API response and handle different formats."""
        try:
            data = response.json()
        except:
            return {"success": False, "message": response.text}

        if "detail" in data:
            detail = data["detail"]
            message = detail if isinstance(detail, str) else json.dumps(detail)
            return {"success": False, "message": message}

        # Handle init endpoint response format
        if response.ok and "success" not in data:
            if "status" in data:
                status = data["status"]
                ok = status in ("success", "update_available")
                message = data.get("message", status)
                return {"success": ok, "message": message, "status": status, "data": data}
            return {"success": True, "message": "OK", "data": data}

        return data

    # ── Session Management ─────────────────────────────────────────────

    def logout(self) -> None:
        """Clear session and stop heartbeat."""
        self.is_running = False
        self.session_token = None
        self.user_data = None
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            self._heartbeat_thread.join(timeout=1)

    def start_heartbeat(self) -> None:
        """Start heartbeat thread to keep session alive."""
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return
        self.is_running = True
        self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self._heartbeat_thread.start()

    def _heartbeat_loop(self) -> None:
        """Heartbeat loop that runs in background thread."""
        while self.is_running and self.session_token:
            try:
                result = self.verify()
                if not result.get("success"):
                    self.session_token = None
                    break
            except:
                pass  # Silent retry on connection blip
            time.sleep(60)  # Sync every 60 seconds

    # ── Properties ─────────────────────────────────────────────────────

    @property
    def AppSecret(self) -> str:
        return self.app_secret

    @property
    def OwnerId(self) -> str:
        return self.owner_id

    @property
    def Version(self) -> str:
        return self.version

    @property
    def ApiUrl(self) -> str:
        return self.api_url

    @property
    def SessionToken(self) -> Optional[str]:
        return self.session_token

    @property
    def Hwid(self) -> str:
        return self.get_hwid()
