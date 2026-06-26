#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <sstream>
#include <vector>
#include <winhttp.h>
#include <wininet.h>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "wininet.lib")

// ── Online Authentication: HTTPS-based license validation ──

namespace protection::auth {

    // ── Configuration ──
    // In production, these would be encrypted strings
    static const char* DEFAULT_SERVER   = "https://auth.rinoxprime.example.com";
    static const char* DEFAULT_ENDPOINT = "/api/v1/verify";
    static const int   DEFAULT_PORT     = 443;

    // ── Auth result structure ──
    struct AuthResult {
        bool   success;
        int    statusCode;
        std::string message;
        std::string sessionToken;
        uint64_t expiryTimestamp;
        std::string hardwareId;

        AuthResult() : success(false), statusCode(0), expiryTimestamp(0) {}
    };

    // ── Simple HTTP request via WinHTTP ──
    // In production, use WinHttp API directly for HTTPS
    // For now, use URLDownloadToFileA as a basic transport

    inline bool HttpGetString(const std::string& url, std::string& response) {
        HINTERNET hSession = WinHttpOpen(L"RinoxPrime/1.0",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, nullptr, nullptr, 0);
        if (!hSession) return false;

        HINTERNET hConnect = WinHttpConnect(hSession, L"auth.rinoxprime.example.com",
            INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) {
            WinHttpCloseHandle(hSession);
            return false;
        }

        HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET",
            L"/api/v1/verify", nullptr, nullptr, nullptr,
            WINHTTP_FLAG_SECURE);
        if (!hRequest) {
            WinHttpCloseHandle(hConnect);
            WinHttpCloseHandle(hSession);
            return false;
        }

        bool result = false;
        if (WinHttpSendRequest(hRequest, nullptr, 0, nullptr, 0, 0, 0)) {
            if (WinHttpReceiveResponse(hRequest, nullptr)) {
                DWORD size = 0;
                std::vector<char> buffer;

                do {
                    DWORD downloaded = 0;
                    if (!WinHttpQueryDataAvailable(hRequest, &downloaded))
                        break;

                    size_t offset = buffer.size();
                    buffer.resize(offset + downloaded + 1);

                    if (WinHttpReadData(hRequest, buffer.data() + offset, downloaded, &size)) {
                        buffer[offset + size] = '\0';
                    }
                } while (size > 0);

                if (!buffer.empty()) {
                    response = buffer.data();
                    result = true;
                }
            }
        }

        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);

        return result;
    }

    // ── Verify with server ──
    inline AuthResult VerifyLicense(const std::string& licenseKey,
                                     const std::string& hardwareId) {
        AuthResult result;

        // In production, construct a proper HTTPS request with the license key
        // and hardware ID, validate the JWT response
        //
        // For now, simulate a successful auth for demonstration
        // In production, uncomment the HTTP request below

        /*
        std::string url = std::string(DEFAULT_SERVER) + DEFAULT_ENDPOINT
            + "?key=" + licenseKey
            + "&hwid=" + hardwareId;

        std::string response;
        if (HttpGetString(url, response)) {
            // Parse JSON response
            // Check for "status": "ok" or similar
            // Extract session token and expiry
        }
        */

        // Simulated result
        result.success = true;
        result.statusCode = 200;
        result.message = "License verified";
        result.sessionToken = "simulated_token_" + std::to_string(rand());
        result.expiryTimestamp = 0x7FFFFFFFFFFFFFFF; // far future
        result.hardwareId = hardwareId;

        return result;
    }

    // ── Quick online check ──
    // Returns true internet is reachable
    inline bool IsOnline() {
        return InternetCheckConnectionW(L"https://www.google.com",
            FLAG_ICC_FORCE_CONNECTION, 0) != FALSE;
    }

    // ── Generate auth payload ──
    inline std::string CreateAuthPayload(const std::string& licenseKey,
                                          const std::string& hwid,
                                          uint64_t timestamp) {
        std::stringstream ss;
        ss << "{";
        ss << "\"key\":\"" << licenseKey << "\",";
        ss << "\"hwid\":\"" << hwid << "\",";
        ss << "\"timestamp\":" << timestamp;
        ss << "}";
        return ss.str();
    }

    // ── Parse auth response (simplified JSON) ──
    inline AuthResult ParseResponse(const std::string& json) {
        AuthResult result;

        // Simple string-based JSON parsing
        if (json.find("\"success\":true") != std::string::npos ||
            json.find("\"status\":\"ok\"") != std::string::npos) {
            result.success = true;
        }

        // Extract message
        auto msgStart = json.find("\"message\":\"");
        if (msgStart != std::string::npos) {
            msgStart += 11; // length of "message":""
            auto msgEnd = json.find("\"", msgStart);
            if (msgEnd != std::string::npos) {
                result.message = json.substr(msgStart, msgEnd - msgStart);
            }
        }

        // Extract session token
        auto tokenStart = json.find("\"token\":\"");
        if (tokenStart != std::string::npos) {
            tokenStart += 9;
            auto tokenEnd = json.find("\"", tokenStart);
            if (tokenEnd != std::string::npos) {
                result.sessionToken = json.substr(tokenStart, tokenEnd - tokenStart);
            }
        }

        return result;
    }

    // ── Validate session token format (JWT-like) ──
    inline bool ValidateTokenFormat(const std::string& token) {
        // Check that it has 3 parts separated by dots
        int dots = 0;
        for (char c : token) {
            if (c == '.') dots++;
        }
        return dots == 2;
    }

} // namespace protection::auth
