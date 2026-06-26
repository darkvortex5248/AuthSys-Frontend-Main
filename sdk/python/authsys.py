import requests
import platform
import subprocess

class AuthSys:
    def __init__(self, name, ownerid, secret, version, api_url="https://authsys-main-production.up.railway.app/api/v1"):
        """
        Initialize the AuthSys application credentials.
        :param name: Application Name
        :param ownerid: Your Owner ID
        :param secret: Your Application Secret
        :param version: Application Version
        :param api_url: The Base URL of your AuthSys backend
        """
        self.name = name
        self.ownerid = ownerid
        self.secret = secret
        self.version = version
        self.api_url = api_url.rstrip('/')
        
        self.sessionid = None
        self.initialized = False
        self.app_data = {}
        self.user_data = {}

    def get_hwid(self):
        """Generates a hardware ID (HWID) based on the OS."""
        hwid = "UNKNOWN_HWID"
        try:
            if platform.system() == "Windows":
                cmd = subprocess.Popen("wmic csproduct get uuid", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                hwid = cmd.stdout.read().decode('utf-8').split('\n')[1].strip()
            elif platform.system() == "Linux":
                with open("/etc/machine-id", "r") as f:
                    hwid = f.read().strip()
            elif platform.system() == "Darwin":
                cmd = subprocess.Popen("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID", shell=True, stdout=subprocess.PIPE)
                hwid = cmd.stdout.read().decode('utf-8').split('"')[3]
        except Exception:
            pass
        return hwid

    def _post(self, endpoint, data):
        url = f"{self.api_url}/client/{endpoint}"
        try:
            response = requests.post(url, json=data, timeout=10)
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": "error", "detail": f"Connection error: {str(e)}"}

    def init(self):
        """Initializes the application and checks for updates/variables."""
        data = {
            "app_secret": self.secret,
            "version": self.version,
            "app_name": self.name,
            "hwid": self.get_hwid()
        }
        res = self._post("init", data)
        
        if res.get("status") in ["success", "update_available"]:
            self.initialized = True
            self.app_data['variables'] = res.get('variables', {})
            print(f"[*] Initialized successfully. Message: {res.get('message')}")
        else:
            print(f"[!] Init Failed: {res.get('detail', res.get('message', 'Unknown Error'))}")
        
        return res

    def register(self, username, password, license_key, email=None):
        """Registers a new user."""
        if not self.initialized:
            print("[!] Please run init() first.")
            return False

        data = {
            "app_secret": self.secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "email": email,
            "hwid": self.get_hwid()
        }
        res = self._post("register", data)
        
        if "access_token" in res or res.get("message") == "User registered successfully":
            print("[*] Successfully registered!")
            self.user_data = res.get('user', {})
            return True
        else:
            print(f"[!] Registration failed: {res.get('detail')}")
            return False

    def login(self, username, password):
        """Logs in an existing user."""
        if not self.initialized:
            print("[!] Please run init() first.")
            return False

        data = {
            "app_secret": self.secret,
            "username": username,
            "password": password,
            "hwid": self.get_hwid()
        }
        res = self._post("login", data)
        
        if "access_token" in res:
            print("[*] Successfully logged in!")
            self.sessionid = res.get("access_token")
            self.user_data = res.get('user', {})
            return True
        else:
            print(f"[!] Login failed: {res.get('detail')}")
            return False

    def license(self, license_key):
        """Logs in using only a license key."""
        if not self.initialized:
            print("[!] Please run init() first.")
            return False

        data = {
            "app_secret": self.secret,
            "license_key": license_key,
            "hwid": self.get_hwid()
        }
        res = self._post("license_login", data)
        
        if "access_token" in res:
            print("[*] Successfully authenticated via license!")
            self.sessionid = res.get("access_token")
            self.user_data = res.get('user', {})
            return True
        else:
            print(f"[!] License login failed: {res.get('detail')}")
            return False

    def var(self, var_name):
        """Gets an application variable."""
        if not self.initialized:
            print("[!] Please run init() first.")
            return None
        return self.app_data.get('variables', {}).get(var_name)
