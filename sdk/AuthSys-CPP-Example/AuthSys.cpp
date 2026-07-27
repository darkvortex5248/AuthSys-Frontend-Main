#include "AuthSys.hpp"
#include <curl/curl.h>
#include <sstream>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <cstdio>
#include <cstring>

#ifdef _WIN32
#include <windows.h>
#include <direct.h>
#else
#include <unistd.h>
#endif

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::string getHwid() {
#ifdef _WIN32
    FILE* pipe = _popen("wmic csproduct get uuid", "r");
    if (pipe) {
        char buffer[256];
        std::string result;
        while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
            std::string line(buffer);
            size_t pos = line.find_first_not_of(" \t\r\n");
            if (pos != std::string::npos && line.substr(pos) != "UUID" && !line.substr(pos).empty()) {
                result = line.substr(pos);
                size_t end = result.find_last_not_of(" \t\r\n");
                if (end != std::string::npos) result = result.substr(0, end + 1);
                _pclose(pipe);
                return result;
            }
        }
        _pclose(pipe);
    }
    return "UNKNOWN_HWID";
#elif __linux__
    FILE* f = fopen("/etc/machine-id", "r");
    if (f) {
        char buf[256];
        if (fgets(buf, sizeof(buf), f)) {
            fclose(f);
            std::string result(buf);
            size_t end = result.find_last_not_of(" \t\r\n");
            if (end != std::string::npos) result = result.substr(0, end + 1);
            return result;
        }
        fclose(f);
    }
    return "UNKNOWN_HWID";
#elif __APPLE__
    FILE* pipe = popen("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID", "r");
    if (pipe) {
        char buffer[512];
        std::string result;
        while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
            std::string line(buffer);
            size_t start = line.find('"');
            if (start != std::string::npos) {
                size_t end = line.find('"', start + 1);
                if (end != std::string::npos) {
                    result = line.substr(start + 1, end - start - 1);
                    pclose(pipe);
                    return result;
                }
            }
        }
        pclose(pipe);
    }
    return "UNKNOWN_HWID";
#else
    return "UNKNOWN_HWID";
#endif
}

void AuthSys::log(const std::string& message) {
    if (_options.enableLogging) {
        std::cout << "[AuthSys] " << message << std::endl;
    }
}

std::string AuthSys::sendRequest(const std::string& endpoint, const std::string& jsonPayload,
                                  const std::map<std::string, std::string>& headers) {
    std::string url = _options.apiUrl + "/client/" + endpoint;
    std::string lastError;

    for (int attempt = 0; attempt <= _options.maxRetries; attempt++) {
        log("POST " + url + " (attempt " + std::to_string(attempt + 1) + ")");

        CURL* curl = curl_easy_init();
        if (!curl) {
            lastError = "Failed to initialize curl";
            continue;
        }

        std::string responseBody;
        struct curl_slist* headerList = nullptr;

        headerList = curl_slist_append(headerList, "Content-Type: application/json");
        headerList = curl_slist_append(headerList, "Accept: application/json");
        for (const auto& h : headers) {
            std::string header = h.first + ": " + h.second;
            headerList = curl_slist_append(headerList, header.c_str());
        }

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headerList);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseBody);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, _options.timeout);
        curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, _options.timeout);

        if (!jsonPayload.empty()) {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonPayload.c_str());
        }

        if (_options.skipCertificateValidation) {
            curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
            curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
        }

        CURLcode res = curl_easy_perform(curl);
        long httpCode = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

        curl_slist_free_all(headerList);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            lastError = curl_easy_strerror(res);
            log("Request error (attempt " + std::to_string(attempt + 1) + "): " + lastError);
            if (attempt < _options.maxRetries) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1 << attempt * 1000));
            }
            continue;
        }

        log("Response: " + std::to_string(httpCode) + " - " + responseBody);

        if (httpCode < 200 || httpCode >= 300) {
            handleHttpError((int)httpCode, responseBody);
        }

        return responseBody;
    }

    throw AuthSysException(lastError.empty() ? "Request failed after all retries" : lastError, 0, "network_error");
}

void AuthSys::handleHttpError(int statusCode, const std::string& responseBody) {
    std::string errorCode = "api_error";
    switch (statusCode) {
        case 401: errorCode = "unauthorized"; break;
        case 403: errorCode = "forbidden"; break;
        case 404: errorCode = "not_found"; break;
        case 429: errorCode = "rate_limited"; break;
        case 503: errorCode = "maintenance"; break;
    }
    throw AuthSysException(responseBody, statusCode, errorCode);
}

AuthSys::AuthSys(const AuthSysOptions& options)
    : _options(options), _sessionToken(""), _initialized(false), _username("") {
    curl_global_init(CURL_GLOBAL_DEFAULT);
}

