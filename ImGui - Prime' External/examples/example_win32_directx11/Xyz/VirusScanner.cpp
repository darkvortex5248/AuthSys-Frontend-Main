#define IMGUI_DEFINE_MATH_OPERATORS
#include "VirusScanner.h"
#include <shlobj.h>
#include <comdef.h>
#include <taskschd.h>
#include <wincrypt.h>
#include <tlhelp32.h>
#include <iphlpapi.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <set>
#include <fstream>

#pragma comment(lib, "taskschd.lib")
#pragma comment(lib, "Crypt32.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ws2_32.lib")

static char tolower_char(char c) {
    if (c >= 'A' && c <= 'Z') return c + 32;
    return c;
}

static void strlower(std::string& s) {
    for (size_t i = 0; i < s.size(); i++) s[i] = tolower_char(s[i]);
}

static bool endsWith(const std::string& str, const std::string& suffix) {
    if (str.size() < suffix.size()) return false;
    return str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

static std::string ExtractFileName(const std::string& path) {
    auto pos = path.find_last_of("\\/");
    if (pos != std::string::npos) return path.substr(pos + 1);
    return path;
}

void VirusScanner::SetProgressCallback(std::function<void(const std::string&, int)> callback) {
    progressCb = callback;
}

void VirusScanner::Notify(const std::string& msg, int pct) {
    if (progressCb) progressCb(msg, pct);
}

std::vector<ThreatInfo> VirusScanner::GetResults() {
    return threats;
}

std::string VirusScanner::GetQuarantinePath() {
    char appData[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, SHGFP_TYPE_CURRENT, appData);
    return std::string(appData) + "\\RinoxPrime\\Quarantine\\";
}

bool VirusScanner::CreateQuarantineDir() {
    std::string path = GetQuarantinePath();
    return CreateDirectoryA(path.c_str(), NULL) || GetLastError() == ERROR_ALREADY_EXISTS;
}

bool VirusScanner::QuarantineFile(const std::string& path) {
    if (!CreateQuarantineDir()) return false;

    std::string hash = GetFileHash(path);
    if (hash.empty()) hash = "unknown";

    std::string fname = ExtractFileName(path);
    std::string quarantinePath = GetQuarantinePath() + hash + "_" + fname;

    // Add .quarantine extension
    quarantinePath += ".quarantine";

    if (MoveFileA(path.c_str(), quarantinePath.c_str())) {
        return true;
    }

    // If move fails, try copy + delete
    if (CopyFileA(path.c_str(), quarantinePath.c_str(), FALSE)) {
        DeleteFileA(path.c_str());
        return true;
    }

    return false;
}

bool VirusScanner::KillProcess(const std::string& processName) {
    std::string name = processName;
    strlower(name);
    if (!endsWith(name, ".exe")) name += ".exe";

    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap == INVALID_HANDLE_VALUE) return false;

    PROCESSENTRY32 pe;
    pe.dwSize = sizeof(PROCESSENTRY32);
    bool killed = false;

    if (Process32First(hSnap, &pe)) {
        do {
            std::string current = pe.szExeFile;
            strlower(current);
            if (current == name) {
                HANDLE hProc = OpenProcess(PROCESS_TERMINATE, FALSE, pe.th32ProcessID);
                if (hProc) {
                    if (TerminateProcess(hProc, 1)) killed = true;
                    CloseHandle(hProc);
                }
            }
        } while (Process32Next(hSnap, &pe));
    }

    CloseHandle(hSnap);
    return killed;
}

bool VirusScanner::DeleteRegistryEntry(const std::string& hive, const std::string& keyPath, const std::string& valueName) {
    HKEY hRoot = HKEY_CURRENT_USER;
    if (hive == "HKLM" || hive == "HKEY_LOCAL_MACHINE") hRoot = HKEY_LOCAL_MACHINE;

    HKEY hKey;
    if (RegOpenKeyExA(hRoot, keyPath.c_str(), 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        LONG ret = RegDeleteValueA(hKey, valueName.c_str());
        RegCloseKey(hKey);
        return ret == ERROR_SUCCESS;
    }
    return false;
}

bool VirusScanner::DeleteScheduledTask(const std::string& taskName) {
    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    if (FAILED(hr)) return false;

    ITaskService* pService = NULL;
    hr = CoCreateInstance(CLSID_TaskScheduler, NULL, CLSCTX_INPROC_SERVER,
        IID_ITaskService, (void**)&pService);

    bool deleted = false;
    if (SUCCEEDED(hr)) {
        _variant_t vNull;
        vNull.vt = VT_NULL;
        hr = pService->Connect(vNull, vNull, vNull, vNull);
        if (SUCCEEDED(hr)) {
            ITaskFolder* pRootFolder = NULL;
            hr = pService->GetFolder(_bstr_t("\\"), &pRootFolder);
            if (SUCCEEDED(hr)) {
                hr = pRootFolder->DeleteTask(_bstr_t(taskName.c_str()), 0);
                deleted = SUCCEEDED(hr);
                pRootFolder->Release();
            }
        }
        pService->Release();
    }

    CoUninitialize();
    return deleted;
}

bool VirusScanner::CleanStartupEntry(const std::string& path) {
    return DeleteFileA(path.c_str()) == TRUE;
}

std::string VirusScanner::GetFileHash(const std::string& path) {
    HANDLE hFile = CreateFileA(path.c_str(), GENERIC_READ, FILE_SHARE_READ, NULL,
        OPEN_EXISTING, FILE_FLAG_SEQUENTIAL_SCAN, NULL);
    if (hFile == INVALID_HANDLE_VALUE) return "";

    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    std::string hash;

    if (CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT)) {
        if (CryptCreateHash(hProv, CALG_SHA1, 0, 0, &hHash)) {
            BYTE buffer[8192];
            DWORD bytesRead;
            while (ReadFile(hFile, buffer, sizeof(buffer), &bytesRead, NULL) && bytesRead > 0) {
                CryptHashData(hHash, buffer, bytesRead, 0);
            }

            BYTE hashBytes[20];
            DWORD hashLen = sizeof(hashBytes);
            if (CryptGetHashParam(hHash, HP_HASHVAL, hashBytes, &hashLen, 0)) {
                std::stringstream ss;
                for (DWORD i = 0; i < hashLen; i++)
                    ss << std::hex << std::setw(2) << std::setfill('0') << (int)hashBytes[i];
                hash = ss.str();
            }
            CryptDestroyHash(hHash);
        }
        CryptReleaseContext(hProv, 0);
    }
    CloseHandle(hFile);
    return hash;
}

