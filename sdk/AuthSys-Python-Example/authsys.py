"""
AuthSys Python SDK

Professional authentication SDK for Python applications.
"""

import hashlib
import json
import os
import platform
import subprocess
import time
import urllib.parse
from typing import Any, Dict, Optional

import requests


class AuthSysException(Exception):
    """Exception raised for AuthSys API errors."""

    def __init__(self, message: str, status_code: int = 0, error_code: str = ""):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


class AuthSysOptions:
    """Configuration options for AuthSys client."""

    def __init__(
        self,
        app_secret: str,
        app_name: str = "",
        version: str = "",
        api_url: str = "https://api.authsys.dpdns.org/api/v1",
        timeout: int = 30,
        max_retries: int = 3,
        skip_certificate_validation: bool = False,
        enable_logging: bool = False,
    ):
        self.app_secret = app_secret
        self.app_name = app_name
        self.version = version
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.skip_certificate_validation = skip_certificate_validation
        self.enable_logging = enable_logging


class AuthSys:
    """AuthSys authentication client."""

    def __init__(self, options: AuthSysOptions):
        self._options = options
        self._session_token = ""
        self._initialized = False
        self._app_variables: Dict[str, Any] = {}
        self._username = ""
        self._verify = not options.skip_certificate_validation

    def _log(self, message: str) -> None:
        if self._options.enable_logging:
            print(f"[AuthSys] {message}")

    def _send_request(
        self, endpoint: str, data: Optional[Dict] = None, headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        url = f"{self._options.api_url}/client/{endpoint}"
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)

        last_error = None
        for attempt in range(self._options.max_retries + 1):
            try:
                self._log(f"POST {url} (attempt {attempt + 1})")
                response = requests.post(
                    url,
                    json=data,
                    headers=req_headers,
                    timeout=self._options.timeout,
                    verify=self._verify,
                )
                return self._handle_response(response)
            except requests.exceptions.Timeout:
                last_error = "Request timed out"
                self._log(f"Timeout (attempt {attempt + 1}): {last_error}")
            except requests.exceptions.ConnectionError as e:
                last_error = f"Connection error: {str(e)}"
                self._log(f"Connection error (attempt {attempt + 1}): {last_error}")
            except requests.exceptions.RequestException as e:
                last_error = f"Request error: {str(e)}"
                self._log(f"Request error (attempt {attempt + 1}): {last_error}")

            if attempt < self._options.max_retries:
                time.sleep(2 ** attempt)

        raise AuthSysException(last_error or "Request failed after all retries", 0, "network_error")

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        response_body = response.text
        self._log(f"Response: {response.status_code} - {response_body}")

        if not response.ok:
            detail = response_body
            try:
                error_data = response.json()
                if isinstance(error_data, dict) and "detail" in error_data:
                    detail = str(error_data["detail"])
            except (json.JSONDecodeError, ValueError):
                pass

            status_code = response.status_code
            error_map = {
                401: "unauthorized",
                403: "forbidden",
                404: "not_found",
                429: "rate_limited",
                503: "maintenance",
            }
            error_code = error_map.get(status_code, "api_error")
            raise AuthSysException(detail, status_code, error_code)

        try:
            return response.json()
        except (json.JSONDecodeError, ValueError):
            return {}

    def init(self) -> Dict[str, Any]:
        """Initialize the SDK with the backend."""
        self._log("Initializing...")
        data = {
            "app_secret": self._options.app_secret,
            "version": self._options.version,
            "app_name": self._options.app_name,
            "hwid": get_hwid(),
        }

        result = self._send_request("init", data)

        status = result.get("status", "")
        if status == "update_required":
            raise AuthSysException(
                result.get("message", "Update required"), 0, "version_mismatch"
            )

        self._initialized = status in ("success", "update_available")
        self._app_variables = result.get("variables", {})
        return result

    def register(
        self, username: str, password: str, license_key: str, email: str = ""
    ) -> Dict[str, Any]:
        """Register a new user."""
        if not self._initialized:
            raise AuthSysException(
                "Not initialized. Call init() first.", 0, "not_initialized"
            )

        data = {
            "app_secret": self._options.app_secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": get_hwid(),
        }
        if email:
            data["email"] = email

        return self._send_request("register", data)

    def login(self, username: str, password: str, session_length: int = 86400) -> Dict[str, Any]:
        """Login with username and password."""
        if not self._initialized:
            raise AuthSysException(
                "Not initialized. Call init() first.", 0, "not_initialized"
            )

        self._session_token = ""
        data = {
            "app_secret": self._options.app_secret,
            "username": username,
            "password": password,
            "hwid": get_hwid(),
            "session_length": session_length,
        }

        result = self._send_request("login", data)
        if result.get("success") and result.get("token"):
            self._session_token = result["token"]
            self._username = result.get("username", username)
        return result

    def license_login(self, license_key: str, session_length: int = 86400) -> Dict[str, Any]:
        """Login with license key only."""
        if not self._initialized:
            raise AuthSysException(
                "Not initialized. Call init() first.", 0, "not_initialized"
            )

        self._session_token = ""
        data = {
            "app_secret": self._options.app_secret,
            "license_key": license_key,
            "hwid": get_hwid(),
            "session_length": session_length,
        }

        result = self._send_request("license-login", data)
        if result.get("success") and result.get("token"):
            self._session_token = result["token"]
            self._username = result.get("username", "")
        return result

    def license_check(self, license_key: str) -> Dict[str, Any]:
        """Check if a license key is valid."""
        data = {
            "app_secret": self._options.app_secret,
            "license_key": license_key,
        }
        return self._send_request("license/check", data)

    def verify(self) -> Dict[str, Any]:
        """Verify the current session token."""
        if not self._session_token:
            raise AuthSysException(
                "No active session. Login first.", 0, "no_session"
            )

        headers = {
            "Authorization": f"Bearer {self._session_token}",
            "X-HWID": get_hwid(),
        }
        return self._send_request("verify", {}, headers)

    def send_chat_message(self, room_id: int, message: str) -> Dict[str, Any]:
        """Send a message to a chat room."""
        if not self._session_token:
            raise AuthSysException(
                "No active session. Login first.", 0, "no_session"
            )

        headers = {"Authorization": f"Bearer {self._session_token}"}
        endpoint = f"chat/send?room_id={room_id}&message={urllib.parse.quote(message)}"
        return self._send_request(endpoint, {}, headers)

    def register_device(self, hwid: str, device_name: str = "") -> Dict[str, Any]:
        """Register a device."""
        data = {
            "app_secret": self._options.app_secret,
            "hwid": hwid,
        }
        if device_name:
            data["device_name"] = device_name
        return self._send_request("device/register", data)

    def check_device(self, hwid: str) -> Dict[str, Any]:
        """Check device status."""
        data = {
            "app_secret": self._options.app_secret,
            "hwid": hwid,
        }
        return self._send_request("device/check", data)

    def get_variable(self, key: str) -> Any:
        """Get an application variable."""
        return self._app_variables.get(key)

    def get_all_variables(self) -> Dict[str, Any]:
        """Get all application variables."""
        return self._app_variables

    def logout(self) -> None:
        """Clear the current session."""
        self._session_token = ""

    @property
    def is_authenticated(self) -> bool:
        return bool(self._session_token)

    @property
    def is_initialized(self) -> bool:
        return self._initialized

    @property
    def username(self) -> str:
        return self._username


def get_hwid() -> str:
    """Get a unique hardware identifier for the current machine."""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["wmic", "csproduct", "get", "uuid"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            lines = result.stdout.strip().split("\n")
            if len(lines) > 1:
                return lines[1].strip()
        elif platform.system() == "Linux":
            if os.path.exists("/etc/machine-id"):
                with open("/etc/machine-id", "r") as f:
                    return f.read().strip()
        elif platform.system() == "Darwin":
            result = subprocess.run(
                ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            parts = result.stdout.split('"')
            if len(parts) > 3:
                return parts[3]
    except Exception:
        pass
    return "UNKNOWN_HWID"


def hash_string(input_str: str) -> str:
    """Hash a string using SHA-256."""
    return hashlib.sha256(input_str.encode()).hexdigest()


def generate_guid() -> str:
    """Generate a random GUID."""
    import uuid
    return str(uuid.uuid4())
