#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <array>
#include <vector>
#include <sstream>
#include <iomanip>
#include <intrin.h>
#include <iphlpapi.h>
#include <winternl.h>

#include "integrity_check.h"

#pragma comment(lib, "iphlpapi.lib")

// ── Hardware ID System: CPU, disk, MAC, motherboard fingerprinting ──

namespace protection::hwid {

    // ── CPUID vendor string ──
    inline std::string GetCpuVendor() {
        int info[4] = {};
        __cpuid(info, 0);
        char vendor[13] = {};
        memcpy(vendor, &info[1], 4);
        memcpy(vendor + 4, &info[3], 4);
        memcpy(vendor + 8, &info[2], 4);
        return std::string(vendor);
    }

    // ── CPUID brand string ──
    inline std::string GetCpuBrand() {
        int info[4] = {};
        char brand[49] = {};
        __cpuid(info, 0x80000002);
        memcpy(brand, info, 16);
        __cpuid(info, 0x80000003);
        memcpy(brand + 16, info, 16);
        __cpuid(info, 0x80000004);
        memcpy(brand + 32, info, 16);
        return std::string(brand);
    }

    // ── CPU unique ID (combination of features + serial) ──
    inline std::string GetCpuId() {
        int info[4] = {};
        __cpuid(info, 1);
        uint32_t eax = info[0]; // Stepping, Model, Family, Type
        uint32_t edx = info[3]; // Features
        uint32_t ecx = info[2]; // Features

        std::stringstream ss;
        ss << std::hex << std::uppercase
           << (eax & 0xFFF) << "-"
           << ((eax >> 20) & 0xFF) << "-"
           << (edx & 0xFFFF) << "-"
           << (ecx & 0xFFFF);
        return ss.str();
    }

    // ── Get disk drive serial number ──
    inline std::string GetDiskSerial() {
        char volumeName[MAX_PATH];
        DWORD serialNumber, maxComponentLen, fileSystemFlags;
        char fileSystemName[MAX_PATH];

        if (!GetVolumeInformationA("C:\\", volumeName, MAX_PATH,
                &serialNumber, &maxComponentLen, &fileSystemFlags,
                fileSystemName, MAX_PATH)) {
            return "0000-0000";
        }

        std::stringstream ss;
        ss << std::hex << std::uppercase << std::setw(4) << std::setfill('0')
           << (serialNumber >> 16) << "-"
           << std::setw(4) << std::setfill('0')
           << (serialNumber & 0xFFFF);
        return ss.str();
    }

    // ── Get physical disk serial (via Win32 API) ──
    inline std::string GetPhysicalDiskSerial() {
        HANDLE hDrive = CreateFileA("\\\\.\\PhysicalDrive0",
            GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
            NULL, OPEN_EXISTING, 0, NULL);
        if (hDrive == INVALID_HANDLE_VALUE) return "N/A";

        // STORAGE_PROPERTY_QUERY for serial
        STORAGE_PROPERTY_QUERY query = {};
        query.PropertyId = StorageDeviceProperty;
        query.QueryType = PropertyStandardQuery;

        char buffer[1024] = {};
        DWORD bytesReturned = 0;

        if (DeviceIoControl(hDrive, IOCTL_STORAGE_QUERY_PROPERTY,
                &query, sizeof(query), buffer, sizeof(buffer),
                &bytesReturned, NULL)) {
            STORAGE_DEVICE_DESCRIPTOR* desc = (STORAGE_DEVICE_DESCRIPTOR*)buffer;
            if (desc->SerialNumberOffset) {
                char* serial = buffer + desc->SerialNumberOffset;
                CloseHandle(hDrive);
                return std::string(serial);
            }
        }
        CloseHandle(hDrive);
        return "N/A";
    }