double VirusScanner::CalculateEntropy(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) return 0.0;

    int freq[256] = { 0 };
    long long total = 0;
    char ch;

    while (file.get(ch)) {
        freq[(unsigned char)ch]++;
        total++;
    }

    if (total == 0) return 0.0;

    double entropy = 0.0;
    for (int i = 0; i < 256; i++) {
        if (freq[i] > 0) {
            double p = (double)freq[i] / total;
            entropy -= p * log2(p);
        }
    }

    return entropy;
}

bool VirusScanner::IsLegitimatePath(const std::string& path) {
    std::string lower = path;
    strlower(lower);

    std::vector<std::string> legitPaths = {
        "\\windows\\system32\\",
        "\\windows\\syswow64\\",
        "\\windows\\system\\",
        "\\program files\\",
        "\\program files (x86)\\",
        "\\programdata\\",
        "\\$windows.~bt\\",
        "\\$windows.~ws\\",
        "\\microsoft.net\\",
        "\\assembly\\",
        "\\windir\\",
        "\\microsoft shared\\",
        "\\common files\\"
    };
    for (auto& p : legitPaths) {
        if (lower.find(p) != std::string::npos) return true;
    }
    return false;
}

bool VirusScanner::ScanTempFolders() {
    char tempPath[MAX_PATH], appDataPath[MAX_PATH], localLowPath[MAX_PATH];

    GetTempPathA(MAX_PATH, tempPath);
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, SHGFP_TYPE_CURRENT, appDataPath);
    SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, SHGFP_TYPE_CURRENT, localLowPath);

    std::vector<std::string> scanDirs = { tempPath, appDataPath, localLowPath };

    std::vector<std::string> suspPatterns = {
        "grabber", "stealer", "malware", "keylog", "trojan",
        "ransom", "miner", "worm", "backdoor", "rat_",
        "cleaner.bat", "cleaner.vbs", "cleaner.ps1", "stub",
        "dropper", "loader", "inject", "payload", "exploit",
        "crypt", "decrypt", "password", "credential", "dump",
        "log_", "capture", "spy", "monitor", "record",
        "hook", "agent", "banker", "phish", "fud_",
        "crypted", "bind", "panel", "cnc_", "bot_",
        "ddos_", "scan_", "xrat", "njrat", "remcos",
        "orcus", "darkcomet", "cyberrat", "agenttesla",
        "hawkeye", "formbook", "lokibot", "azorult",
        "vidar", "redline", "raccoon", "meterpreter",
        "beacon", "mimikatz", "xmrig", "coin", "miner"
    };

    std::set<std::string> suspExts = { ".scr", ".bat", ".vbs", ".ps1", ".js", ".jse",
        ".vbe", ".wsf", ".wsh", ".hta", ".cpl", ".pif" };

    int total = (int)scanDirs.size();
    int done = 0;

    for (auto& dir : scanDirs) {
        std::string searchPath = dir + "\\*.*";
        WIN32_FIND_DATAA ffd;
        HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
        if (hFind == INVALID_HANDLE_VALUE) { done++; continue; }

        do {
            if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

            std::string fname = ffd.cFileName;
            std::string fullPath = dir + "\\" + fname;
            std::string lowerName = fname;
            strlower(lowerName);

            if (IsLegitimatePath(fullPath)) continue;

            bool flagged = false;

            for (auto& pattern : suspPatterns) {
                if (lowerName.find(pattern) != std::string::npos) {
                    ThreatInfo t;
                    t.path = fullPath;
                    t.type = "Suspicious File";
                    t.severity = "Medium";
                    t.details = "Name matches: " + pattern;
                    threats.push_back(t);
                    flagged = true;
                    break;
                }
            }

            if (flagged) continue;

            std::string ext;
            auto dot = lowerName.find_last_of('.');
            if (dot != std::string::npos) ext = lowerName.substr(dot);

            if (suspExts.count(ext)) {
                LARGE_INTEGER fileSize;
                fileSize.LowPart = ffd.nFileSizeLow;
                fileSize.HighPart = ffd.nFileSizeHigh;
                if (fileSize.QuadPart > 512 && fileSize.QuadPart < 100 * 1024 * 1024) {
                    ThreatInfo t;
                    t.path = fullPath;
                    t.type = "Dangerous Extension in Temp";
                    t.severity = "Medium";
                    t.details = ext + " file in temporary location";
                    threats.push_back(t);
                }
            }
        } while (FindNextFileA(hFind, &ffd) != 0);
        FindClose(hFind);

        done++;
        Notify("Temp folders scanned: " + dir, 5 + (done * 15) / total);
    }

    return true;
}

