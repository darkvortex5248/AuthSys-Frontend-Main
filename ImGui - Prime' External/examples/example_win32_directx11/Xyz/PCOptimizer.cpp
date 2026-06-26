#include "PCOptimizer.h"
#include <shellapi.h>
#include <psapi.h>
#include <ShlObj.h>
#include <sstream>
#include <iomanip>

#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "shell32.lib")

// ═══════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════

void PCOptimizer::SetProgressCallback(std::function<void(const std::string&, int)> callback) {
    progressCallback = callback;  // ✅ Fixed
}

void PCOptimizer::NotifyProgress(const std::string& message, int percent) {
    if (progressCallback) {
        progressCallback(message, percent);  // ✅ 2 parameters
    }
}

std::string PCOptimizer::GetResult() {
    return result;
}

unsigned long long PCOptimizer::GetFreeRAM() {
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    GlobalMemoryStatusEx(&memInfo);
    return memInfo.ullAvailPhys / (1024 * 1024);
}

// ═══════════════════════════════════════
// 1. RAM Clean
// ═══════════════════════════════════════
bool PCOptimizer::CleanRAM() {
    NotifyProgress("Cleaning RAM...", 5);

    // Clear current process working set
    HANDLE hProcess = GetCurrentProcess();
    SetProcessWorkingSetSize(hProcess, (SIZE_T)-1, (SIZE_T)-1);

    // Clear all processes working set
    DWORD processes[1024], needed;
    if (EnumProcesses(processes, sizeof(processes), &needed)) {
        DWORD count = needed / sizeof(DWORD);
        for (DWORD i = 0; i < count; i++) {
            if (processes[i] != 0) {
                HANDLE hProc = OpenProcess(PROCESS_SET_QUOTA | PROCESS_QUERY_INFORMATION,
                    FALSE, processes[i]);
                if (hProc) {
                    SetProcessWorkingSetSize(hProc, (SIZE_T)-1, (SIZE_T)-1);
                    CloseHandle(hProc);
                }
            }
        }
    }

    result += "RAM Cleaned | ";
    NotifyProgress("RAM Cleaned!", 10);
    return true;
}

// ═══════════════════════════════════════
// 2. Disk Clean
// ═══════════════════════════════════════
bool PCOptimizer::CleanDisk() {
    NotifyProgress("Cleaning Disk...", 12);

    // Windows Disk Cleanup
    system("cleanmgr /sagerun:1 > nul 2>&1");

    // System Temp
    char tempPath[MAX_PATH];
    if (GetTempPathA(MAX_PATH, tempPath)) {
        std::string cmd = "del /f /s /q \"" + std::string(tempPath) + "*.*\" > nul 2>&1";
        system(cmd.c_str());
    }

    // Windows Temp
    char winDir[MAX_PATH];
    if (GetWindowsDirectoryA(winDir, MAX_PATH)) {
        std::string winTemp = std::string(winDir) + "\\Temp\\*.*";
        std::string cmd = "del /f /s /q \"" + winTemp + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    // User Temp
    char userTemp[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, userTemp))) {
        std::string userTempPath = std::string(userTemp) + "\\Temp\\*.*";
        std::string cmd = "del /f /s /q \"" + userTempPath + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    result += "Disk Cleaned | ";
    NotifyProgress("Disk Cleaned!", 17);
    return true;
}

// ═══════════════════════════════════════
// 3. DNS Flush
// ═══════════════════════════════════════
bool PCOptimizer::FlushDNS() {
    NotifyProgress("Flushing DNS...", 19);
    system("ipconfig /flushdns > nul 2>&1");
    system("ipconfig /registerdns > nul 2>&1");
    result += "DNS Flushed | ";
    NotifyProgress("DNS Flushed!", 23);
    return true;
}

