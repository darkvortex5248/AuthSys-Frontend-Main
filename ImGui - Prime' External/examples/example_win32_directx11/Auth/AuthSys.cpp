#include "AuthSys.hpp"
#include "json.hpp"
#include "wnetwrap.h"
#include <windows.h>

using json = nlohmann::json;

namespace AuthSys {

    api::api(std::string name, std::string ownerid, std::string secret, std::string version, std::string apiUrl) {
        this->name = name;
        this->ownerid = ownerid;
        this->secret = secret;
        this->version = version;
        this->apiUrl = apiUrl;
    }

    std::string api::GetHWID() {
        HW_PROFILE_INFO hwProfileInfo;
        if (GetCurrentHwProfile(&hwProfileInfo)) {
            return std::string(hwProfileInfo.szHwProfileGuid);
        }
        return "UNKNOWN_HWID";
    }

    std::string api::PostRequest(std::string endpoint, std::string jsonData) {
        std::string fullUrl = apiUrl;
        if (fullUrl.back() != '/') fullUrl += "/";
        fullUrl += "client/" + endpoint;

        wrap::Response r = wrap::HttpsRequest(
            wrap::Url{ fullUrl }, 
            wrap::Method{ "POST" }, 
            wrap::Body{ jsonData }, 
            wrap::Header{ {"Content-Type", "application/json"} }
        );
        return r.text;
    }

    void api::init() {
        std::string hwid = GetHWID();
        json j;
        j["app_secret"] = secret;
        j["version"] = version;
        j["hwid"] = hwid;
        j["app_name"] = name;

        std::string response = PostRequest("init", j.dump());
        
        try {
            json res = json::parse(response);
            if (res.contains("status") && 
                (res["status"] == "success" || res["status"] == "update_available")) {
                initialized = true;
                if (res.contains("variables") && res["variables"].is_object()) {
                    app_data.variables = res["variables"].dump();
                }
            } else {
                initialized = false;
            }
        } catch (...) {
            initialized = false;
        }
    }

    void api::login(std::string username, std::string password) {
        sessionid = "";
        if (!initialized) return;
        
        json j;
        j["app_secret"] = secret;
        j["username"] = username;
        j["password"] = password;
        j["hwid"] = GetHWID();
        j["session_length"] = 86400;

        std::string response = PostRequest("login", j.dump());
        
        try {
            json res = json::parse(response);
            if (res.contains("detail")) return;
            if (res.contains("success") && res["success"] == true) {
                if (res.contains("token")) {
                    sessionid = res["token"].get<std::string>();
                }
                user_data.username = username;
            }
        } catch (...) {
        }
    }

    void api::register_user(std::string username, std::string password, std::string license_key, std::string email) {
        if (!initialized) return;
        
        json j;
        j["app_secret"] = secret;
        j["username"] = username;
        j["password"] = password;
        j["license_key"] = license_key;
        j["hwid"] = GetHWID();
        if (!email.empty()) {
            j["email"] = email;
        }
        
        std::string response = PostRequest("register", j.dump());
    }

    void api::license(std::string key) {
        sessionid = "";
        if (!initialized) return;
        
        json j;
        j["app_secret"] = secret;
        j["license_key"] = key;
        j["hwid"] = GetHWID();
        j["session_length"] = 86400;

        std::string response = PostRequest("license_login", j.dump());
        
        try {
            json res = json::parse(response);
            if (res.contains("detail")) return;
            if (res.contains("success") && res["success"] == true) {
                if (res.contains("token")) {
                    sessionid = res["token"].get<std::string>();
                }
                if (res.contains("username")) {
                    user_data.username = res["username"].get<std::string>();
                }
            }
        } catch (...) {
        }
    }

    std::string api::var(std::string varName) {
        if (!initialized || app_data.variables.empty()) return "";
        try {
            json vars = json::parse(app_data.variables);
            if (vars.contains(varName)) {
                if (vars[varName].is_string()) {
                    return vars[varName].get<std::string>();
                }
                return vars[varName].dump();
            }
        } catch (...) {
        }
        return "";
    }
}
