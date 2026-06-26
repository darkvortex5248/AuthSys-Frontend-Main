#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <functional>

struct ThreatInfo {
    std::string path;
    std::string type;
    std::string severity;
    std::string details;
    bool deleted = false;
    bool quarantined = false;
};

class VirusScanner {
public:
    bool ScanAll();
    bool CleanAll();

    std::vector<ThreatInfo> GetResults();

    void SetProgressCallback(std::function<void(const std::string&, int)> callback);

    // Scan phases
    bool ScanTempFolders();
    bool ScanRegistryRunKeys();
    bool ScanSuspiciousProcesses();
    bool ScanScheduledTasks();
    bool ScanStartupFolder();
    bool ScanAutoruns();
    bool ScanBrowserExtensions();
    bool ScanNetworkConnections();
    bool ScanHostsFile();
    bool ScanRecentFiles();
    bool ScanBrowserData();
    bool EntropyScan();
    bool CheckWindowsDefender();

    // Clean/remove operations
    bool QuarantineFile(const std::string& path);
    bool KillProcess(const std::string& processName);
    bool DeleteRegistryEntry(const std::string& hive, const std::string& keyPath, const std::string& valueName);
    bool DeleteScheduledTask(const std::string& taskName);
    bool CleanStartupEntry(const std::string& path);

private:
    std::vector<ThreatInfo> threats;
    std::function<void(const std::string&, int)> progressCb;
    void Notify(const std::string& msg, int pct);
    std::string GetFileHash(const std::string& path);
    bool IsLegitimatePath(const std::string& path);
    double CalculateEntropy(const std::string& path);
    std::string GetQuarantinePath();
    bool CreateQuarantineDir();
};