// ═══════════════════════════════════════
// 4. Performance Mode
// ═══════════════════════════════════════
bool PCOptimizer::SetPerformanceMode() {
    NotifyProgress("Setting Performance Mode...", 25);

    // Ultimate Performance / High Performance
    system("powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c > nul 2>&1");

    // Disable USB selective suspend
    system("powercfg /setacvalueindex scheme_current 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0 > nul 2>&1");

    // Disable hibernation
    system("powercfg -h off > nul 2>&1");

    result += "Performance Mode ON | ";
    NotifyProgress("Performance Mode ON!", 30);
    return true;
}

// ═══════════════════════════════════════
// 5. Game Mode
// ═══════════════════════════════════════
bool PCOptimizer::EnableGameMode() {
    NotifyProgress("Enabling Game Mode...", 32);

    // Game Bar settings
    system("reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 1 /f > nul 2>&1");
    system("reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f > nul 2>&1");

    // Game DVR off
    system("reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f > nul 2>&1");
    system("reg add \"HKLM\\Software\\Policies\\Microsoft\\Windows\\GameDVR\" /v AllowGameDVR /t REG_DWORD /d 0 /f > nul 2>&1");

    // GPU Priority
    system("reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f > nul 2>&1");
    system("reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v GPU Priority /t REG_DWORD /d 8 /f > nul 2>&1");
    system("reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 6 /f > nul 2>&1");
    system("reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"Scheduling Category\" /t REG_SZ /d High /f > nul 2>&1");
    system("reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"SFIO Priority\" /t REG_SZ /d High /f > nul 2>&1");

    result += "Game Mode ON | ";
    NotifyProgress("Game Mode ON!", 37);
    return true;
}

// ═══════════════════════════════════════
// 6. Registry Clean
// ═══════════════════════════════════════
bool PCOptimizer::CleanRegistry() {
    NotifyProgress("Cleaning Registry...", 39);

    // Safe registry cleanup using cleanmgr
    system("cleanmgr /sageset:99 > nul 2>&1");
    system("cleanmgr /sagerun:99 > nul 2>&1");

    // Delete temp registry items
    system("reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU\" /va /f > nul 2>&1");
    system("reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs\" /va /f > nul 2>&1");
    system("reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VolumeCaches\" /f > nul 2>&1");

    result += "Registry Cleaned | ";
    NotifyProgress("Registry Cleaned!", 44);
    return true;
}

// ═══════════════════════════════════════
// 7. Kill Unnecessary Apps
// ═══════════════════════════════════════
bool PCOptimizer::KillUnnecessaryApps() {
    NotifyProgress("Closing background apps...", 46);

    const char* apps[] = {
        "chrome.exe", "msedge.exe", "firefox.exe", "opera.exe",
        "spotify.exe", "discord.exe", "slack.exe", "teams.exe",
        "skype.exe", "OneDrive.exe", "Dropbox.exe", "WinRAR.exe",
        "7zG.exe", "notepad.exe", "mspaint.exe", "calc.exe"
    };

    for (const char* app : apps) {
        std::string cmd = "taskkill /f /im " + std::string(app) + " > nul 2>&1";
        system(cmd.c_str());
    }

    result += "Apps Closed | ";
    NotifyProgress("Background Apps Closed!", 51);
    return true;
}

// ═══════════════════════════════════════
// 8. Disable Visual Effects
// ═══════════════════════════════════════
bool PCOptimizer::DisableVisualEffects() {
    NotifyProgress("Disabling visual effects...", 53);

    // Set for best performance
    system("reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects\" /v VisualFXSetting /t REG_DWORD /d 2 /f > nul 2>&1");

    // Disable animations
    system("reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f > nul 2>&1");
    system("reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 0 /f > nul 2>&1");

    // Disable transparency
    system("reg add \"HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 0 /f > nul 2>&1");

    result += "Visual Effects OFF | ";
    NotifyProgress("Visual Effects Disabled!", 58);
    return true;
}

