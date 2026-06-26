//#include "FakeLag.h"
//#include <thread>
//#include <winsvc.h>
//#include <shellapi.h>
//
//// ✅ Auto request Admin rights (restart as admin)
//void RequestAdminRights() {
//    if (!IsUserAnAdmin()) {
//        char exePath[MAX_PATH];
//        GetModuleFileNameA(NULL, exePath, MAX_PATH);
//        ShellExecuteA(NULL, "runas", exePath, NULL, NULL, SW_SHOWNORMAL);
//        ExitProcess(0);
//    }
//}
//
//// ✅ Driver Install (Silent)
//bool InstallWinDivertDriver() {
//    SC_HANDLE scManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
//    if (!scManager) return false;
//
//    char currentDir[MAX_PATH];
//    GetCurrentDirectoryA(MAX_PATH, currentDir);
//    std::string driverPath = std::string(currentDir) + "\\WinDivert64.sys";
//
//    // Check if driver already installed
//    SC_HANDLE scService = OpenServiceA(scManager, "WinDivert", SERVICE_ALL_ACCESS);
//
//    if (!scService) {
//        // First time: Create service
//        scService = CreateServiceA(
//            scManager, "WinDivert", "WinDivert Driver",
//            SERVICE_ALL_ACCESS, SERVICE_KERNEL_DRIVER,
//            SERVICE_DEMAND_START, SERVICE_ERROR_NORMAL,
//            driverPath.c_str(), NULL, NULL, NULL, NULL, NULL
//        );
//    }
//
//    if (scService) {
//        // Start the driver
//        SERVICE_STATUS status;
//        QueryServiceStatus(scService, &status);
//        if (status.dwCurrentState != SERVICE_RUNNING) {
//            StartServiceA(scService, 0, NULL);
//        }
//        CloseServiceHandle(scService);
//        CloseServiceHandle(scManager);
//        return true;
//    }
//
//    CloseServiceHandle(scManager);
//    return false;
//}
//
//// ✅ Driver Uninstall
//void UninstallWinDivertDriver() {
//    SC_HANDLE scManager = OpenSCManager(NULL, NULL, SC_MANAGER_ALL_ACCESS);
//    if (scManager) {
//        SC_HANDLE scService = OpenServiceA(scManager, "WinDivert", SERVICE_ALL_ACCESS | DELETE);
//        if (scService) {
//            SERVICE_STATUS status;
//            ControlService(scService, SERVICE_CONTROL_STOP, &status);
//            DeleteService(scService);
//            CloseServiceHandle(scService);
//        }
//        CloseServiceHandle(scManager);
//    }
//}
//
//// ✅ Admin Check
//bool IsUserAnAdmin() {
//    BOOL isAdmin = FALSE;
//    SID_IDENTIFIER_AUTHORITY NtAuthority = SECURITY_NT_AUTHORITY;
//    PSID AdministratorsGroup;
//
//    if (AllocateAndInitializeSid(&NtAuthority, 2, SECURITY_BUILTIN_DOMAIN_RID,
//        DOMAIN_ALIAS_RID_ADMINS, 0, 0, 0, 0, 0, 0, &AdministratorsGroup)) {
//        CheckTokenMembership(NULL, AdministratorsGroup, &isAdmin);
//        FreeSid(AdministratorsGroup);
//    }
//    return isAdmin;
//}
//
//// ✅ Extract files check
//void FakeLagExtractFiles() {
//    if (GetFileAttributesA("WinDivert.dll") == INVALID_FILE_ATTRIBUTES) {
//        fake_lag_error = "WinDivert.dll not found!";
//        return;
//    }
//    if (GetFileAttributesA("WinDivert64.sys") == INVALID_FILE_ATTRIBUTES) {
//        fake_lag_error = "WinDivert64.sys not found!";
//        return;
//    }
//    fake_lag_error = "";
//}
//
//// ✅ Start Fake Lag
//bool FakeLagStart() {
//    if (fake_lag_running) return true;
//
//    // Auto request Admin if not admin
//    if (!IsUserAnAdmin()) {
//        RequestAdminRights();
//        return false;
//    }
//
//    // Silent driver install
//    if (!InstallWinDivertDriver()) {
//        fake_lag_error = "Driver install failed!";
//        return false;
//    }
//
//    // Check files
//    FakeLagExtractFiles();
//    if (!fake_lag_error.empty()) return false;
//
//    // Start WinDivert
//    const char* filter = "inbound and udp.PayloadLength >= 25";
//    fake_lag_handle = WinDivertOpen(filter, WINDIVERT_LAYER_NETWORK, 0, 0);
//
//    if (fake_lag_handle == INVALID_HANDLE_VALUE || fake_lag_handle == NULL) {
//        fake_lag_error = "WinDivertOpen failed!";
//        return false;
//    }
//
//    fake_lag_running = true;
//    fake_lag_driver_loaded = true;
//
//    fake_lag_thread = new std::thread([]() {
//        char packet[65535];
//        UINT packetLen;
//        WINDIVERT_ADDRESS addr;
//
//        while (fake_lag_running) {
//            if (WinDivertRecv(fake_lag_handle, packet, sizeof(packet), &packetLen, &addr)) {
//                if (fake_lag_freeze_active) {
//                    continue;  // Packet HOLD = LAG
//                }
//                WinDivertHelperCalcChecksums(packet, packetLen, &addr, 0);
//                WinDivertSend(fake_lag_handle, packet, packetLen, NULL, &addr);
//            }
//        }
//        });
//
//    return true;
//}
//
//// ✅ Stop Fake Lag
//void FakeLagStop() {
//    fake_lag_running = false;
//
//    if (fake_lag_thread) {
//        fake_lag_thread->join();
//        delete fake_lag_thread;
//        fake_lag_thread = nullptr;
//    }
//
//    if (fake_lag_handle) {
//        WinDivertClose(fake_lag_handle);
//        fake_lag_handle = NULL;
//    }
//
//    UninstallWinDivertDriver();
//
//    fake_lag_driver_loaded = false;
//    fake_lag_freeze_active = false;
//    fake_lag_aim_lag_active = false;
//}
//
//// ✅ Toggle AimLag
//void FakeLagToggleAimLag() {
//    fake_lag_aim_lag_active = !fake_lag_aim_lag_active;
//    if (!fake_lag_aim_lag_active) {
//        fake_lag_freeze_active = false;
//    }
//}
//
//// ✅ Set Freeze state
//void FakeLagSetFreeze(bool freeze) {
//    fake_lag_freeze_active = freeze;
//}