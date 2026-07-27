#include "AuthSys.hpp"
#include <iostream>

int main() {
    AuthSysOptions options("YOUR_APP_SECRET");
    options.appName = "MyApplication";
    options.version = "1.0.0";
    options.enableLogging = true;

    AuthSys auth(options);

    try {
        std::cout << "=== Initializing ===" << std::endl;
        auth.init();
        std::cout << "Is Initialized: " << (auth.isInitialized() ? "true" : "false") << std::endl;

        std::cout << "\n=== Registering ===" << std::endl;
        std::string registerResult = auth.registerUser("testuser", "Password123!", "AUTHSYS-KEY-123456");
        std::cout << "Result: " << registerResult << std::endl;

        std::cout << "\n=== Logging in ===" << std::endl;
        std::string loginResult = auth.login("testuser", "Password123!");
        std::cout << "Result: " << loginResult << std::endl;
        std::cout << "Is Authenticated: " << (auth.isAuthenticated() ? "true" : "false") << std::endl;

        std::cout << "\n=== Verifying ===" << std::endl;
        std::string verifyResult = auth.verify();
        std::cout << "Result: " << verifyResult << std::endl;

        std::cout << "\n=== License Login ===" << std::endl;
        std::string licenseLoginResult = auth.licenseLogin("AUTHSYS-KEY-123456");
        std::cout << "Result: " << licenseLoginResult << std::endl;

        std::cout << "\n=== License Check ===" << std::endl;
        std::string licenseCheckResult = auth.licenseCheck("AUTHSYS-KEY-123456");
        std::cout << "Result: " << licenseCheckResult << std::endl;

        std::cout << "\n=== Sending chat message ===" << std::endl;
        std::string chatResult = auth.sendChatMessage(1, "Hello World!");
        std::cout << "Result: " << chatResult << std::endl;

        std::cout << "\n=== Device Registration ===" << std::endl;
        std::string deviceResult = auth.registerDevice("HWID123", "My Device");
        std::cout << "Result: " << deviceResult << std::endl;

        std::cout << "\n=== Logging out ===" << std::endl;
        auth.logout();
        std::cout << "Is Authenticated: " << (auth.isAuthenticated() ? "true" : "false") << std::endl;

    } catch (const AuthSysException& e) {
        std::cout << "Auth Error [" << e.errorCode << "]: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        std::cout << "Error: " << e.what() << std::endl;
    }

    return 0;
}