// ═══════════════════════════════════════
// 9. Clear Browser Cache
// ═══════════════════════════════════════
bool PCOptimizer::ClearBrowserCache() {
    NotifyProgress("Clearing browser cache...", 60);

    char localAppData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData))) {
        // Chrome
        std::string chromeCache = std::string(localAppData) + "\\Google\\Chrome\\User Data\\Default\\Cache\\*.*";
        std::string cmd = "del /f /s /q \"" + chromeCache + "\" > nul 2>&1";
        system(cmd.c_str());

        // Edge
        std::string edgeCache = std::string(localAppData) + "\\Microsoft\\Edge\\User Data\\Default\\Cache\\*.*";
        cmd = "del /f /s /q \"" + edgeCache + "\" > nul 2>&1";
        system(cmd.c_str());

        // Firefox
        std::string mozillaPath = std::string(getenv("APPDATA")) + "\\Mozilla\\Firefox\\Profiles\\*\\cache2\\*.*";
        cmd = "del /f /s /q \"" + mozillaPath + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    result += "Browser Cache Cleaned | ";
    NotifyProgress("Browser Cache Cleaned!", 65);
    return true;
}

// ═══════════════════════════════════════
// 10. Empty Recycle Bin
// ═══════════════════════════════════════
bool PCOptimizer::EmptyRecycleBin() {
    NotifyProgress("Emptying Recycle Bin...", 67);
    SHEmptyRecycleBinA(NULL, NULL, SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND);
    result += "Recycle Bin Emptied | ";
    NotifyProgress("Recycle Bin Emptied!", 71);
    return true;
}

// ═══════════════════════════════════════
// 11. Clear Error Reports
// ═══════════════════════════════════════
bool PCOptimizer::ClearErrorReports() {
    NotifyProgress("Clearing error reports...", 73);

    // Crash dumps
    char localAppData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData))) {
        std::string crashPath = std::string(localAppData) + "\\CrashDumps\\*.*";
        std::string cmd = "del /f /s /q \"" + crashPath + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    // Windows Error Reporting
    char programData[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_COMMON_APPDATA, NULL, 0, programData))) {
        std::string werPath = std::string(programData) + "\\Microsoft\\Windows\\WER\\ReportArchive\\*.*";
        std::string cmd = "del /f /s /q \"" + werPath + "\" > nul 2>&1";
        system(cmd.c_str());

        std::string werQueue = std::string(programData) + "\\Microsoft\\Windows\\WER\\ReportQueue\\*.*";
        cmd = "del /f /s /q \"" + werQueue + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    result += "Error Reports Cleaned | ";
    NotifyProgress("Error Reports Cleaned!", 78);
    return true;
}

// ═══════════════════════════════════════
// 12. Clean Windows Update Cache
// ═══════════════════════════════════════
bool PCOptimizer::CleanUpdateCache() {
    NotifyProgress("Cleaning update cache...", 80);

    // Stop update service
    system("net stop wuauserv > nul 2>&1");
    system("net stop bits > nul 2>&1");

    char winDir[MAX_PATH];
    if (GetWindowsDirectoryA(winDir, MAX_PATH)) {
        // SoftwareDistribution
        std::string updatePath = std::string(winDir) + "\\SoftwareDistribution\\Download\\*.*";
        std::string cmd = "del /f /s /q \"" + updatePath + "\" > nul 2>&1";
        system(cmd.c_str());

        // Delivery Optimization
        std::string deliveryPath = std::string(winDir) + "\\SoftwareDistribution\\DeliveryOptimization\\*.*";
        cmd = "del /f /s /q \"" + deliveryPath + "\" > nul 2>&1";
        system(cmd.c_str());
    }

    // Restart services
    system("net start wuauserv > nul 2>&1");
    system("net start bits > nul 2>&1");

    result += "Update Cache Cleaned | ";
    NotifyProgress("Update Cache Cleaned!", 85);
    return true;
}