bool VirusScanner::ScanRegistryRunKeys() {
    HKEY hKey;
    std::vector<HKEY> rootKeys = { HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE };
    std::vector<std::string> runPaths = {
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        "Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        "Software\\Microsoft\\Windows\\CurrentVersion\\RunServices",
        "Software\\Microsoft\\Windows\\CurrentVersion\\RunServicesOnce",
        "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Run",
        "Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
        "Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\Run",
        "Software\\Microsoft\\Active Setup\\Installed Components",
        "Software\\Microsoft\\Windows\\CurrentVersion\\App Paths"
    };

    std::vector<std::string> suspKeywords = {
        "grabber", "stealer", "keylog", "malware", "trojan", "backdoor",
        "remote", "rat_", "admin_", "svch0st", "expl0rer", "winupdate",
        "microssoft", "googledrive", "flashplay", "javaw", "iexplore",
        "rundll32", "wscript", "cscript", "mshta", "regsvr32",
        "cmstp", "msiexec", "powershell", "vbscript"
    };

    int total = (int)rootKeys.size() * (int)runPaths.size();
    int done = 0;

    for (auto rootKey : rootKeys) {
        for (auto& subKey : runPaths) {
            if (RegOpenKeyExA(rootKey, subKey.c_str(), 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
                char valueName[1024];
                BYTE valueData[8192];
                DWORD valueNameSize, valueDataSize, type;
                DWORD index = 0;

                while (true) {
                    valueNameSize = sizeof(valueName);
                    valueDataSize = sizeof(valueData);
                    LONG ret = RegEnumValueA(hKey, index, valueName, &valueNameSize,
                        NULL, &type, valueData, &valueDataSize);
                    if (ret != ERROR_SUCCESS) break;

                    std::string valStr((char*)valueData, valueDataSize > 0 ? valueDataSize - 1 : 0);
                    std::string lowerVal = valStr;
                    strlower(lowerVal);

                    for (auto& kw : suspKeywords) {
                        if (lowerVal.find(kw) != std::string::npos) {
                            std::string hivePrefix = (rootKey == HKEY_CURRENT_USER) ? "HKCU\\" : "HKLM\\";
                            ThreatInfo t;
                            t.path = hivePrefix + subKey;
                            t.type = "Registry Persistence";
                            t.severity = "High";
                            t.details = std::string(valueName) + " = " + valStr.substr(0, 100);
                            threats.push_back(t);
                            break;
                        }
                    }

                    // Encoded PowerShell detection
                    if (lowerVal.find("powershell") != std::string::npos &&
                        (lowerVal.find("-enc") != std::string::npos ||
                         lowerVal.find("-e ") != std::string::npos ||
                         lowerVal.find("bypass") != std::string::npos ||
                         lowerVal.find("windowstyle hidden") != std::string::npos)) {
                        std::string hivePrefix = (rootKey == HKEY_CURRENT_USER) ? "HKCU\\" : "HKLM\\";
                        ThreatInfo t;
                        t.path = hivePrefix + subKey;
                        t.type = "Encoded PowerShell in Registry";
                        t.severity = "Critical";
                        t.details = std::string(valueName) + " contains obfuscated PowerShell";
                        threats.push_back(t);
                    }

                    // Check for startup in Temp/AppData
                    if (lowerVal.find("temp") != std::string::npos ||
                        lowerVal.find("appdata") != std::string::npos ||
                        lowerVal.find("\\users\\") != std::string::npos) {
                        bool hasSystem = (lowerVal.find("system32") != std::string::npos ||
                                          lowerVal.find("syswow64") != std::string::npos);
                        if (!hasSystem) {
                            std::string hivePrefix = (rootKey == HKEY_CURRENT_USER) ? "HKCU\\" : "HKLM\\";
                            ThreatInfo t;
                            t.path = hivePrefix + subKey;
                            t.type = "Suspicious Registry Path";
                            t.severity = "Medium";
                            t.details = std::string(valueName) + " runs from user directory";
                            threats.push_back(t);
                        }
                    }

                    index++;
                }
                RegCloseKey(hKey);
            }

            done++;
            if (total > 0) Notify("Registry scan: " + subKey, 20 + (done * 20) / total);
        }
    }

    return true;
}

bool VirusScanner::ScanSuspiciousProcesses() {
    std::vector<std::string> suspProcesses = {
        "grabber", "stealer", "keylog", "trojan", "backdoor",
        "remcos", "njrat", "orcus", "darkcomet", "xrat",
        "cyberrat", "agenttesla", "hawkeye", "formbook",
        "lokibot", "azorult", "vidar", "redline",
        "raccoon", "record", "log_", "meterpreter",
        "beacon", "cobaltstrike", "mimikatz", "powersploit",
        "cleaner", "stub", "payload", "inject",
        "crypt", "bind", "panel", "cnc", "bot_",
        "ddos", "miner", "coin", "xmrig"
    };

    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap == INVALID_HANDLE_VALUE) return false;

    PROCESSENTRY32 pe;
    pe.dwSize = sizeof(PROCESSENTRY32);

    int total = 0;
    int done = 0;

    if (Process32First(hSnap, &pe)) {
        do { total++; } while (Process32Next(hSnap, &pe));
    }

    if (Process32First(hSnap, &pe)) {
        do {
            std::string name = pe.szExeFile;
            std::string lowerName = name;
            strlower(lowerName);

            // Full name matching
            for (auto& susp : suspProcesses) {
                if (lowerName.find(susp) != std::string::npos) {
                    ThreatInfo t;
                    t.path = name + " (PID: " + std::to_string(pe.th32ProcessID) + ")";
                    t.type = "Suspicious Process";
                    t.severity = "High";
                    t.details = "Process name contains: " + susp;
                    threats.push_back(t);
                    break;
                }
            }

            // Check for processes running from temp
            std::string lowerNameExe = pe.szExeFile;
            strlower(lowerNameExe);
            if (lowerNameExe.find("temp") != std::string::npos ||
                lowerNameExe.find("appdata\\local\\temp") != std::string::npos) {
                ThreatInfo t;
                t.path = name + " (PID: " + std::to_string(pe.th32ProcessID) + ")";
                t.type = "Process from Temp";
                t.severity = "High";
                t.details = "Running from temporary directory";
                threats.push_back(t);
            }

            done++;
            if (done % 20 == 0) {
                Notify("Scanning processes...", total > 0 ? (done * 100) / total : 0);
            }
        } while (Process32Next(hSnap, &pe));
    }

    CloseHandle(hSnap);
    return true;
}

