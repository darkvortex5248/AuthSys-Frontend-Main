#pragma once
#include <iostream>
#include <string>
#include <vector>

// AuthSys C++ SDK
// Architecture: x86 (32-bit) | x64 (64-bit) | ARM64
// Dependencies: Windows SDK (WinINet)
// No external libraries required.

namespace AuthSys {
    class api {
    public:
        std::string name, ownerid, secret, version, apiUrl;
        std::string sessionid;
        std::string session_token;
        bool initialized = false;

        std::string last_response;
        std::string last_error;

        struct AppData {
            std::string variables;
        } app_data;

        struct UserData {
            std::string username;
            std::string email;
        } user_data;

        api(std::string name, std::string ownerid, std::string secret, std::string version, std::string apiUrl = "https://authsys-main-production.up.railway.app/api/v1");

        void init();
        void register_user(std::string username, std::string password, std::string license_key, std::string email = "");
        void login(std::string username, std::string password, int session_length = 86400);
        void license(std::string key, int session_length = 86400);
        void license_check(std::string key);
        void verify();
        void chat_send(int room_id, std::string message);
        std::string var(std::string varName);
        void logout();

    private:
        std::string GetHWID();
        std::string PostRequest(std::string endpoint, std::string jsonData);
        std::string PostRequestWithAuth(std::string endpoint, std::string jsonData, std::string token);
    };
}
