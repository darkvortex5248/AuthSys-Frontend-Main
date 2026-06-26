#include "AuthSys.hpp"
#include <windows.h>
#include <wininet.h>
#include <sstream>
#pragma comment(lib, "wininet.lib")

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

    static std::string escape_json(const std::string& s) {
        std::string out;
        out.reserve(s.size() + 2);
        for (char c : s) {
            switch (c) {
                case '"': out += "\\\""; break;
                case '\\': out += "\\\\"; break;
                case '\b': out += "\\b"; break;
                case '\f': out += "\\f"; break;
                case '\n': out += "\\n"; break;
                case '\r': out += "\\r"; break;
                case '\t': out += "\\t"; break;
                default: out += c;
            }
        }
        return out;
    }

    std::string api::PostRequest(std::string endpoint, std::string jsonData) {
        std::string fullUrl = apiUrl;
        if (!fullUrl.empty() && fullUrl.back() != '/') fullUrl += "/";
        fullUrl += "client/" + endpoint;

        // Parse URL
        std::string host, path;
        size_t protoEnd = fullUrl.find("://");
        size_t hostStart = (protoEnd == std::string::npos) ? 0 : protoEnd + 3;
        size_t pathStart = fullUrl.find('/', hostStart);
        if (pathStart != std::string::npos) {
            host = fullUrl.substr(hostStart, pathStart - hostStart);
            path = fullUrl.substr(pathStart);
        } else {
            host = fullUrl.substr(hostStart);
            path = "/";
        }

        BOOL useSSL = (fullUrl.find("https://") == 0);

        HINTERNET hSession = InternetOpenA("AuthSys-CPP-SDK/1.0",
            INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        if (!hSession) return "{\"success\":false,\"detail\":\"InternetOpen failed\"}";

        HINTERNET hConnect = InternetConnectA(hSession, host.c_str(),
            useSSL ? INTERNET_DEFAULT_HTTPS_PORT : INTERNET_DEFAULT_HTTP_PORT,
            NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (!hConnect) {
            InternetCloseHandle(hSession);
            return "{\"success\":false,\"detail\":\"InternetConnect failed\"}";
        }

        DWORD flags = INTERNET_FLAG_NO_AUTO_REDIRECT | INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;
        if (useSSL) flags |= INTERNET_FLAG_SECURE;

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", path.c_str(),
            NULL, NULL, NULL, flags, 0);
        if (!hRequest) {
            InternetCloseHandle(hConnect);
            InternetCloseHandle(hSession);
            return "{\"success\":false,\"detail\":\"HttpOpenRequest failed\"}";
        }

        std::string headers = "Content-Type: application/json\r\n";

        BOOL sent = HttpSendRequestA(hRequest, headers.c_str(), -1L,
            (LPVOID)jsonData.c_str(), jsonData.size());
        if (!sent) {
            InternetCloseHandle(hRequest);
            InternetCloseHandle(hConnect);
            InternetCloseHandle(hSession);
            return "{\"success\":false,\"detail\":\"HttpSendRequest failed\"}";
        }

        std::string response;
        char buffer[1024];
        DWORD bytesRead;
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            buffer[bytesRead] = '\0';
            response += buffer;
        }

        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);

        return response;
    }

    static std::string json_get_string(const std::string& json, const std::string& key) {
        std::string search = "\"" + key + "\":";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return "";

        pos = json.find_first_not_of(" \t\r\n", pos + search.size());
        if (pos == std::string::npos || pos >= json.size()) return "";

        if (json[pos] == '"') {
            pos++;
            std::string val;
            while (pos < json.size() && json[pos] != '"') {
                if (json[pos] == '\\' && pos + 1 < json.size()) {
                    val += json[pos + 1];
                    pos += 2;
                } else {
                    val += json[pos];
                    pos++;
                }
            }
            return val;
        }
        // number or boolean
        size_t end = pos;
        while (end < json.size() && json[end] != ',' && json[end] != '}' && json[end] != ']') end++;
        return json.substr(pos, end - pos);
    }

    static bool json_get_bool(const std::string& json, const std::string& key) {
        std::string val = json_get_string(json, key);
        return val == "true";
    }

    static bool json_has_key(const std::string& json, const std::string& key) {
        return json.find("\"" + key + "\":") != std::string::npos;
    }

    void api::init() {
        std::string hwid = GetHWID();
        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"version\":\"" + escape_json(version) +
            "\",\"hwid\":\"" + escape_json(hwid) +
            "\",\"app_name\":\"" + escape_json(name) + "\"}";

        std::string response = PostRequest("init", json);

        std::string status = json_get_string(response, "status");
        if (status == "success" || status == "update_available") {
            initialized = true;
            std::string vars = json_get_string(response, "variables");
            if (!vars.empty()) {
                // Reconstruct variables JSON from the raw response
                size_t varPos = response.find("\"variables\":");
                if (varPos != std::string::npos) {
                    size_t start = response.find('{', varPos);
                    if (start != std::string::npos) {
                        int depth = 0;
                        size_t end = start;
                        for (; end < response.size(); end++) {
                            if (response[end] == '{') depth++;
                            else if (response[end] == '}') { depth--; if (depth == 0) break; }
                        }
                        if (depth == 0) {
                            app_data.variables = response.substr(start, end - start + 1);
                        }
                    }
                }
            }
        } else {
            initialized = false;
        }
    }

    void api::login(std::string username, std::string password) {
        sessionid = "";
        if (!initialized) return;

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"username\":\"" + escape_json(username) +
            "\",\"password\":\"" + escape_json(password) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) +
            "\",\"session_length\":86400}";

        std::string response = PostRequest("login", json);

        if (json_has_key(response, "detail")) return;
        if (json_get_bool(response, "success")) {
            std::string token = json_get_string(response, "token");
            if (!token.empty()) sessionid = token;
            user_data.username = username;
        }
    }

    void api::register_user(std::string username, std::string password, std::string license_key, std::string email) {
        if (!initialized) return;

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"username\":\"" + escape_json(username) +
            "\",\"password\":\"" + escape_json(password) +
            "\",\"license_key\":\"" + escape_json(license_key) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) + "\"";
        if (!email.empty()) {
            json += ",\"email\":\"" + escape_json(email) + "\"";
        }
        json += "}";

        std::string response = PostRequest("register", json);
    }

    void api::license(std::string key) {
        sessionid = "";
        if (!initialized) return;

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"license_key\":\"" + escape_json(key) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) +
            "\",\"session_length\":86400}";

        std::string response = PostRequest("license_login", json);

        if (json_has_key(response, "detail")) return;
        if (json_get_bool(response, "success")) {
            std::string token = json_get_string(response, "token");
            if (!token.empty()) sessionid = token;
            user_data.username = json_get_string(response, "username");
        }
    }

    std::string api::var(std::string varName) {
        if (!initialized || app_data.variables.empty()) return "";
        return json_get_string(app_data.variables, varName);
    }
}