// ═══════════════════════════════════════
// 13. Clear Event Logs
// ═══════════════════════════════════════
bool PCOptimizer::ClearEventLogs() {
    NotifyProgress("Clearing event logs...", 87);
    system("for /f \"tokens=*\" %a in ('wevtutil el') do wevtutil cl \"%a\" > nul 2>&1");
    result += "Event Logs Cleared | ";
    NotifyProgress("Event Logs Cleared!", 90);
    return true;
}

// ═══════════════════════════════════════
// 14. Memory Defrag
// ═══════════════════════════════════════
bool PCOptimizer::MemoryDefrag() {
    NotifyProgress("Optimizing memory...", 92);

    // Boost current process priority
    HANDLE hProcess = GetCurrentProcess();
    SetPriorityClass(hProcess, HIGH_PRIORITY_CLASS);
    SetProcessWorkingSetSize(hProcess, (SIZE_T)-1, (SIZE_T)-1);

    // Clear standby list (Windows 10+)
    system("EmptyStandbyList.exe workingsets > nul 2>&1");

    Sleep(500);
    SetPriorityClass(hProcess, NORMAL_PRIORITY_CLASS);

    result += "Memory Optimized | ";
    NotifyProgress("Memory Optimized!", 95);
    return true;
}

// ═══════════════════════════════════════
// 15. Superfetch Optimize
// ═══════════════════════════════════════
bool PCOptimizer::OptimizeSuperfetch() {
    NotifyProgress("Optimizing Superfetch...", 96);
    system("net stop SysMain > nul 2>&1");
    Sleep(500);
    system("net start SysMain > nul 2>&1");
    result += "Superfetch Optimized | ";
    NotifyProgress("Superfetch Optimized!", 97);
    return true;
}

// ═══════════════════════════════════════
// 16. Disable Startup Delay
// ═══════════════════════════════════════
bool PCOptimizer::DisableStartupDelay() {
    NotifyProgress("Disabling startup delay...", 98);
    system("reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize\" /v StartupDelayInMSec /t REG_DWORD /d 0 /f > nul 2>&1");
    result += "Startup Delay OFF | ";
    NotifyProgress("Startup Delay Disabled!", 99);
    return true;
}

// ═══════════════════════════════════════
// 17. Speed Up Menu
// ═══════════════════════════════════════
bool PCOptimizer::SpeedUpMenu() {
    NotifyProgress("Speeding up menus...", 100);
    system("reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d 0 /f > nul 2>&1");
    result += "Menu Speed UP | ";
    NotifyProgress("Menu Speed UP!", 100);
    return true;
}

// ═══════════════════════════════════════
// MAIN: Optimize All
// ═══════════════════════════════════════
bool PCOptimizer::OptimizeAll() {
    result = "";
    unsigned long long ramBefore = GetFreeRAM();

    NotifyProgress("Starting PC Optimization...", 0);
    Sleep(200);

    // Run all optimizations
    CleanRAM();                  Sleep(150);
    CleanDisk();                 Sleep(150);
    FlushDNS();                  Sleep(100);
    SetPerformanceMode();        Sleep(150);
    EnableGameMode();            Sleep(150);
    CleanRegistry();             Sleep(200);
    KillUnnecessaryApps();       Sleep(200);
    DisableVisualEffects();      Sleep(100);
    ClearBrowserCache();         Sleep(150);
    EmptyRecycleBin();           Sleep(150);
    ClearErrorReports();         Sleep(150);
    CleanUpdateCache();          Sleep(200);
    ClearEventLogs();            Sleep(100);
    MemoryDefrag();              Sleep(200);
    OptimizeSuperfetch();        Sleep(200);
    DisableStartupDelay();       Sleep(100);
    SpeedUpMenu();               Sleep(100);

    unsigned long long ramAfter = GetFreeRAM();
    int ramFreed = (int)(ramAfter - ramBefore);

    std::ostringstream finalResult;
    finalResult << "Optimization Complete! | RAM Freed: " << ramFreed << " MB";
    result = finalResult.str();

    NotifyProgress(finalResult.str(), 100);

    return true;
}