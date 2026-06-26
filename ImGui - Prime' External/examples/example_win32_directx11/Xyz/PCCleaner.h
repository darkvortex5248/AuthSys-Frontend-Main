#pragma once
#include <windows.h>
#include <string>
#include <vector>

class PCCleaner {
public:
    bool CleanTempFiles();
    bool CleanPrefetch();
    bool CleanRecycleBin();
    bool CleanDNSCache();
    bool CleanWindowsLogs();
    bool CleanAll();
    std::string GetLastError();

private:
    std::string lastError;
    bool DeleteDirectory(const std::string& path);
    bool CleanDirectory(const std::string& path, const std::vector<std::string>& extensions);
    unsigned long long GetDirectorySize(const std::string& path);
};