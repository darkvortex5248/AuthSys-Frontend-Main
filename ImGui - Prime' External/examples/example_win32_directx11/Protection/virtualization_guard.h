#pragma once
#include <windows.h>
#include <cstdint>
#include <string>

// ── Virtualization Guard: VBS/HVCI state, TPM, secure boot checks ──

namespace protection::vguard {

    // ── Check if Hypervisor-protected Code Integrity (HVCI) is enabled ──
    inline bool IsHvciEnabled() {
        HKEY hKey;
        DWORD value = 0;
        DWORD size = sizeof(value);

        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Control\\DeviceGuard",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegQueryValueExA(hKey, "HypervisorEnforcedCodeIntegrity", nullptr,
                nullptr, reinterpret_cast<LPBYTE>(&value), &size);
            RegCloseKey(hKey);
        }

        return value == 1;
    }

    // ── Check if Virtualization-Based Security (VBS) is enabled ──
    inline bool IsVbsEnabled() {
        HKEY hKey;
        DWORD value = 0;
        DWORD size = sizeof(value);

        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Control\\DeviceGuard",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegQueryValueExA(hKey, "Enabled", nullptr,
                nullptr, reinterpret_cast<LPBYTE>(&value), &size);
            RegCloseKey(hKey);
        }

        return value == 1;
    }

    // ── Check if Secure Boot is enabled ──
    inline bool IsSecureBootEnabled() {
        HKEY hKey;
        DWORD value = 0;
        DWORD size = sizeof(value);

        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Control\\SecureBoot\\State",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegQueryValueExA(hKey, "UEFISecureBootEnabled", nullptr,
                nullptr, reinterpret_cast<LPBYTE>(&value), &size);
            RegCloseKey(hKey);
        }

        return value == 1;
    }

    // ── Check TPM presence ──
    inline bool IsTpmPresent() {
        HKEY hKey;
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Services\\Tpm",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return true;
        }
        return false;
    }

    // ── Get TPM version string ──
    inline std::string GetTpmVersion() {
        HKEY hKey;
        char version[64] = {};

        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Services\\Tpm\\Parameters",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            DWORD size = sizeof(version);
            RegQueryValueExA(hKey, "TPMVersion", nullptr,
                nullptr, reinterpret_cast<LPBYTE>(version), &size);
            RegCloseKey(hKey);
        }

        return std::string(version);
    }

    // ── Check if running inside a Windows Sandbox ──
    inline bool IsWindowsSandbox() {
        // Windows Sandbox has specific characteristics
        HMODULE hMod = GetModuleHandleW(L"sbi.dll");
        if (hMod) return true;

        // Check for sandbox-specific registry keys
        HKEY hKey;
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Services\\sbi",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return true;
        }

        return false;
    }

    // ── Full virtualization guard report ──
    inline std::string GetReport() {
        std::string report;
        report += "HVCI Enabled: " + std::string(IsHvciEnabled() ? "Yes" : "No") + "\n";
        report += "VBS Enabled: " + std::string(IsVbsEnabled() ? "Yes" : "No") + "\n";
        report += "Secure Boot: " + std::string(IsSecureBootEnabled() ? "Yes" : "No") + "\n";
        report += "TPM Present: " + std::string(IsTpmPresent() ? "Yes" : "No") + "\n";
        if (IsTpmPresent())
            report += "TPM Version: " + GetTpmVersion() + "\n";
        report += "Windows Sandbox: " + std::string(IsWindowsSandbox() ? "Yes" : "No") + "\n";
        return report;
    }

} // namespace protection::vguard
