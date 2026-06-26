import time
from authsys import AuthSys

def main():
    print("Welcome to AuthSys Python Example")
    
    # Initialize the SDK with your App credentials
    # Name, OwnerID, App Secret, Version, API URL
    auth = AuthSys(
        name="TestApp",
        ownerid="your_owner_id",
        secret="your_app_secret",
        version="1.0",
        api_url="https://authsys-main-production.up.railway.app/api/v1"
    )

    print("\n--- Initializing ---")
    auth.init()

    if not auth.initialized:
        print("Initialization failed. Exiting...")
        return

    print("\n--- Variable Check ---")
    my_var = auth.var("motd")
    print(f"Message of the day: {my_var}")

    while True:
        print("\nSelect an option:")
        print("1. Login")
        print("2. Register")
        print("3. License Login")
        print("4. Exit")
        
        choice = input("Enter choice: ")

        if choice == "1":
            username = input("Username: ")
            password = input("Password: ")
            if auth.login(username, password):
                print(f"Welcome back, {auth.user_data.get('username')}!")
                break
                
        elif choice == "2":
            username = input("Username: ")
            password = input("Password: ")
            license_key = input("License Key: ")
            if auth.register(username, password, license_key):
                print("Registration successful! You can now login.")
                
        elif choice == "3":
            license_key = input("License Key: ")
            if auth.license(license_key):
                print("Logged in via License!")
                break
                
        elif choice == "4":
            print("Exiting...")
            return
        else:
            print("Invalid choice.")

    # Main Application Logic Goes Here
    if auth.sessionid:
        print("\n--- Main Application ---")
        print("Your secure application code runs here.")
        time.sleep(2)
        print("Done.")

if __name__ == "__main__":
    main()
