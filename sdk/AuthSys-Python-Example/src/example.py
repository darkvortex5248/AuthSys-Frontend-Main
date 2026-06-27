import time
from authsys import AuthSys

def main():
    print("Welcome to AuthSys Python Example")

    auth = AuthSys(
        name="TestApp",
        ownerid="your_owner_id",
        secret="your_app_secret",
        version="1.0",
        api_url="https://authsys-main-production.up.railway.app/api/v1"
    )

    print("\n--- Initializing ---")
    res = auth.init()
    print(f"Init response: {res}")

    if not auth.initialized:
        print(f"Initialization failed: {auth.last_error}")
        return

    print("\n--- Variable Check ---")
    my_var = auth.var("motd")
    print(f"Message of the day: {my_var}")

    while True:
        print("\nSelect an option:")
        print("1. Login")
        print("2. Register")
        print("3. License Login")
        print("4. Verify Session")
        print("5. License Check")
        print("6. Chat Send")
        print("7. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            username = input("Username: ")
            password = input("Password: ")
            res = auth.login(username, password)
            print(f"Login response: {res}")
            if auth.session_token:
                print(f"Welcome back, {auth.user_data.get('username')}!")
                break
            else:
                print(f"Login failed: {auth.last_error}")

        elif choice == "2":
            username = input("Username: ")
            password = input("Password: ")
            license_key = input("License Key: ")
            email = input("Email (optional): ") or None
            res = auth.register(username, password, license_key, email)
            print(f"Register response: {res}")
            if res.get("success"):
                print("Registration successful! You can now login.")
            else:
                print(f"Registration failed: {auth.last_error}")

        elif choice == "3":
            license_key = input("License Key: ")
            session_length = input("Session length in seconds (default 86400): ") or "86400"
            res = auth.license_login(license_key, int(session_length))
            print(f"License login response: {res}")
            if auth.session_token:
                print("Logged in via License!")
                break
            else:
                print(f"License login failed: {auth.last_error}")

        elif choice == "4":
            res = auth.verify()
            print(f"Verify response: {res}")
            if res.get("valid"):
                print("Session is valid!")
            else:
                print(f"Session invalid: {auth.last_error}")

        elif choice == "5":
            license_key = input("License Key: ")
            res = auth.license_check(license_key)
            print(f"License check: {res}")

        elif choice == "6":
            if not auth.session_token:
                print("Login first!")
                continue
            room_id = input("Room ID: ")
            message = input("Message: ")
            res = auth.chat_send(int(room_id), message)
            print(f"Chat send: {res}")

        elif choice == "7":
            print("Exiting...")
            return
        else:
            print("Invalid choice.")

    if auth.session_token:
        print("\n--- Main Application ---")
        print("Your secure application code runs here.")
        time.sleep(2)
        print("Done.")

if __name__ == "__main__":
    main()
