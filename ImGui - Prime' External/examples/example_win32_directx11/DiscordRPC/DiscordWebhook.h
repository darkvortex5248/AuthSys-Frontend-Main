#pragma once
#include <windows.h>
#include <iostream>
#include <string>
#include <ctime>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")

// ⚠️ Set your new Webhook URL here
const std::string WEBHOOK_URL = "https://discord.com/api/webhooks/1502329047458254940/XndvFaQXLACRKsa8hqqGgl5tFqnqKG_H2Cc5ElJR_SloABajTdD2_BbO152tOcH_hFQh";

// Current time string
inline std::string GetCurrentTimeString() {
    time_t now = time(0);
    char buf[80];
    struct tm tstruct;
    localtime_s(&tstruct, &now);
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &tstruct);
    return buf;
}

// Get PC Name
inline std::string GetPCName() {
    char computerName[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(computerName);
    GetComputerNameA(computerName, &size);
    return std::string(computerName);
}

// Send to Discord Webhook
inline bool SendDiscordWebhook(const std::string& title, const std::string& description, const std::string& embed_color)
{
    std::string jsonData = R"({
        "embeds": [{
            "title": ")" + title + R"(",
            "description": ")" + description + R"(",
            "color": )" + embed_color + R"(,
            "footer": {
                "text": "Nyzro Cipher | )" + GetCurrentTimeString() + R"("
            },
            "thumbnail": {
                "url": "https://i.ibb.co/qL3XJb2P/Chat-GPT-Image-May-5-2025-11-09-07-PM.png"
            }
        }]
    })";

    HINTERNET hSession = InternetOpenA("DiscordWebhook", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hSession) return false;

    HINTERNET hConnect = InternetOpenUrlA(hSession, WEBHOOK_URL.c_str(), NULL, 0,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);

    if (!hConnect) {
        InternetCloseHandle(hSession);
        return false;
    }

    std::string postData = "payload_json=" + jsonData;
    BOOL result = HttpSendRequestA(hConnect, "Content-Type: application/x-www-form-urlencoded", -1, (LPVOID)postData.c_str(), (DWORD)postData.length());

    InternetCloseHandle(hConnect);
    InternetCloseHandle(hSession);
    return result;
}

// Login notification
inline void SendLoginWebhook(const std::string& username, const std::string& ip, const std::string& expiry) {
    std::string desc =
        "**Username:** " + username + "\n" +
        "**IP:** " + ip + "\n" +
        "**PC Name:** " + GetPCName() + "\n" +
        "**Expiry:** " + expiry + "\n" +
        "**Login Time:** " + GetCurrentTimeString();
    SendDiscordWebhook("User Logged In", desc, "65280"); // Green
}

// Hack Activated notification
inline void SendHackActivatedWebhook(const std::string& username, const std::string& hackName) {
    std::string desc =
        "**User:** " + username + "\n" +
        "**Hack:** " + hackName + "\n" +
        "**Time:** " + GetCurrentTimeString();
    SendDiscordWebhook("Hack Activated", desc, "16776960"); // Yellow
}

// Error notification
inline void SendErrorWebhook(const std::string& username, const std::string& errorMsg) {
    std::string desc =
        "**User:** " + username + "\n" +
        "**Error:** " + errorMsg + "\n" +
        "**Time:** " + GetCurrentTimeString();
    SendDiscordWebhook("Error", desc, "16711680"); // Red
}