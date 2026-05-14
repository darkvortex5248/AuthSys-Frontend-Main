#pragma once
#include <string>
#include <vector>
#include <iostream>
#include <sstream>
#include <iomanip>

#ifdef _WIN32
#include <windows.h>
#include <intrin.h>
#else
#include <unistd.h>
#endif

/**
 * 🛡️ AuthSys Native SDK (C++ Header-Only)
 * High Performance Security Orchestration
 */
class AuthSys {
public:
    struct UserData {
        std::string username;
        std::string email;
        std::string hwid;
        std::string expiry;
    };

    AuthSys(std::string app_secret, std::string api_url = "http://localhost:8000/api/v1/client")
        : m_appSecret(app_secret), m_apiUrl(api_url) {}

    /**
     * Generates a stable machine fingerprint.
     * On Windows: Uses CPUID and Volume Serial.
     */
    std::string getHWID() {
        std::stringstream ss;
#ifdef _WIN32
        int cpuInfo[4];
        __cpuid(cpuInfo, 1);
        ss << std::hex << std::setfill('0') << std::setw(8) << cpuInfo[0];
        ss << std::hex << std::setfill('0') << std::setw(8) << cpuInfo[3];
        
        DWORD volSerial;
        if (GetVolumeInformationA("C:\\", NULL, 0, &volSerial, NULL, NULL, NULL, 0)) {
            ss << "-" << std::hex << volSerial;
        }
#else
        ss << "native-unix-" << getuid();
#endif
        return ss.str();
    }

    // Note: Integration with a library like cURL or WinHTTP is required for networking.
    // This is a blueprint for the logic flow.

    bool login(std::string username, std::string password) {
        std::string hwid = getHWID();
        // 1. Prepare JSON payload
        // 2. POST to m_apiUrl + "/login"
        // 3. Parse response, save m_sessionToken and m_userData
        return true; 
    }

    bool loginLicense(std::string key) {
        std::string hwid = getHWID();
        // 1. Prepare JSON payload
        // 2. POST to m_apiUrl + "/login/license"
        return true;
    }

private:
    std::string m_appSecret;
    std::string m_apiUrl;
    std::string m_sessionToken;
    UserData m_userData;
};
