#include "PCCleaner.h"
#include <shellapi.h>
#include <ShlObj.h>
#include <fstream>
#include <sstream>
#include <iomanip>

std::string PCCleaner::GetLastError() {
    return lastError;
}

bool PCCleaner::DeleteDirectory(const std::string& path) {
    std::string searchPath = path + "\\*.*";

    WIN32_FIND_DATAA fd;
    HANDLE hFind = FindFirstFileA(searchPath.c_str(), &fd);

    if (hFind == INVALID_HANDLE_VALUE) {
        lastError = "Failed to access: " + path;
        return false;
    }

    do {
        if (strcmp(fd.cFileName, ".") == 0 || strcmp(fd.cFileName, "..") == 0)
            continue;

        std::string fullPath = path + "\\" + fd.cFileName;

        if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            DeleteDirectory(fullPath);
        }
        else {
            SetFileAttributesA(fullPath.c_str(), FILE_ATTRIBUTE_NORMAL);
            DeleteFileA(fullPath.c_str());
        }
    } while (FindNextFileA(hFind, &fd));

    FindClose(hFind);
    RemoveDirectoryA(path.c_str());
    return true;
}

unsigned long long PCCleaner::GetDirectorySize(const std::string& path) {
    unsigned long long size = 0;
    std::string searchPath = path + "\\*.*";

    WIN32_FIND_DATAA fd;
    HANDLE hFind = FindFirstFileA(searchPath.c_str(), &fd);

    if (hFind == INVALID_HANDLE_VALUE) return 0;

    do {
        if (strcmp(fd.cFileName, ".") == 0 || strcmp(fd.cFileName, "..") == 0)
            continue;

        std::string fullPath = path + "\\" + fd.cFileName;

        if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            size += GetDirectorySize(fullPath);
        }
        else {
            ULARGE_INTEGER fileSize;
            fileSize.LowPart = fd.nFileSizeLow;
            fileSize.HighPart = fd.nFileSizeHigh;
            size += fileSize.QuadPart;
        }
    } while (FindNextFileA(hFind, &fd));

    FindClose(hFind);
    return size;
}

bool PCCleaner::CleanTempFiles() {
    char tempPath[MAX_PATH];

    // System Temp
    if (GetTempPathA(MAX_PATH, tempPath)) {
        DeleteDirectory(std::string(tempPath));
    }

    // User Temp
    if (SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, tempPath) == S_OK) {
        std::string userTemp = std::string(tempPath) + "\\Temp";
        DeleteDirectory(userTemp);
    }

    // Windows Temp
    char windowsDir[MAX_PATH];
    if (GetWindowsDirectoryA(windowsDir, MAX_PATH)) {
        std::string winTemp = std::string(windowsDir) + "\\Temp";
        DeleteDirectory(winTemp);
    }

    return true;
}

bool PCCleaner::CleanPrefetch() {
    char windowsDir[MAX_PATH];
    if (GetWindowsDirectoryA(windowsDir, MAX_PATH)) {
        std::string prefetchPath = std::string(windowsDir) + "\\Prefetch";
        DeleteDirectory(prefetchPath);
        return true;
    }
    return false;
}

bool PCCleaner::CleanRecycleBin() {
    SHEmptyRecycleBinA(NULL, NULL, SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND);
    return true;
}

bool PCCleaner::CleanDNSCache() {
    system("ipconfig /flushdns > nul");
    return true;
}

bool PCCleaner::CleanWindowsLogs() {
    char systemDir[MAX_PATH];
    if (GetSystemDirectoryA(systemDir, MAX_PATH)) {
        std::string logPath = std::string(systemDir) + "\\..\\Logs";
        DeleteDirectory(logPath);

        // Event Logs
        std::string eventLogPath = std::string(systemDir) + "\\winevt\\Logs";
        // Skip active log files
        // DeleteDirectory(eventLogPath);
    }
    return true;
}

bool PCCleaner::CleanAll() {
    unsigned long long totalFreed = 0;

    // Calculate sizes before cleaning
    char tempPath[MAX_PATH];
    GetTempPathA(MAX_PATH, tempPath);
    totalFreed += GetDirectorySize(std::string(tempPath));

    char windowsDir[MAX_PATH];
    GetWindowsDirectoryA(windowsDir, MAX_PATH);
    std::string winTemp = std::string(windowsDir) + "\\Temp";
    totalFreed += GetDirectorySize(winTemp);

    std::string prefetchPath = std::string(windowsDir) + "\\Prefetch";
    totalFreed += GetDirectorySize(prefetchPath);

    // Clean
    CleanTempFiles();
    CleanPrefetch();
    CleanRecycleBin();
    CleanDNSCache();
    CleanWindowsLogs();

    // Convert to MB
    double freedMB = totalFreed / (1024.0 * 1024.0);
    char buf[128];
    sprintf_s(buf, "Freed: %.2f MB", freedMB);
    lastError = buf;

    return true;
}