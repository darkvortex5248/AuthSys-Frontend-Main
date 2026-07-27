# AuthSys Python SDK

Professional authentication SDK for Python applications.

## Installation

```bash
pip install requests
```

Add `authsys.py` and `helpers.py` to your project.

## Quick Start

```python
from authsys import AuthSys, AuthSysOptions

options = AuthSysOptions(
    app_secret="YOUR_APP_SECRET",
    app_name="MyApplication",
    version="1.0.0"
)

auth = AuthSys(options)

# Initialize
auth.init()

# Register
auth.register("username", "password", "LICENSE_KEY")

# Login
auth.login("username", "password")

# Verify session
auth.verify()

# License login
auth.license_login("LICENSE_KEY")

# License check
auth.license_check("LICENSE_KEY")

# Send chat message
auth.send_chat_message(1, "Hello World!")

# Device registration
auth.register_device("HWID123", "My Device")

# Logout
auth.logout()
```

## API Reference

### AuthSysOptions
- `app_secret` - Your application secret
- `app_name` - Application name
- `version` - Application version
- `api_url` - API endpoint (default: `https://api.authsys.dpdns.org/api/v1`)
- `timeout` - Request timeout in seconds
- `max_retries` - Maximum retry attempts
- `skip_certificate_validation` - Skip SSL certificate validation
- `enable_logging` - Enable debug logging

### Methods
- `init()` - Initialize the SDK
- `register(username, password, license_key, email)` - Register a new user
- `login(username, password, session_length)` - Login with credentials
- `license_login(license_key, session_length)` - Login with license key only
- `license_check(license_key)` - Check license validity
- `verify()` - Verify current session
- `send_chat_message(room_id, message)` - Send a chat message
- `register_device(hwid, device_name)` - Register a device
- `check_device(hwid)` - Check device status
- `get_variable(key)` - Get an application variable
- `get_all_variables()` - Get all application variables
- `logout()` - Clear session

### Properties
- `is_authenticated` - Whether a valid session exists
- `is_initialized` - Whether the SDK is initialized
- `username` - Current username

## Examples

- **Console**: `example/main.py`

## License

MIT License
