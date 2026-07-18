#include "AuthSys.hpp"
#include <windows.h>
#include <wininet.h>
#include <sstream>
#include <comdef.h>
#include <Wbemidl.h>
#include <iphlpapi.h>
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "wbemuuid.lib")

#if defined(_M_IX86)
#pragma message("AuthSys SDK: Building for x86 (32-bit)")
#elif defined(_M_AMD64)
#pragma message("AuthSys SDK: Building for x64 (64-bit)")
#elif defined(_M_ARM64)
#pragma message("AuthSys SDK: Building for ARM64")
#else
#pragma message("AuthSys SDK: Building for unknown architecture")
#endif

namespace AuthSys {

    api::api(std::string name, std::string ownerid, std::string secret, std::string version, std::string apiUrl) {
        this->name = name;
        this->ownerid = ownerid;
        this->secret = secret;
        this->version = version;
        this->apiUrl = apiUrl;
    }

    std::string api::GetHWID() {
        DWORD serial = 0;
        if (GetVolumeInformationA("C:\\", NULL, 0, &serial, NULL, NULL, NULL, 0)) {
            char buf[64];
            sprintf_s(buf, "%08lX", serial);
            return std::string(buf);
        }

        HKEY hKey;
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
            "SOFTWARE\\Microsoft\\Cryptography", 0, KEY_READ | KEY_WOW64_64KEY, &hKey) == ERROR_SUCCESS) {
            char guid[128] = { 0 };
            DWORD size = sizeof(guid);
            if (RegQueryValueExA(hKey, "MachineGuid", NULL, NULL, (LPBYTE)guid, &size) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return std::string(guid);
            }
            RegCloseKey(hKey);
        }

        IP_ADAPTER_INFO adapterInfo[16];
        DWORD bufSize = sizeof(adapterInfo);
        if (GetAdaptersInfo(adapterInfo, &bufSize) == ERROR_SUCCESS) {
            char mac[32];
            sprintf_s(mac, "%02X%02X%02X%02X%02X%02X",
                adapterInfo[0].Address[0], adapterInfo[0].Address[1],
                adapterInfo[0].Address[2], adapterInfo[0].Address[3],
                adapterInfo[0].Address[4], adapterInfo[0].Address[5]);
            return std::string(mac);
        }

        return "FALLBACK_HWID";
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

        {
            DWORD timeoutMs = 30000;
            InternetSetOptionA(hConnect, INTERNET_OPTION_CONNECT_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
            InternetSetOptionA(hConnect, INTERNET_OPTION_SEND_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
            InternetSetOptionA(hConnect, INTERNET_OPTION_RECEIVE_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
        }

        DWORD flags = INTERNET_FLAG_NO_AUTO_REDIRECT | INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;
        if (useSSL) {
            flags |= INTERNET_FLAG_SECURE;
        }

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

    std::string api::PostRequestWithAuth(std::string endpoint, std::string jsonData, std::string token) {
        std::string fullUrl = apiUrl;
        if (!fullUrl.empty() && fullUrl.back() != '/') fullUrl += "/";
        fullUrl += "client/" + endpoint;

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

        {
            DWORD timeoutMs = 30000;
            InternetSetOptionA(hConnect, INTERNET_OPTION_CONNECT_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
            InternetSetOptionA(hConnect, INTERNET_OPTION_SEND_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
            InternetSetOptionA(hConnect, INTERNET_OPTION_RECEIVE_TIMEOUT, &timeoutMs, sizeof(timeoutMs));
        }

        DWORD flags = INTERNET_FLAG_NO_AUTO_REDIRECT | INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE;
        if (useSSL) {
            flags |= INTERNET_FLAG_SECURE;
        }

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", path.c_str(),
            NULL, NULL, NULL, flags, 0);
        if (!hRequest) {
            InternetCloseHandle(hConnect);
            InternetCloseHandle(hSession);
            return "{\"success\":false,\"detail\":\"HttpOpenRequest failed\"}";
        }

        std::string headers = "Authorization: Bearer " + token + "\r\n"
                              "X-HWID: " + GetHWID() + "\r\n"
                              "Content-Type: application/json\r\n";

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
        initialized = false;
        last_response = "";
        last_error = "";

        std::string hwid = GetHWID();
        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"version\":\"" + escape_json(version) +
            "\",\"hwid\":\"" + escape_json(hwid) +
            "\",\"app_name\":\"" + escape_json(name) + "\"}";

        last_response = PostRequest("init", json);

        std::string status = json_get_string(last_response, "status");
        if (status == "success" || status == "update_available") {
            initialized = true;
            std::string vars = json_get_string(last_response, "variables");
            if (!vars.empty()) {
                size_t varPos = last_response.find("\"variables\":");
                if (varPos != std::string::npos) {
                    size_t start = last_response.find('{', varPos);
                    if (start != std::string::npos) {
                        int depth = 0;
                        size_t end = start;
                        for (; end < last_response.size(); end++) {
                            if (last_response[end] == '{') depth++;
                            else if (last_response[end] == '}') { depth--; if (depth == 0) break; }
                        }
                        if (depth == 0) {
                            app_data.variables = last_response.substr(start, end - start + 1);
                        }
                    }
                }
            }
        } else {
            initialized = false;
            std::string detail = json_get_string(last_response, "detail");
            if (!detail.empty()) last_error = detail;
        }
    }

    void api::login(std::string username, std::string password, int session_length) {
        sessionid = "";
        session_token = "";
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"username\":\"" + escape_json(username) +
            "\",\"password\":\"" + escape_json(password) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) +
            "\",\"session_length\":" + std::to_string(session_length) + "}";

        last_response = PostRequest("login", json);

        if (json_has_key(last_response, "detail")) {
            last_error = json_get_string(last_response, "detail");
            return;
        }
        if (json_get_bool(last_response, "success")) {
            std::string token = json_get_string(last_response, "token");
            if (!token.empty()) {
                sessionid = token;
                session_token = token;
            }
            user_data.username = username;
            user_data.email = json_get_string(last_response, "email");
        } else {
            last_error = "Login failed";
        }
    }

    void api::register_user(std::string username, std::string password, std::string license_key, std::string email) {
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"username\":\"" + escape_json(username) +
            "\",\"password\":\"" + escape_json(password) +
            "\",\"license_key\":\"" + escape_json(license_key) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) + "\"";
        if (!email.empty()) {
            json += ",\"email\":\"" + escape_json(email) + "\"";
        }
        json += "}";

        last_response = PostRequest("register", json);

        if (json_has_key(last_response, "detail")) {
            last_error = json_get_string(last_response, "detail");
            return;
        }
        if (!json_get_bool(last_response, "success")) {
            last_error = "Registration failed";
        }
    }

    void api::license(std::string key, int session_length) {
        sessionid = "";
        session_token = "";
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"license_key\":\"" + escape_json(key) +
            "\",\"hwid\":\"" + escape_json(GetHWID()) +
            "\",\"session_length\":" + std::to_string(session_length) + "}";

        last_response = PostRequest("license-login", json);

        if (json_has_key(last_response, "detail")) {
            last_error = json_get_string(last_response, "detail");
            return;
        }
        if (json_get_bool(last_response, "success")) {
            std::string token = json_get_string(last_response, "token");
            if (!token.empty()) {
                sessionid = token;
                session_token = token;
            }
            user_data.username = json_get_string(last_response, "username");
        } else {
            last_error = "License login failed";
        }
    }

    void api::license_check(std::string key) {
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }

        std::string json = "{\"app_secret\":\"" + escape_json(secret) +
            "\",\"license_key\":\"" + escape_json(key) + "\"}";

        last_response = PostRequest("license/check", json);
    }

    void api::verify() {
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }
        if (session_token.empty()) { last_error = "No active session"; return; }

        std::string json = "{}";
        last_response = PostRequestWithAuth("verify", json, session_token);
    }

    void api::chat_send(int room_id, std::string message) {
        last_response = "";
        last_error = "";
        if (!initialized) { last_error = "init() failed or not called"; return; }

        std::string endpoint = "chat/send?room_id=" + std::to_string(room_id) +
            "&message=" + escape_json(message);
        std::string json = "{}";

        if (!session_token.empty()) {
            last_response = PostRequestWithAuth(endpoint, json, session_token);
        } else {
            last_response = PostRequest(endpoint, json);
        }
    }

    std::string api::var(std::string varName) {
        if (!initialized || app_data.variables.empty()) return "";
        return json_get_string(app_data.variables, varName);
    }

    void api::logout() {
        sessionid = "";
        session_token = "";
        last_response = "";
        last_error = "";
    }
}
