#pragma once
#include <string>
#include <cstdio>
#include <cstring>

#ifdef _WIN32
#include <windows.h>
#include <winhttp.h>
#include <iphlpapi.h>
#include <comdef.h>
#include <Wbemidl.h>
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "wbemuuid.lib")
#else
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <curl/curl.h>
#endif

namespace AuthSysDevice {

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {
    size_t total = size * nmemb;
    output->append((char*)contents, total);
    return total;
}

static std::string GetHWID() {
#ifdef _WIN32
    std::string result;
    HRESULT hres;
    hres = CoInitializeEx(0, COINIT_MULTITHREADED);
    if (FAILED(hres)) return "unknown";
    hres = CoInitializeSecurity(NULL, -1, NULL, NULL, RPC_C_AUTHN_LEVEL_DEFAULT,
        RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE, NULL);
    IWbemLocator* pLoc = NULL;
    hres = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER,
        IID_IWbemLocator, (LPVOID*)&pLoc);
    if (FAILED(hres)) { CoUninitialize(); return "unknown"; }
    IWbemServices* pSvc = NULL;
    hres = pLoc->ConnectServer(_bstr_t(L"ROOT\\CIMV2"), NULL, NULL, 0, NULL, 0, 0, &pSvc);
    if (FAILED(hres)) { pLoc->Release(); CoUninitialize(); return "unknown"; }
    hres = CoSetProxyBlanket(pSvc, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, NULL,
        RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE);
    IEnumWbemClassObject* pEnumerator = NULL;
    hres = pSvc->ExecQuery(bstr_t("WQL"),
        bstr_t("SELECT SerialNumber FROM Win32_BIOS"),
        WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, NULL, &pEnumerator);
    if (SUCCEEDED(hres)) {
        IWbemClassObject* pclsObj = NULL;
        ULONG uReturn = 0;
        if (pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn) == S_OK) {
            VARIANT vtProp;
            VariantInit(&vtProp);
            if (SUCCEEDED(pclsObj->Get(L"SerialNumber", 0, &vtProp, 0, 0))) {
                char buf[256];
                snprintf(buf, sizeof(buf), "%S", vtProp.bstrVal);
                result = buf;
            }
            VariantClear(&vtProp);
            pclsObj->Release();
        }
        pEnumerator->Release();
    }
    pSvc->Release();
    pLoc->Release();
    CoUninitialize();
    return result.empty() ? "unknown" : result;
#else
    std::string result;
    CURL* curl = curl_easy_init();
    if (!curl) return "unknown";
    std::string readBuf;
    FILE* f = fopen("/etc/machine-id", "r");
    if (f) {
        char buf[128];
        if (fgets(buf, sizeof(buf), f)) result = buf;
        fclose(f);
    }
    if (result.empty()) {
        f = fopen("/var/lib/dbus/machine-id", "r");
        if (f) {
            char buf[128];
            if (fgets(buf, sizeof(buf), f)) result = buf;
            fclose(f);
        }
    }
    if (!result.empty()) {
        result.erase(result.find_last_not_of(" \n\r\t") + 1);
    }
    return result.empty() ? "unknown" : result;
#endif
}

static std::string PostRequest(const std::string& endpoint, const std::string& jsonData, const std::string& baseUrl) {
    std::string url = baseUrl + "/" + endpoint;
    std::string response;
#ifdef _WIN32
    HINTERNET hSession = WinHttpOpen(L"AuthSys-Device/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
    if (hSession) {
        std::wstring wurl = std::wstring(url.begin(), url.end());
        URL_COMPONENTS urlComp = { sizeof(URL_COMPONENTS) };
        WCHAR hostName[256] = {0};
        WCHAR urlPath[1024] = {0};
        urlComp.lpszHostName = hostName;
        urlComp.dwHostNameLength = 256;
        urlComp.lpszUrlPath = urlPath;
        urlComp.dwUrlPathLength = 1024;
        if (WinHttpCrackUrl(wurl.c_str(), wurl.length(), 0, &urlComp)) {
            HINTERNET hConnect = WinHttpConnect(hSession, hostName, urlComp.nPort, 0);
            if (hConnect) {
                HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", urlPath, NULL, NULL, NULL, WINHTTP_FLAG_SECURE);
                if (hRequest) {
                    std::string headers = "Content-Type: application/json\r\n";
                    WinHttpAddRequestHeaders(hRequest, std::wstring(headers.begin(), headers.end()).c_str(), -1, WINHTTP_ADDREQ_FLAG_ADD);
                    if (WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                        (LPVOID)jsonData.c_str(), jsonData.length(), jsonData.length(), 0))
                    {
                        if (WinHttpReceiveResponse(hRequest, NULL)) {
                            DWORD dwSize = 0;
                            DWORD dwDownloaded = 0;
                            do {
                                dwSize = 0;
                                if (!WinHttpQueryDataAvailable(hRequest, &dwSize)) break;
                                if (dwSize == 0) break;
                                char* pszOutBuffer = new char[dwSize + 1];
                                ZeroMemory(pszOutBuffer, dwSize + 1);
                                if (WinHttpReadData(hRequest, pszOutBuffer, dwSize, &dwDownloaded))
                                    response.append(pszOutBuffer, dwDownloaded);
                                delete[] pszOutBuffer;
                            } while (dwSize > 0);
                        }
                    }
                    WinHttpCloseHandle(hRequest);
                }
                WinHttpCloseHandle(hConnect);
            }
        }
        WinHttpCloseHandle(hSession);
    }
#else
    CURL* curl = curl_easy_init();
    if (curl) {
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonData.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_perform(curl);
        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);
    }
#endif
    return response;
}

static std::string json_get_string(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) {
        search = "\"" + key + "\":";
        pos = json.find(search);
        if (pos == std::string::npos) return "";
        size_t start = pos + search.length();
        size_t end = json.find_first_of(",}", start);
        if (end == std::string::npos) return "";
        return json.substr(start, end - start);
    }
    size_t start = pos + search.length();
    size_t end = json.find("\"", start);
    if (end == std::string::npos) return "";
    return json.substr(start, end - start);
}

class Device {
public:
    Device(const std::string& appSecret, const std::string& serverUrl = "https://authsys-main-production.up.railway.app/device")
        : secret(appSecret), server(serverUrl) {}

    bool check() {
        lastError = "";
        std::string hwid = GetHWID();
        std::string json = "{\"group_secret\":\"" + secret + "\",\"hwid\":\"" + hwid + "\"}";
        lastResponse = PostRequest("check", json, server);
        std::string active = json_get_string(lastResponse, "active");
        if (active == "true") return true;
        lastError = json_get_string(lastResponse, "message");
        if (lastError.empty()) lastError = "Device deactivated by admin";
        return false;
    }

    bool registerDevice(const std::string& deviceName = "") {
        lastError = "";
        std::string hwid = GetHWID();
        std::string json = "{\"group_secret\":\"" + secret + "\",\"hwid\":\"" + hwid + "\"";
        if (!deviceName.empty()) json += ",\"device_name\":\"" + deviceName + "\"";
        json += "}";
        lastResponse = PostRequest("register", json, server);
        std::string active = json_get_string(lastResponse, "active");
        return active == "true";
    }

    std::string getLastError() const { return lastError; }
    std::string getLastResponse() const { return lastResponse; }

private:
    std::string secret;
    std::string server;
    std::string lastError;
    std::string lastResponse;
};

}
