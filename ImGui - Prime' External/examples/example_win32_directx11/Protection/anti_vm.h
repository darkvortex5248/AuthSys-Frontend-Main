#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <vector>
#include <intrin.h>
#include <tlhelp32.h>
#include <iphlpapi.h>

#pragma comment(lib, "iphlpapi.lib")

// ── VM / Sandbox / Hypervisor Detection ──

namespace protection::anti_vm {

    // ── CPUID-based hypervisor detection ──
    inline bool CpuIdHypervisorCheck() {
        int cpuInfo[4] = {};
        __cpuid(cpuInfo, 1);
        // Bit 31 of ECX = hypervisor present
        if (cpuInfo[2] & (1 << 31)) {
            // Get hypervisor signature
            __cpuid(cpuInfo, 0x40000000);
            char sig[13] = {};
            memcpy(sig, &cpuInfo[1], 4);
            memcpy(sig + 4, &cpuInfo[2], 4);
            memcpy(sig + 8, &cpuInfo[3], 4);
            sig[12] = 0;

            std::string vendor(sig);
            if (vendor.find("VMware") != std::string::npos ||
                vendor.find("VBOX") != std::string::npos ||
                vendor.find("KVM") != std::string::npos ||
                vendor.find("Microsoft Hv") != std::string::npos ||
                vendor.find("XenVMM") != std::string::npos ||
                vendor.find("prl hyperv") != std::string::npos ||
                vendor.find("QEMU") != std::string::npos) {
                return true;
            }
        }
        return false;
    }

    // ── Check for known VM processes ──
    inline bool CheckVMProcesses() {
        const wchar_t* vmProcesses[] = {
            L"vmtoolsd.exe", L"vmwaretray.exe", L"vmwareuser.exe",
            L"VBoxTray.exe", L"VBoxControl.exe", L"VBoxService.exe",
            L"xenservice.exe", L"qemu-ga.exe",
            L"prl_cc.exe", L"prl_hids.exe", L"prl_tools.exe",
            L"vmsrvc.exe", L"vmusrvc.exe"
        };

        HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnap == INVALID_HANDLE_VALUE) return false;

