# AuthSys Python SDK

This is the official Python SDK for RinoxAuth (AuthSys). It provides a simple and secure way to integrate authentication, license management, and hardware locking into your Python applications.

## Prerequisites
- Python 3.6+
- `requests` library

## Installation

1. Copy `authsys.py` to your project folder.
2. Install dependencies:
   ```bash
   pip install requests
   ```

## Usage

Check `example.py` for a full working example.

### 1. Initialize the SDK
Initialize the SDK at the very beginning of your script.

```python
from authsys import AuthSys

auth = AuthSys(
    name="YourAppName",
    ownerid="YourOwnerID",
    secret="YourAppSecret",
    version="1.0",
    api_url="https://api.yourdomain.com"
)

auth.init()
```

### 2. Login
```python
if auth.login("username", "password"):
    print("Logged in!")
```

### 3. Register
```python
if auth.register("username", "password", "license_key"):
    print("Registered successfully!")
```

### 4. License Login
If your app only uses license keys without username/password:
```python
if auth.license("XXXX-XXXX-XXXX-XXXX"):
    print("Valid license!")
```

## Security
The SDK automatically generates a hardware ID (HWID) and sends it to the AuthSys backend to ensure licenses and accounts are bound to a specific computer.