    // ── Get MAC address ──
    inline std::string GetMacAddress() {
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD bufLen = sizeof(adapterInfo);
        if (GetAdaptersInfo(adapterInfo, &bufLen) != ERROR_SUCCESS)
            return "00-00-00-00-00-00";

        for (PIP_ADAPTER_INFO pAdapter = adapterInfo; pAdapter; pAdapter = pAdapter->Next) {
            if (pAdapter->AddressLength >= 6 &&
                pAdapter->Type != MIB_IF_TYPE_LOOPBACK &&
                (pAdapter->DhcpEnabled || true)) { // Take first physical adapter
                std::stringstream ss;
                for (UINT i = 0; i < pAdapter->AddressLength; i++) {
                    if (i > 0) ss << "-";
                    ss << std::hex << std::uppercase << std::setw(2) << std::setfill('0')
                       << (int)pAdapter->Address[i];
                }
                return ss.str();
            }
        }
        return "00-00-00-00-00-00";
    }

    // ── Get motherboard serial (via WMI) ──
    // Uses a simplified COM-less approach reading from registry
    inline std::string GetMotherboardSerial() {
        HKEY hKey;
        // Some systems store baseboard info here
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "HARDWARE\\DESCRIPTION\\System\\BIOS",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            char serial[256] = {};
            DWORD size = sizeof(serial);
            if (RegQueryValueExA(hKey, "BaseBoardSerial", NULL, NULL,
                    (LPBYTE)serial, &size) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return std::string(serial);
            }
            RegCloseKey(hKey);
        }
        return "N/A";
    }

    // ── Get computer name ──
    inline std::string GetComputerName() {
        char name[MAX_COMPUTERNAME_LENGTH + 1] = {};
        DWORD size = sizeof(name);
        GetComputerNameA(name, &size);
        return std::string(name);
    }

    // ── Get Windows product ID ──
    inline std::string GetWindowsProductId() {
        HKEY hKey;
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
                0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            char productId[256] = {};
            DWORD size = sizeof(productId);
            if (RegQueryValueExA(hKey, "ProductId", NULL, NULL,
                    (LPBYTE)productId, &size) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return std::string(productId);
            }
            RegCloseKey(hKey);
        }
        return "N/A";
    }

    // ── Generate a secure hardware fingerprint ──
    inline std::string GenerateFingerprint() {
        std::string data;
        data += GetCpuId();
        data += "|";
        data += GetDiskSerial();
        data += "|";
        data += GetMacAddress();
        data += "|";
        data += GetMotherboardSerial();
        data += "|";
        data += GetWindowsProductId();

        // Hash the combined data to create a fixed-length fingerprint
        integrity::SHA256 sha;
        sha.Update(reinterpret_cast<const uint8_t*>(data.data()), data.size());
        auto hash = sha.Final();
        return integrity::SHA256::HexString(hash);
    }

    // ── Compare HWID with expected value ──
    inline bool ValidateHwid(const std::string& expectedFingerprint) {
        std::string current = GenerateFingerprint();

        // Constant-time comparison to prevent timing attacks
        if (current.size() != expectedFingerprint.size()) return false;

        volatile int result = 0;
        for (size_t i = 0; i < current.size(); i++)
            result |= (current[i] ^ expectedFingerprint[i]);

        return result == 0;
    }

    // ── Get component info as readable string ──
    inline std::string GetHwidReport() {
        std::string report;
        report += "CPU: " + GetCpuBrand() + "\n";
        report += "CPU ID: " + GetCpuId() + "\n";
        report += "Disk Serial: " + GetDiskSerial() + "\n";
        report += "Disk (Phys): " + GetPhysicalDiskSerial() + "\n";
        report += "MAC: " + GetMacAddress() + "\n";
        report += "Motherboard: " + GetMotherboardSerial() + "\n";
        report += "Computer: " + GetComputerName() + "\n";
        report += "Windows PID: " + GetWindowsProductId() + "\n";
        report += "Fingerprint: " + GenerateFingerprint() + "\n";
        return report;
    }

} // namespace protection::hwid
