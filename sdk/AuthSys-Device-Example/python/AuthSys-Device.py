import requests
import subprocess
import platform


class Device:
    def __init__(self, group_secret: str, base_url: str = "https://api.authsys.dpdns.org/api/v1/client"):
        self.group_secret = group_secret
        self.base_url = base_url.rstrip("/")
        self.last_error = ""
        self.last_response = ""

    @staticmethod
    def _get_hwid() -> str:
        try:
            if platform.system() == "Windows":
                output = subprocess.check_output(
                    ["wmic", "bios", "get", "serialnumber"], timeout=5
                ).decode().strip().split("\n")[1].strip()
                return output if output else "unknown"
            else:
                with open("/etc/machine-id") as f:
                    return f.read().strip()
        except Exception:
            return "unknown"

    def check(self) -> bool:
        self.last_error = ""
        try:
            hwid = self._get_hwid()
            payload = {"group_secret": self.group_secret, "hwid": hwid}
            r = requests.post(
                f"{self.base_url}/check",
                json=payload,
                timeout=15,
            )
            self.last_response = r.text
            data = r.json()
            if data.get("active") is True:
                return True
            self.last_error = data.get("message", "Device deactivated by admin")
            return False
        except Exception as e:
            self.last_error = str(e)
            return False

    def register(self, device_name: str = "") -> bool:
        self.last_error = ""
        try:
            hwid = self._get_hwid()
            payload = {"group_secret": self.group_secret, "hwid": hwid}
            if device_name:
                payload["device_name"] = device_name
            r = requests.post(
                f"{self.base_url}/register",
                json=payload,
                timeout=15,
            )
            self.last_response = r.text
            data = r.json()
            return data.get("active") is True
        except Exception as e:
            self.last_error = str(e)
            return False