        PROCESSENTRY32W pe = { sizeof(PROCESSENTRY32W) };
        if (Process32FirstW(hSnap, &pe)) {
            do {
                _wcslwr_s(pe.szExeFile);
                for (auto vmp : vmProcesses) {
                    if (wcscmp(pe.szExeFile, vmp) == 0) {
                        CloseHandle(hSnap);
                        return true;
                    }
                }
            } while (Process32NextW(hSnap, &pe));
        }
        CloseHandle(hSnap);
        return false;
    }

    // ── Check VM registry keys ──
    inline bool CheckVMRegistry() {
        HKEY hKey;
        const wchar_t* vmKeys[] = {
            L"SOFTWARE\\VMware, Inc.\\VMware Tools",
            L"SOFTWARE\\Oracle\\VirtualBox Guest Additions",
            L"SOFTWARE\\Citrix\\Xen",
            L"SYSTEM\\CurrentControlSet\\Services\\VBoxGuest",
            L"SYSTEM\\CurrentControlSet\\Services\\vmci",
            L"SYSTEM\\CurrentControlSet\\Services\\vmusrvc",
            L"SYSTEM\\CurrentControlSet\\Services\\vmsrvc"
        };

        for (auto key : vmKeys) {
            if (RegOpenKeyExW(HKEY_LOCAL_MACHINE, key, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return true;
            }
        }
        return false;
    }

    // ── Check VM-specific files ──
    inline bool CheckVMFiles() {
        const wchar_t* vmFiles[] = {
            L"C:\\Windows\\System32\\drivers\\vmmouse.sys",
            L"C:\\Windows\\System32\\drivers\\vmhgfs.sys",
            L"C:\\Windows\\System32\\drivers\\VBoxMouse.sys",
            L"C:\\Windows\\System32\\drivers\\VBoxGuest.sys",
            L"C:\\Windows\\System32\\drivers\\VBoxSF.sys",
            L"C:\\Windows\\System32\\drivers\\xenbus.sys",
            L"C:\\Windows\\System32\\drivers\\xennet.sys"
        };

        for (auto file : vmFiles) {
            if (GetFileAttributesW(file) != INVALID_FILE_ATTRIBUTES)
                return true;
        }
        return false;
    }

    // ── Check MAC address prefix for VMs ──
    inline bool CheckMacAddress() {
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD bufLen = sizeof(adapterInfo);
        if (GetAdaptersInfo(adapterInfo, &bufLen) != ERROR_SUCCESS) return false;

        for (PIP_ADAPTER_INFO pAdapter = adapterInfo; pAdapter; pAdapter = pAdapter->Next) {
            if (pAdapter->AddressLength < 3) continue;
            // VMware: 00:05:69, 00:0C:29, 00:1C:14, 00:50:56
            if (pAdapter->Address[0] == 0x00) {
                if (pAdapter->Address[1] == 0x05 && pAdapter->Address[2] == 0x69) return true;
                if (pAdapter->Address[1] == 0x0C && pAdapter->Address[2] == 0x29) return true;
                if (pAdapter->Address[1] == 0x1C && pAdapter->Address[2] == 0x14) return true;
                if (pAdapter->Address[1] == 0x50 && pAdapter->Address[2] == 0x56) return true;
                // VirtualBox: 08:00:27
                if (pAdapter->Address[1] == 0x00 && pAdapter->Address[2] == 0x27) return true;
                // Hyper-V: 00:15:5D
                if (pAdapter->Address[1] == 0x15 && pAdapter->Address[2] == 0x5D) return true;
            }
            // QEMU/KVM: 52:54:00
            if (pAdapter->Address[0] == 0x52 && pAdapter->Address[1] == 0x54 && pAdapter->Address[2] == 0x00) return true;
        }
        return false;
    }

    // ── Sandboxie detection ──
    inline bool CheckSandboxie() {
        // Check for Sandboxie DLL
        if (GetModuleHandleA(OBFUSCATE("SbieDll.dll"))) return true;
        if (GetModuleHandleA(OBFUSCATE("SbieSvc.exe"))) return true;

        // Check for Sandboxie driver
        HANDLE hDevice = CreateFileA(OBFUSCATE("\\\\.\\SbieDrv"),
            GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
        if (hDevice != INVALID_HANDLE_VALUE) {
            CloseHandle(hDevice);
            return true;
        }
        return false;
    }

    // ── Low resource environment (typical of sandboxes) ──
    inline bool CheckLowResources() {
        // Check RAM < 2GB
        MEMORYSTATUSEX mem = { sizeof(MEMORYSTATUSEX) };
        GlobalMemoryStatusEx(&mem);
        if (mem.ullTotalPhys < 2ull * 1024 * 1024 * 1024) return true;

        // Check CPU cores < 2
        SYSTEM_INFO si;
        GetSystemInfo(&si);
        if (si.dwNumberOfProcessors < 2) return true;

        // Check disk size < 80GB
        ULARGE_INTEGER freeBytes, totalBytes;
        if (GetDiskFreeSpaceExA("C:\\", &freeBytes, &totalBytes, nullptr)) {
            if (totalBytes.QuadPart < 80ull * 1024 * 1024 * 1024) return true;
        }

        return false;
    }

    // ── Mouse movement pattern (sandboxes have synthetic/no movement) ──
    inline bool CheckMouseMovement() {
        static bool firstCall = true;
        static POINT lastPos = {};

        if (firstCall) {
            GetCursorPos(&lastPos);
            firstCall = false;
            return false; // Can't determine on first call
        }

        POINT currentPos;
        GetCursorPos(&currentPos);

        // If cursor hasn't moved in the last check, might be sandbox
        static int stillCount = 0;
        if (currentPos.x == lastPos.x && currentPos.y == lastPos.y) {
            stillCount++;
            if (stillCount > 40) return true; // ~8 seconds without movement
        } else {
            stillCount = 0;
        }

        lastPos = currentPos;
        return false;
    }

    // ── Comprehensive VM check ──
    inline bool IsVirtualMachine() {
        bool detected = false;
        detected |= CpuIdHypervisorCheck();
        detected |= CheckVMProcesses();
        detected |= CheckVMRegistry();
        detected |= CheckVMFiles();
        detected |= CheckMacAddress();
        detected |= CheckSandboxie();
        detected |= CheckLowResources();

        return detected;
    }

    // ── Lightweight check (fast, no process enumeration) ──
    inline bool QuickVMCheck() {
        return CpuIdHypervisorCheck() || CheckLowResources() || CheckSandboxie();
    }

    // ── Continuous VM monitoring thread ──
    inline std::atomic<bool> g_vmMonitorRunning{ false };

    inline void MonitorThread() {
        while (g_vmMonitorRunning) {
            if (IsVirtualMachine()) {
                protection::self_destruct::Trigger(
                    protection::self_destruct::Reason::VirtualMachineDetected);
            }
            Sleep(3000); // Check every 3 seconds
        }
    }

    inline void StartMonitor() {
        if (g_vmMonitorRunning) return;
        g_vmMonitorRunning = true;
        std::thread(MonitorThread).detach();
    }

} // namespace protection::anti_vm
