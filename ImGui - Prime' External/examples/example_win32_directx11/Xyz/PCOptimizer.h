#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <functional>

class PCOptimizer {
public:
    // Main optimize function
    bool OptimizeAll();

    // Result getter
    std::string GetResult();

    // Individual optimize functions
    bool CleanRAM();
    bool CleanDisk();
    bool FlushDNS();
    bool SetPerformanceMode();
    bool EnableGameMode();
    bool CleanRegistry();
    bool KillUnnecessaryApps();
    bool DisableVisualEffects();
    bool ClearBrowserCache();
    bool EmptyRecycleBin();
    bool ClearErrorReports();
    bool CleanUpdateCache();
    bool ClearEventLogs();
    bool MemoryDefrag();
    bool OptimizeSuperfetch();
    bool DisableStartupDelay();
    bool SpeedUpMenu();

    // Callback for progress notification
    void SetProgressCallback(std::function<void(const std::string&, int)> callback);

private:
    std::string result;
    std::function<void(const std::string&, int)> progressCallback;  // ✅ int added
    unsigned long long GetFreeRAM();
    void NotifyProgress(const std::string& message, int percent);    // ✅ int percent added
};