bool VirusScanner::ScanScheduledTasks() {
    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    if (FAILED(hr)) return false;

    ITaskService* pService = NULL;
    hr = CoCreateInstance(CLSID_TaskScheduler, NULL, CLSCTX_INPROC_SERVER,
        IID_ITaskService, (void**)&pService);

    if (SUCCEEDED(hr)) {
        _variant_t vNull;
        vNull.vt = VT_NULL;
        hr = pService->Connect(vNull, vNull, vNull, vNull);
        if (SUCCEEDED(hr)) {
            ITaskFolder* pRootFolder = NULL;
            hr = pService->GetFolder(_bstr_t("\\"), &pRootFolder);
            if (SUCCEEDED(hr)) {
                IRegisteredTaskCollection* pTaskCollection = NULL;
                hr = pRootFolder->GetTasks(TASK_ENUM_HIDDEN, &pTaskCollection);
                if (SUCCEEDED(hr)) {
                    LONG taskCount = 0;
                    pTaskCollection->get_Count(&taskCount);

                    std::vector<std::string> suspPatterns = {
                        "updater", "cleaner", "optimizer",
                        "java", "flash", "silent", "hidden",
                        "systemcheck", "securityscan",
                        "svchost", "runtime", "crash"
                    };

                    for (LONG i = 1; i <= taskCount; i++) {
                        IRegisteredTask* pTask = NULL;
                        hr = pTaskCollection->get_Item(_variant_t(i), &pTask);
                        if (SUCCEEDED(hr) && pTask) {
                            BSTR taskName = NULL;
                            pTask->get_Name(&taskName);
                            if (taskName) {
                                _bstr_t bstrName(taskName, false);
                                std::string taskStr((const char*)bstrName);
                                std::string lowerTask = taskStr;
                                strlower(lowerTask);

                                BSTR taskPath = NULL;
                                pTask->get_Path(&taskPath);
                                std::string taskPathStr;
                                if (taskPath) {
                                    _bstr_t bstrPath(taskPath, false);
                                    taskPathStr = (const char*)bstrPath;
                                }

                                bool isMicrosoft = (taskPathStr.find("Microsoft") != std::string::npos);

                                for (auto& pattern : suspPatterns) {
                                    if (lowerTask.find(pattern) != std::string::npos && !isMicrosoft) {
                                        ThreatInfo t;
                                        t.path = taskStr;
                                        t.type = "Suspicious Scheduled Task";
                                        t.severity = "Medium";
                                        t.details = "Non-Microsoft task matching: " + pattern;
                                        threats.push_back(t);
                                        break;
                                    }
                                }

                                ITaskDefinition* pDef = NULL;
                                pTask->get_Definition(&pDef);
                                if (pDef) {
                                    ITaskSettings* pSettings = NULL;
                                    pDef->get_Settings(&pSettings);
                                    if (pSettings) {
                                        VARIANT_BOOL hidden;
                                        pSettings->get_Hidden(&hidden);
                                        if (hidden == VARIANT_TRUE && !isMicrosoft) {
                                            ThreatInfo t;
                                            t.path = taskStr + " (Hidden)";
                                            t.type = "Hidden Scheduled Task";
                                            t.severity = "High";
                                            t.details = "Non-Microsoft hidden task - possible persistence";
                                            threats.push_back(t);
                                        }
                                        pSettings->Release();
                                    }
                                    pDef->Release();
                                }
                            }
                            pTask->Release();
                        }
                    }
                    pTaskCollection->Release();
                }
                pRootFolder->Release();
            }
        }
        pService->Release();
    }

    CoUninitialize();
    return true;
}

bool VirusScanner::ScanStartupFolder() {
    char startupPath[MAX_PATH], commonStartupPath[MAX_PATH];

    SHGetFolderPathA(NULL, CSIDL_STARTUP, NULL, SHGFP_TYPE_CURRENT, startupPath);
    SHGetFolderPathA(NULL, CSIDL_COMMON_STARTUP, NULL, SHGFP_TYPE_CURRENT, commonStartupPath);

    std::vector<std::string> startupDirs = { startupPath, commonStartupPath };

    for (auto& dir : startupDirs) {
        std::string searchPath = dir + "\\*.*";
        WIN32_FIND_DATAA ffd;
        HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
        if (hFind == INVALID_HANDLE_VALUE) continue;

        do {
            if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

            std::string fname = ffd.cFileName;
            std::string fullPath = dir + "\\" + fname;
            std::string lowerName = fname;
            strlower(lowerName);

            std::string ext;
            auto dot = lowerName.find_last_of('.');
            if (dot != std::string::npos) ext = lowerName.substr(dot);

            std::set<std::string> suspExts = { ".lnk", ".url", ".bat", ".vbs", ".ps1",
                ".js", ".jse", ".vbe", ".wsf", ".wsh", ".hta", ".scr", ".cpl", ".pif", ".jar" };

            if (suspExts.count(ext)) {
                std::vector<std::string> patterns = {
                    "grabber", "stealer", "malware", "keylog", "trojan",
                    "backdoor", "cleaner", "stub", "inject", "payload",
                    "crypt", "loader", "dropper", "rat_", "agent",
                    "update", "fix", "optimize", "boost", "speedup",
                    "tuneup", "pcrepair", "systemcheck", "security",
                    "protect", "shield", "antivirus", "removal",
                    "clean", "wipe", "erase", "destroy", "kill"
                };

                for (auto& pattern : patterns) {
                    if (lowerName.find(pattern) != std::string::npos) {
                        ThreatInfo t;
                        t.path = fullPath;
                        t.type = "Suspicious Startup Entry";
                        t.severity = "High";
                        t.details = ext + " file with suspicious name";
                        threats.push_back(t);
                        break;
                    }
                }
            }

            if (ext == ".exe") {
                std::vector<std::string> exePatterns = {"grabber", "stealer", "cleaner",
                    "stub", "dropper", "loader", "payload", "inject"};
                for (auto& pattern : exePatterns) {
                    if (lowerName.find(pattern) != std::string::npos) {
                        ThreatInfo t;
                        t.path = fullPath;
                        t.type = "Suspicious Startup Executable";
                        t.severity = "Critical";
                        t.details = "Executable with malware-like name in startup";
                        threats.push_back(t);
                        break;
                    }
                }
            }
        } while (FindNextFileA(hFind, &ffd) != 0);
        FindClose(hFind);
    }

    return true;
}

