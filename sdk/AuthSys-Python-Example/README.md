# AuthSys Python SDK

## Installation
```bash
pip install requests
```

## Usage
```python
from authsys import AuthSys

auth = AuthSys("AppName", "owner_id", "app_secret", "1.0.0")

# Initialize
auth.init()
if not auth.initialized:
    print(f"Init failed: {auth.last_error}")
    exit()

# Login
auth.login("username", "password")
if auth.session_token:
    print(f"Welcome {auth.user_data['username']}!")
else:
    print(f"Login failed: {auth.last_error}")

# Register
auth.register("username", "password", "license-key", "email@optional.com")

# License Login
auth.license_login("license-key")

# Verify Session
auth.verify()

# License Check
result = auth.license_check("license-key")

# Chat
auth.chat_send(room_id=1, message="Hello")

# Get Variable
motd = auth.var("motd")

# Logout
auth.logout()
```

## Methods
- `init()` — Initialize & fetch variables
- `login(username, password, session_length=86400)`
- `register(username, password, license_key, email=None)`
- `license_login(license_key, session_length=86400)`
- `license_check(license_key)`
- `verify()`
- `chat_send(room_id, message)`
- `var(name)` — Get app variable

## Error Handling
```python
if auth.last_error:
    print(f"Error: {auth.last_error}")
# Or check raw response:
print(auth.last_response)
```

## Properties
- `session_token` — Current session token
- `initialized` — Bool
- `user_data` — Dict with username/email
- `last_error` — Last error message
- `last_response` — Raw server response
