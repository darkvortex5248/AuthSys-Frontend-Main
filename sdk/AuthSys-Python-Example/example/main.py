"""
AuthSys Python SDK - Example

Demonstrates all SDK features: init, register, login, license login, verify, etc.
"""

from src.authsys import AuthSys, AuthSysOptions, AuthSysException


def main():
    options = AuthSysOptions(
        app_secret="YOUR_APP_SECRET",
        app_name="MyApplication",
        version="1.0.0",
        enable_logging=True,
    )

    auth = AuthSys(options)

    try:
        print("=== Initializing ===")
        init_result = auth.init()
        print(f"Status: {init_result.get('status')}")
        print(f"Message: {init_result.get('message')}")
        print(f"Version: {init_result.get('current_version')}")

        if init_result.get("status") == "update_required":
            print("Update required! Please update the application.")
            return

        print("\n=== Registering ===")
        register_result = auth.register("testuser", "Password123!", "AUTHSYS-KEY-123456")
        print(f"Success: {register_result.get('success')}")
        print(f"Message: {register_result.get('message')}")

        print("\n=== Logging in ===")
        login_result = auth.login("testuser", "Password123!")
        print(f"Success: {login_result.get('success')}")
        print(f"Username: {login_result.get('username')}")
        print(f"Token: {login_result.get('token')}")

        print("\n=== Verifying ===")
        verify_result = auth.verify()
        print(f"Valid: {verify_result.get('valid')}")
        print(f"Username: {verify_result.get('username')}")

        print("\n=== License Login ===")
        license_login_result = auth.license_login("AUTHSYS-KEY-123456")
        print(f"Success: {license_login_result.get('success')}")
        print(f"Username: {license_login_result.get('username')}")

        print("\n=== License Check ===")
        license_check_result = auth.license_check("AUTHSYS-KEY-123456")
        print(f"Valid: {license_check_result.get('valid')}")
        print(f"Key Type: {license_check_result.get('key_type')}")

        print("\n=== Variables ===")
        for key, value in auth.get_all_variables().items():
            print(f"  {key}: {value}")

        print("\n=== Sending chat message ===")
        chat_result = auth.send_chat_message(1, "Hello World!")
        print(f"Status: {chat_result.get('status')}")

        print("\n=== Device Registration ===")
        device_result = auth.register_device("HWID123", "My Device")
        print(f"Active: {device_result.get('active')}")
        print(f"Device ID: {device_result.get('device_id')}")

        print("\n=== Logging out ===")
        auth.logout()
        print(f"Is Authenticated: {auth.is_authenticated}")

    except AuthSysException as e:
        print(f"Auth Error [{e.error_code}]: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