bool VirusScanner::ScanAutoruns() {
    // Scan additional auto-start locations
    HKEY hKey;

    // ShellServiceObjectDelayLoad
    std::vector<std::pair<HKEY, std::string>> autorunLocations = {
        { HKEY_LOCAL_MACHINE, "Software\\Microsoft\\Windows\\CurrentVersion\\ShellServiceObjectDelayLoad" },
        { HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\ShellServiceObjectDelayLoad" },
        { HKEY_LOCAL_MACHINE, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ShellFolders" },
        { HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ShellFolders" },
        { HKEY_LOCAL_MACHINE, "System\\CurrentControlSet\\Services" },
        { HKEY_LOCAL_MACHINE, "Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\AppInit_DLLs" },
        { HKEY_LOCAL_MACHINE, "Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\LoadAppInit_DLLs" },
        { HKEY_LOCAL_MACHINE, "System\\CurrentControlSet\\Control\\Session Manager\\BootExecute" }
    };

    for (auto& loc : autorunLocations) {
        std::string subKey = loc.second;
        if (RegOpenKeyExA(loc.first, subKey.c_str(), 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            char valueName[1024];
            BYTE valueData[4096];
            DWORD valueNameSize, valueDataSize, type;
            DWORD index = 0;

            while (true) {
                valueNameSize = sizeof(valueName);
                valueDataSize = sizeof(valueData);
                LONG ret = RegEnumValueA(hKey, index, valueName, &valueNameSize,
                    NULL, &type, valueData, &valueDataSize);
                if (ret != ERROR_SUCCESS) break;

                std::string valStr((char*)valueData, valueDataSize > 0 ? valueDataSize - 1 : 0);
                std::string lowerVal = valStr;
                strlower(lowerVal);

                // Check if points to temp or non-system location
                if (lowerVal.find("temp") != std::string::npos ||
                    lowerVal.find("appdata") != std::string::npos ||
                    lowerVal.find("\\users\\") != std::string::npos) {
                    if (lowerVal.find("system32") == std::string::npos &&
                        lowerVal.find("syswow64") == std::string::npos) {
                        std::string hivePrefix = (loc.first == HKEY_CURRENT_USER) ? "HKCU\\" : "HKLM\\";
                        ThreatInfo t;
                        t.path = hivePrefix + subKey + "\\" + valueName;
                        t.type = "Autoruns Persistence";
                        t.severity = "High";
                        t.details = "Autorun pointing to user directory";
                        threats.push_back(t);
                    }
                }

                index++;
            }
            RegCloseKey(hKey);
        }
    }

    Notify("Autoruns scan complete", 100);
    return true;
}

bool VirusScanner::ScanBrowserExtensions() {
    std::vector<std::string> browserExtPaths = {
        "\\Google\\Chrome\\User Data\\Default\\Extensions",
        "\\Microsoft\\Edge\\User Data\\Default\\Extensions",
        "\\Opera Software\\Opera Stable\\Extensions",
        "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Extensions"
    };

    char localAppData[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, SHGFP_TYPE_CURRENT, localAppData);

    for (auto& relPath : browserExtPaths) {
        std::string fullPath = std::string(localAppData) + relPath;
        std::string searchPath = fullPath + "\\*.*";

        WIN32_FIND_DATAA ffd;
        HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
        if (hFind == INVALID_HANDLE_VALUE) continue;

        do {
            if (!(ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) continue;
            std::string dirName = ffd.cFileName;
            if (dirName == "." || dirName == "..") continue;

            // Check extension manifest for suspicious permissions
            std::string manifestPath = fullPath + "\\" + dirName + "\\manifest.json";
            HANDLE hManifest = CreateFileA(manifestPath.c_str(), GENERIC_READ,
                FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
            if (hManifest != INVALID_HANDLE_VALUE) {
                char manifestData[4096] = { 0 };
                DWORD bytesRead;
                if (ReadFile(hManifest, manifestData, sizeof(manifestData) - 1, &bytesRead, NULL)) {
                    std::string manifest(manifestData, bytesRead);
                    std::string lowerManifest = manifest;
                    strlower(lowerManifest);

                    // Check for dangerous permissions
                    std::vector<std::string> dangerousPerms = {
                        "nativeMessaging", "debugger", "clipboardRead",
                        "tabs", "cookies", "history", "downloads",
                        "management", "proxy", "webRequest",
                        "webRequestBlocking", "<all_urls>"
                    };

                    for (auto& perm : dangerousPerms) {
                        if (lowerManifest.find(perm) != std::string::npos) {
                            ThreatInfo t;
                            t.path = fullPath + "\\" + dirName;
                            t.type = "Browser Extension";
                            t.severity = "Medium";
                            t.details = "Extension with '" + perm + "' permission";
                            threats.push_back(t);
                            break;
                        }
                    }
                }
                CloseHandle(hManifest);
            }
        } while (FindNextFileA(hFind, &ffd) != 0);
        FindClose(hFind);
    }

    return true;
}

bool VirusScanner::ScanNetworkConnections() {
    MIB_TCPTABLE_OWNER_PID* pTcpTable = NULL;
    DWORD dwSize = 0;

    if (GetExtendedTcpTable(NULL, &dwSize, FALSE, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0) == ERROR_INSUFFICIENT_BUFFER) {
        pTcpTable = (MIB_TCPTABLE_OWNER_PID*)malloc(dwSize);
        if (pTcpTable) {
            if (GetExtendedTcpTable(pTcpTable, &dwSize, FALSE, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0) == NO_ERROR) {
                std::vector<std::string> suspIPs = {
                    "185.", "89.", "91.", "5.", "46.", "23.", "45.",
                    "103.", "104.", "107.", "108.", "172.", "173."
                };

                for (DWORD i = 0; i < pTcpTable->dwNumEntries; i++) {
                    MIB_TCPROW_OWNER_PID row = pTcpTable->table[i];
                    if (row.dwState == MIB_TCP_STATE_ESTAB) {
                        struct in_addr addr;
                        addr.S_un.S_addr = row.dwRemoteAddr;
                        char* ipStr = inet_ntoa(addr);
                        if (ipStr) {
                            std::string ip(ipStr);
                            // Check for suspicious ports
                            DWORD port = ntohs((u_short)row.dwRemotePort);
                            std::set<DWORD> suspPorts = { 4444, 5555, 6666, 7777, 8888,
                                1234, 1337, 31337, 4443, 5000, 8080, 9001, 1604 };
                            if (suspPorts.count(port)) {
                                // Get process name
                                HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
                                if (hSnap != INVALID_HANDLE_VALUE) {
                                    PROCESSENTRY32 pe;
                                    pe.dwSize = sizeof(PROCESSENTRY32);
                                    if (Process32First(hSnap, &pe)) {
                                        do {
                                            if (pe.th32ProcessID == row.dwOwningPid) {
                                                ThreatInfo t;
                                                t.path = pe.szExeFile + std::string(" -> ") + ip + ":" + std::to_string(port);
                                                t.type = "Suspicious Connection";
                                                t.severity = "High";
                                                t.details = "Process connected to suspicious port";
                                                threats.push_back(t);
                                                break;
                                            }
                                        } while (Process32Next(hSnap, &pe));
                                    }
                                    CloseHandle(hSnap);
                                }
                            }
                        }
                    }
                }
            }
            free(pTcpTable);
        }
    }

    return true;
}

bool VirusScanner::ScanHostsFile() {
    char winDir[MAX_PATH];
    GetWindowsDirectoryA(winDir, MAX_PATH);
    std::string hostsPath = std::string(winDir) + "\\System32\\drivers\\etc\\hosts";

    HANDLE hFile = CreateFileA(hostsPath.c_str(), GENERIC_READ, FILE_SHARE_READ,
        NULL, OPEN_EXISTING, 0, NULL);
    if (hFile == INVALID_HANDLE_VALUE) return false;

    char buffer[16384] = { 0 };
    DWORD bytesRead;
    if (ReadFile(hFile, buffer, sizeof(buffer) - 1, &bytesRead, NULL)) {
        std::string content(buffer, bytesRead);
        std::string lowerContent = content;
        strlower(lowerContent);

        // Check for common hijacked domains
        std::vector<std::string> hijackedDomains = {
            "google.com", "facebook.com", "youtube.com",
            "gmail.com", "outlook.com", "microsoft.com",
            "instagram.com", "twitter.com", "whatsapp.com",
            "telegram.org", "discord.com", "reddit.com",
            "paypal.com", "bank", "login", "secure",
            "update", "microsoft", "windows",
            "github.com", "bitbucket.com"
        };

        // Check if localhost redirects are suspicious
        for (auto& domain : hijackedDomains) {
            size_t pos = lowerContent.find(domain);
            if (pos != std::string::npos) {
                // Check if there's an IP before this domain
                std::string line;
                size_t lineStart = (pos == 0) ? 0 : lowerContent.rfind('\n', pos - 1);
                if (lineStart != std::string::npos) {
                    line = lowerContent.substr(lineStart, lowerContent.find('\n', pos) - lineStart);
                }

                // Skip comments and legitimate 127.0.0.1 entries
                if (line.find('#') == std::string::npos &&
                    line.find("127.0.0.1") == std::string::npos &&
                    line.find("::1") == std::string::npos) {
                    ThreatInfo t;
                    t.path = hostsPath;
                    t.type = "Hosts File Hijack";
                    t.severity = "Critical";
                    t.details = "Domain " + domain + " redirected";
                    threats.push_back(t);
                    break;
                }
            }
        }

        // Check for excessive entries (> 50 non-comment lines = likely hijacked)
        int lineCount = 0;
        size_t nPos = 0;
        while ((nPos = lowerContent.find('\n', nPos)) != std::string::npos) {
            nPos++;
            // Count non-empty, non-comment lines
            if (nPos < lowerContent.size() && lowerContent[nPos] != '#' && lowerContent[nPos] != '\r' && lowerContent[nPos] != '\n') {
                lineCount++;
            }
        }
        if (lineCount > 50) {
            ThreatInfo t;
            t.path = hostsPath;
            t.type = "Hosts File Overflow";
            t.severity = "Medium";
            t.details = "Abnormally large hosts file: " + std::to_string(lineCount) + " entries";
            threats.push_back(t);
        }
    }
    CloseHandle(hFile);

    return true;
}

bool VirusScanner::ScanRecentFiles() {
    char recentPath[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_RECENT, NULL, SHGFP_TYPE_CURRENT, recentPath);

    std::string searchPath = std::string(recentPath) + "\\*.*";
    WIN32_FIND_DATAA ffd;
    HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
    if (hFind == INVALID_HANDLE_VALUE) return true;

    std::vector<std::string> suspPatterns = {
        "grabber", "stealer", "malware", "keylog", "trojan",
        "backdoor", "rat_", "stub", "dropper", "loader",
        "inject", "payload", "exploit", "crypt", "decrypt",
        "password", "credential", "cleaner", "miner", "coin"
    };

    do {
        if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

        std::string fname = ffd.cFileName;
        std::string lowerName = fname;
        strlower(lowerName);

        if (endsWith(lowerName, ".lnk") || endsWith(lowerName, ".url")) {
            for (auto& pattern : suspPatterns) {
                if (lowerName.find(pattern) != std::string::npos) {
                    ThreatInfo t;
                    t.path = std::string(recentPath) + "\\" + fname;
                    t.type = "Suspicious Recent File";
                    t.severity = "Medium";
                    t.details = "Recent shortcut with suspicious name";
                    threats.push_back(t);
                    break;
                }
            }
        }
    } while (FindNextFileA(hFind, &ffd) != 0);
    FindClose(hFind);

    return true;
}

bool VirusScanner::ScanBrowserData() {
    char localAppData[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, SHGFP_TYPE_CURRENT, localAppData);

    std::vector<std::string> browserProfilePaths = {
        "\\Google\\Chrome\\User Data\\Default",
        "\\Microsoft\\Edge\\User Data\\Default",
        "\\Opera Software\\Opera Stable",
        "\\BraveSoftware\\Brave-Browser\\User Data\\Default"
    };

    std::vector<std::string> sensitiveFiles = {
        "Cookies", "Login Data", "Web Data", "History",
        "Bookmarks", "Credit Dump", "Password"
    };

    for (auto& profile : browserProfilePaths) {
        std::string profilePath = std::string(localAppData) + profile;
        std::string searchPath = profilePath + "\\*.*";

        WIN32_FIND_DATAA ffd;
        HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
        if (hFind == INVALID_HANDLE_VALUE) continue;

        do {
            if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

            std::string fname = ffd.cFileName;
            std::string lowerName = fname;
            strlower(lowerName);

            // Check if sensitive browser files are being accessed by non-browser processes
            for (auto& sensitive : sensitiveFiles) {
                std::string lowerSensitive = sensitive;
                strlower(lowerSensitive);
                if (lowerName.find(lowerSensitive) != std::string::npos) {
                    // Check if file is locked (being read by another process)
                    HANDLE hCheck = CreateFileA((profilePath + "\\" + fname).c_str(),
                        GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
                        NULL, OPEN_EXISTING, 0, NULL);
                    if (hCheck == INVALID_HANDLE_VALUE && GetLastError() == ERROR_SHARING_VIOLATION) {
                        ThreatInfo t;
                        t.path = profilePath + "\\" + fname;
                        t.type = "Browser Data Access";
                        t.severity = "High";
                        t.details = "Sensitive browser file being accessed";
                        threats.push_back(t);
                    }
                    if (hCheck) CloseHandle(hCheck);
                }
            }
        } while (FindNextFileA(hFind, &ffd) != 0);
        FindClose(hFind);
    }

    return true;
}

bool VirusScanner::EntropyScan() {
    char tempPath[MAX_PATH];
    GetTempPathA(MAX_PATH, tempPath);

    std::string searchPath = std::string(tempPath) + "\\*.exe";
    WIN32_FIND_DATAA ffd;
    HANDLE hFind = FindFirstFileA(searchPath.c_str(), &ffd);
    if (hFind == INVALID_HANDLE_VALUE) return true;

    do {
        if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

        std::string fullPath = std::string(tempPath) + "\\" + ffd.cFileName;

        LARGE_INTEGER fileSize;
        fileSize.LowPart = ffd.nFileSizeLow;
        fileSize.HighPart = ffd.nFileSizeHigh;

        // Only scan files between 1KB and 10MB
        if (fileSize.QuadPart < 1024 || fileSize.QuadPart > 10 * 1024 * 1024) continue;

        double entropy = CalculateEntropy(fullPath);

        // Packed/crypted files typically have entropy > 7.2
        // Normal executables are around 5.0-6.5
        if (entropy > 7.2) {
            ThreatInfo t;
            t.path = fullPath;
            t.type = "High Entropy (Packed)";
            t.severity = "High";
            std::stringstream ss;
            ss << std::fixed << std::setprecision(2) << entropy;
            t.details = "Entropy: " + ss.str() + " - Possible packed malware";
            threats.push_back(t);
        }
    } while (FindNextFileA(hFind, &ffd) != 0);
    FindClose(hFind);

    // Also scan AppData\Local\Temp for DLLs
    searchPath = std::string(tempPath) + "\\*.dll";
    hFind = FindFirstFileA(searchPath.c_str(), &ffd);
    if (hFind != INVALID_HANDLE_VALUE) {
        do {
            if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;

            std::string fullPath = std::string(tempPath) + "\\" + ffd.cFileName;

            LARGE_INTEGER fileSize;
            fileSize.LowPart = ffd.nFileSizeLow;
            fileSize.HighPart = ffd.nFileSizeHigh;

            if (fileSize.QuadPart < 1024 || fileSize.QuadPart > 10 * 1024 * 1024) continue;

            double entropy = CalculateEntropy(fullPath);
            if (entropy > 7.2) {
                ThreatInfo t;
                t.path = fullPath;
                t.type = "High Entropy DLL (Packed)";
                t.severity = "High";
                std::stringstream ss;
                ss << std::fixed << std::setprecision(2) << entropy;
                t.details = "Entropy: " + ss.str() + " - Possible packed malware";
                threats.push_back(t);
            }
        } while (FindNextFileA(hFind, &ffd) != 0);
        FindClose(hFind);
    }

    return true;
}

bool VirusScanner::CheckWindowsDefender() {
    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    if (FAILED(hr)) return false;

    // Check if Windows Defender is running
    bool defenderActive = false;
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe;
        pe.dwSize = sizeof(PROCESSENTRY32);
        if (Process32First(hSnap, &pe)) {
            do {
                std::string name = pe.szExeFile;
                strlower(name);
                if (name == "msmpeng.exe" || name == "defender.exe" ||
                    name == "nissrv.exe" || name == "securityhealthservice.exe") {
                    defenderActive = true;
                }
            } while (Process32Next(hSnap, &pe));
        }
        CloseHandle(hSnap);
    }

    if (!defenderActive) {
        ThreatInfo t;
        t.path = "Windows Defender";
        t.type = "Antivirus Disabled";
        t.severity = "Critical";
        t.details = "Windows Defender is not running!";
        threats.push_back(t);
    }

    // Check real-time monitoring via registry
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
        "Software\\Microsoft\\Windows Defender\\Real-Time Protection",
        0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        DWORD value = 0;
        DWORD size = sizeof(value);
        if (RegQueryValueExA(hKey, "DisableRealtimeMonitoring", NULL, NULL,
            (LPBYTE)&value, &size) == ERROR_SUCCESS) {
            if (value == 1) {
                ThreatInfo t;
                t.path = "Windows Defender Real-Time";
                t.type = "Real-Time Protection Disabled";
                t.severity = "Critical";
                t.details = "Real-time monitoring is disabled!";
                threats.push_back(t);
            }
        }
        RegCloseKey(hKey);
    }

    CoUninitialize();
    return true;
}

bool VirusScanner::CleanAll() {
    int total = (int)threats.size();
    int cleaned = 0;

    Notify("Starting threat removal...", 0);

    for (auto& threat : threats) {
        if (threat.deleted) continue;

        std::string type = threat.type;
        std::string path = threat.path;
        bool success = false;

        if (type == "Suspicious File" || type == "Dangerous Extension in Temp" ||
            type == "High Entropy (Packed)" || type == "High Entropy DLL (Packed)" ||
            type == "Suspicious Startup Entry" || type == "Suspicious Startup Executable" ||
            type == "Suspicious Recent File") {
            // Extract file path from threat
            std::string filePath = path;
            // If the path contains " -> " it's a network connection, skip
            if (filePath.find(" -> ") == std::string::npos &&
                filePath.find(" (PID: ") == std::string::npos &&
                filePath.find(" (Hidden)") == std::string::npos) {
                if (QuarantineFile(filePath)) {
                    threat.quarantined = true;
                    threat.deleted = true;
                    success = true;
                }
                else if (DeleteFileA(filePath.c_str())) {
                    threat.deleted = true;
                    success = true;
                }
            }
        }
        else if (type == "Suspicious Process" || type == "Process from Temp") {
            // Extract process name from "name.exe (PID: 1234)"
            std::string procName;
            size_t pidPos = path.find(" (PID: ");
            if (pidPos != std::string::npos) {
                procName = path.substr(0, pidPos);
            }
            if (!procName.empty()) {
                if (KillProcess(procName)) {
                    threat.deleted = true;
                    success = true;
                }
            }
        }
        else if (type == "Registry Persistence" || type == "Encoded PowerShell in Registry" ||
                 type == "Suspicious Registry Path" || type == "Autoruns Persistence") {
            // Parse registry path: "HKCU\Software\...\valueName" or "HKLM\Software\..."
            std::string hive = "HKCU";
            std::string remaining = path;
            if (path.find("HKLM\\") == 0) {
                hive = "HKLM";
                remaining = path.substr(5);
            }
            else if (path.find("HKCU\\") == 0) {
                remaining = path.substr(5);
            }
            else if (path.find("HKEY_CURRENT_USER\\") == 0) {
                hive = "HKCU";
                remaining = path.substr(18);
            }
            else if (path.find("HKEY_LOCAL_MACHINE\\") == 0) {
                hive = "HKLM";
                remaining = path.substr(19);
            }

            // remaining is like "Software\Microsoft\Windows\CurrentVersion\Run\valueName"
            auto lastSep = remaining.find_last_of('\\');
            if (lastSep != std::string::npos) {
                std::string keyPath = remaining.substr(0, lastSep);
                std::string valName = remaining.substr(lastSep + 1);
                if (DeleteRegistryEntry(hive, keyPath, valName)) {
                    threat.deleted = true;
                    success = true;
                }
            }
        }
        else if (type == "Suspicious Scheduled Task" || type == "Hidden Scheduled Task") {
            std::string taskName = path;
            size_t hiddenPos = taskName.find(" (Hidden)");
            if (hiddenPos != std::string::npos) {
                taskName = taskName.substr(0, hiddenPos);
            }
            if (DeleteScheduledTask(taskName)) {
                threat.deleted = true;
                success = true;
            }
        }
        else if (type == "Browser Extension") {
            // Delete the extension folder
            std::string extPath = path;
            if (QuarantineFile(extPath + "\\*")) {
                // Can't quarantine wildcard, try to delete recursively
                SHFILEOPSTRUCTA fos = { 0 };
                fos.wFunc = FO_DELETE;
                fos.pFrom = (extPath + "\\\0").c_str();
                fos.fFlags = FOF_NO_UI | FOF_SILENT;
                if (SHFileOperationA(&fos) == 0) {
                    threat.deleted = true;
                    success = true;
                }
            }
        }

        if (success) cleaned++;

        if (total > 0) {
            Notify("Cleaning: " + threat.type + " - " + (success ? "OK" : "Failed"),
                20 + (cleaned * 80) / total);
        }
    }

    Notify("Cleanup complete. Removed " + std::to_string(cleaned) + "/" + std::to_string(total) + " threats", 100);
    return cleaned > 0;
}

bool VirusScanner::ScanAll() {
    threats.clear();

    Notify("Initializing advanced virus scanner...", 0);

    Notify("Scanning temporary folders...", 3);
    ScanTempFolders();

    Notify("Scanning registry persistence...", 12);
    ScanRegistryRunKeys();

    Notify("Scanning autoruns...", 22);
    ScanAutoruns();

    Notify("Scanning scheduled tasks...", 30);
    ScanScheduledTasks();

    Notify("Scanning running processes...", 38);
    ScanSuspiciousProcesses();

    Notify("Scanning startup folders...", 48);
    ScanStartupFolder();

    Notify("Scanning browser extensions...", 55);
    ScanBrowserExtensions();

    Notify("Scanning network connections...", 62);
    ScanNetworkConnections();

    Notify("Inspecting hosts file...", 70);
    ScanHostsFile();

    Notify("Analyzing file entropy (packed malware)...", 76);
    EntropyScan();

    Notify("Scanning recent files...", 82);
    ScanRecentFiles();

    Notify("Checking browser data integrity...", 88);
    ScanBrowserData();

    Notify("Verifying Windows Defender status...", 94);
    CheckWindowsDefender();

    Notify("Scan complete! " + std::to_string(threats.size()) + " threats detected.", 100);

    return true;
}