void AuthSys::init() {
    log("Initializing...");
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"version\":\"" + _options.version +
                       "\",\"app_name\":\"" + _options.appName +
                       "\",\"hwid\":\"" + getHwid() + "\"}";

    std::string res = sendRequest("init", json, {});

    if (res.find("\"update_required\"") != std::string::npos) {
        throw AuthSysException("Update required", 0, "version_mismatch");
    }

    _initialized = res.find("\"success\"") != std::string::npos ||
                   res.find("\"update_available\"") != std::string::npos;
}

std::string AuthSys::registerUser(const std::string& username, const std::string& password,
                                   const std::string& licenseKey, const std::string& email) {
    if (!_initialized) {
        throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
    }

    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"username\":\"" + username +
                       "\",\"password\":\"" + password +
                       "\",\"license_key\":\"" + licenseKey +
                       "\",\"hwid\":\"" + getHwid() + "\"}";

    if (!email.empty()) {
        json = json.substr(0, json.size() - 1) + ",\"email\":\"" + email + "\"}";
    }

    return sendRequest("register", json, {});
}

std::string AuthSys::login(const std::string& username, const std::string& password, int sessionLength) {
    if (!_initialized) {
        throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
    }

    _sessionToken = "";
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"username\":\"" + username +
                       "\",\"password\":\"" + password +
                       "\",\"hwid\":\"" + getHwid() +
                       "\",\"session_length\":" + std::to_string(sessionLength) + "}";

    std::string res = sendRequest("login", json, {});

    size_t tokenPos = res.find("\"token\":\"");
    if (tokenPos != std::string::npos) {
        tokenPos += 9;
        size_t endPos = res.find("\"", tokenPos);
        if (endPos != std::string::npos) {
            _sessionToken = res.substr(tokenPos, endPos - tokenPos);
        }
    }

    return res;
}

std::string AuthSys::licenseLogin(const std::string& licenseKey, int sessionLength) {
    if (!_initialized) {
        throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
    }

    _sessionToken = "";
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"license_key\":\"" + licenseKey +
                       "\",\"hwid\":\"" + getHwid() +
                       "\",\"session_length\":" + std::to_string(sessionLength) + "}";

    std::string res = sendRequest("license-login", json, {});

    size_t tokenPos = res.find("\"token\":\"");
    if (tokenPos != std::string::npos) {
        tokenPos += 9;
        size_t endPos = res.find("\"", tokenPos);
        if (endPos != std::string::npos) {
            _sessionToken = res.substr(tokenPos, endPos - tokenPos);
        }
    }

    return res;
}

std::string AuthSys::licenseCheck(const std::string& licenseKey) {
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"license_key\":\"" + licenseKey + "\"}";
    return sendRequest("license/check", json, {});
}

std::string AuthSys::verify() {
    if (_sessionToken.empty()) {
        throw AuthSysException("No active session. Login first.", 0, "no_session");
    }

    std::map<std::string, std::string> headers;
    headers["Authorization"] = "Bearer " + _sessionToken;
    headers["X-HWID"] = getHwid();

    return sendRequest("verify", "", headers);
}

std::string AuthSys::sendChatMessage(int roomId, const std::string& message) {
    if (_sessionToken.empty()) {
        throw AuthSysException("No active session. Login first.", 0, "no_session");
    }

    std::map<std::string, std::string> headers;
    headers["Authorization"] = "Bearer " + _sessionToken;

    std::string endpoint = "chat/send?room_id=" + std::to_string(roomId) +
                           "&message=" + message;

    return sendRequest(endpoint, "", headers);
}

std::string AuthSys::registerDevice(const std::string& hwid, const std::string& deviceName) {
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"hwid\":\"" + hwid + "\"}";

    if (!deviceName.empty()) {
        json = json.substr(0, json.size() - 1) + ",\"device_name\":\"" + deviceName + "\"}";
    }

    return sendRequest("device/register", json, {});
}

std::string AuthSys::checkDevice(const std::string& hwid) {
    std::string json = "{\"app_secret\":\"" + _options.appSecret +
                       "\",\"hwid\":\"" + hwid + "\"}";
    return sendRequest("device/check", json, {});
}

std::string AuthSys::getVariable(const std::string& key) const {
    auto it = _appVariables.find(key);
    return it != _appVariables.end() ? it->second : "";
}

std::map<std::string, std::string> AuthSys::getAllVariables() const {
    return _appVariables;
}

void AuthSys::logout() {
    _sessionToken = "";
}

bool AuthSys::isAuthenticated() const {
    return !_sessionToken.empty();
}

bool AuthSys::isInitialized() const {
    return _initialized;
}

std::string AuthSys::getUsername() const {
    return _username;
}
