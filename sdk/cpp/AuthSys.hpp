#pragma once
#include <iostream>
#include <string>
#include <vector>

// Note: This SDK requires libcurl and nlohmann/json for HTTP requests and JSON parsing.

namespace AuthSys {
    class api {
    public:
        std::string name, ownerid, secret, version, apiUrl;
        std::string sessionid;
        bool initialized = false;

        struct AppData {
            std::string variables; // Stored as JSON string
        } app_data;

        struct UserData {
            std::string username;
            std::string email;
        } user_data;

        api(std::string name, std::string ownerid, std::string secret, std::string version, std::string apiUrl = "https://authsys-main-production.up.railway.app/api/v1");

        void init();
        void register_user(std::string username, std::string password, std::string license_key, std::string email = "");
        void login(std::string username, std::string password);
        void license(std::string key);
        std::string var(std::string varName);

    private:
        std::string GetHWID();
        std::string PostRequest(std::string endpoint, std::string jsonData);
    };
}
