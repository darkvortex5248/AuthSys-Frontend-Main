#pragma once

#include <string>
#include <map>
#include <functional>
#include <memory>

class AuthSysException : public std::exception {
public:
    AuthSysException(const std::string& message, int statusCode = 0, const std::string& errorCode = "")
        : msg(message), code(statusCode), errCode(errorCode) {}

    const char* what() const noexcept override { return msg.c_str(); }
    int statusCode;
    std::string errorCode;

private:
    std::string msg;
};

struct AuthSysOptions {
    std::string appSecret;
    std::string appName;
    std::string version;
    std::string apiUrl;
    int timeout;
    int maxRetries;
    bool skipCertificateValidation;
    bool enableLogging;

    AuthSysOptions(const std::string& secret = "")
        : appSecret(secret), appName(""), version(""),
          apiUrl("https://api.authsys.dpdns.org/api/v1"),
          timeout(30), maxRetries(3),
          skipCertificateValidation(false), enableLogging(false) {}
};

class AuthSys {
public:
    explicit AuthSys(const AuthSysOptions& options);

    void init();
    std::string registerUser(const std::string& username, const std::string& password,
                             const std::string& licenseKey, const std::string& email = "");
    std::string login(const std::string& username, const std::string& password, int sessionLength = 86400);
    std::string licenseLogin(const std::string& licenseKey, int sessionLength = 86400);
    std::string licenseCheck(const std::string& licenseKey);
    std::string verify();
    std::string sendChatMessage(int roomId, const std::string& message);
    std::string registerDevice(const std::string& hwid, const std::string& deviceName = "");
    std::string checkDevice(const std::string& hwid);

    std::string getVariable(const std::string& key) const;
    std::map<std::string, std::string> getAllVariables() const;

    void logout();
    bool isAuthenticated() const;
    bool isInitialized() const;
    std::string getUsername() const;

private:
    AuthSysOptions _options;
    std::string _sessionToken;
    bool _initialized;
    std::map<std::string, std::string> _appVariables;
    std::string _username;

    void log(const std::string& message);
    std::string sendRequest(const std::string& endpoint, const std::string& jsonPayload,
                            const std::map<std::string, std::string>& headers);
    void handleHttpError(int statusCode, const std::string& responseBody);
};
