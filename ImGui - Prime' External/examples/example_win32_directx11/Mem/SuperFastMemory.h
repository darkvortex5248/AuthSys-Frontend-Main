#pragma once
#include <Windows.h>
#include <vector>
#include <string>
#include <iostream>
#include <TlHelp32.h>
#include <tchar.h>
#include <winternl.h>
#include <mutex>
#include <future>
#include <map>
#include <unordered_map>

#pragma comment(lib, "ntdll.lib")

// Direct NT syscalls for maximum speed
extern "C" NTSTATUS NTAPI NtReadVirtualMemory(HANDLE ProcessHandle, PVOID BaseAddress, PVOID Buffer, SIZE_T NumberOfBytesToRead, PSIZE_T NumberOfBytesRead);
extern "C" NTSTATUS NTAPI NtWriteVirtualMemory(HANDLE ProcessHandle, PVOID BaseAddress, PVOID Buffer, SIZE_T NumberOfBytesToWrite, PSIZE_T NumberOfBytesWritten);
extern "C" NTSTATUS NTAPI NtProtectVirtualMemory(HANDLE ProcessHandle, PVOID* BaseAddress, PSIZE_T NumberOfBytesToProtect, ULONG NewAccessProtection, PULONG OldAccessProtection);

class SuperFastMemory
{
public:
    DWORD ProcessId = 0;
    HANDLE ProcessHandle = nullptr;
    bool IsAttached = false;

    typedef struct _MEMORY_REGION {
        DWORD_PTR dwBaseAddr;
        DWORD_PTR dwMemorySize;
    } MEMORY_REGION;

    // ⚡ Super fast process finder (cached)
    static int GetPid(const char* procname)
    {
        if (procname == NULL) return 0;

        static std::unordered_map<std::string, DWORD> pidCache;
        static DWORD lastCacheTime = 0;
        DWORD now = GetTickCount();

        // Cache for 2 seconds (faster than scanning every time)
        if (pidCache.find(procname) != pidCache.end() && (now - lastCacheTime) < 2000) {
            return pidCache[procname];
        }

        DWORD pid = 0;
        HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnap != INVALID_HANDLE_VALUE) {
            PROCESSENTRY32 pe = { sizeof(PROCESSENTRY32) };
            if (Process32First(hSnap, &pe)) {
                do {
                    if (_stricmp(pe.szExeFile, procname) == 0) {
                        pid = pe.th32ProcessID;
                        break;
                    }
                } while (Process32Next(hSnap, &pe));
            }
            CloseHandle(hSnap);
        }

        if (pid != 0) {
            pidCache[procname] = pid;
            lastCacheTime = now;
        }

        return pid;
    }

    // ⚡ Fast emulator detection (cached)
    const char* GetEmulatorRunning()
    {
        static const char* cachedEmulator = nullptr;
        static DWORD lastCheck = 0;

        if (cachedEmulator != nullptr && (GetTickCount() - lastCheck) < 3000) {
            return cachedEmulator;
        }

        const char* emulators[] = { "HD-Player.exe", "LdVBoxHeadless.exe", "MEmuHeadless.exe",
                                     "AndroidProcess.exe", "aow_exe.exe", "NoxVMHandle.exe" };

        for (const char* emu : emulators) {
            if (GetPid(emu) != 0) {
                cachedEmulator = emu;
                lastCheck = GetTickCount();
                return emu;
            }
        }

        return nullptr;
    }

    // ⚡ Ultra fast attach (reuses handle if already open)
    BOOL AttackProcess(const char* procname)
    {
        // If already attached to same process, just return true
        if (IsAttached && ProcessHandle != nullptr && ProcessHandle != INVALID_HANDLE_VALUE) {
            DWORD exitCode;
            if (GetExitCodeProcess(ProcessHandle, &exitCode) && exitCode == STILL_ACTIVE) {
                return TRUE;
            }
        }

        // Close old handle if exists
        if (ProcessHandle != nullptr && ProcessHandle != INVALID_HANDLE_VALUE) {
            CloseHandle(ProcessHandle);
            ProcessHandle = nullptr;
        }

        const char* emulator = GetEmulatorRunning();
        if (emulator == nullptr) return FALSE;

        DWORD p_id = GetPid(emulator);
        if (p_id == 0) return FALSE;

        ProcessId = p_id;
        // Open with minimum required access for speed
        ProcessHandle = OpenProcess(PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION, FALSE, ProcessId);
        IsAttached = (ProcessHandle != nullptr && ProcessHandle != INVALID_HANDLE_VALUE);

        return IsAttached;
    }

    // ⚡ Super fast read using NT syscall
    bool ReadFast(LPCVOID address, LPVOID buffer, SIZE_T size)
    {
        if (!IsAttached || ProcessHandle == nullptr) return false;
        SIZE_T bytesRead = 0;
        return NtReadVirtualMemory(ProcessHandle, (PVOID)address, buffer, size, &bytesRead) == 0 && bytesRead == size;
    }

    // ⚡ Super fast write using NT syscall
    bool WriteFast(LPVOID address, LPCVOID buffer, SIZE_T size)
    {
        if (!IsAttached || ProcessHandle == nullptr) return false;
        SIZE_T bytesWritten = 0;
        return NtWriteVirtualMemory(ProcessHandle, address, (PVOID)buffer, size, &bytesWritten) == 0 && bytesWritten == size;
    }

    // ⚡ Fast swap two values (single operation)
    bool SwapValues(DWORD_PTR addr1, DWORD_PTR addr2, int offset1 = 0, int offset2 = 0)
    {
        int val1, val2;

        if (!ReadFast((LPCVOID)(addr1 + offset1), &val1, sizeof(int))) return false;
        if (!ReadFast((LPCVOID)(addr2 + offset2), &val2, sizeof(int))) return false;
        if (!WriteFast((LPVOID)(addr1 + offset1), &val2, sizeof(int))) return false;
        if (!WriteFast((LPVOID)(addr2 + offset2), &val1, sizeof(int))) return false;

        return true;
    }

    // ⚡ Batch read multiple addresses at once
    bool BatchRead(std::vector<DWORD_PTR> addresses, std::vector<int>& values, int offset = 0)
    {
        values.resize(addresses.size());
        for (size_t i = 0; i < addresses.size(); i++) {
            if (!ReadFast((LPCVOID)(addresses[i] + offset), &values[i], sizeof(int))) {
                return false;
            }
        }
        return true;
    }

    // ⚡ Batch write multiple addresses at once
    bool BatchWrite(std::vector<DWORD_PTR> addresses, std::vector<int>& values, int offset = 0)
    {
        for (size_t i = 0; i < addresses.size(); i++) {
            if (!WriteFast((LPVOID)(addresses[i] + offset), &values[i], sizeof(int))) {
                return false;
            }
        }
        return true;
    }

    // ⚡ Fast pattern scanning with caching
    std::vector<DWORD_PTR> cachedPatterns;
    std::string lastPattern;

    bool FindPattern(DWORD_PTR StartRange, DWORD_PTR EndRange, BYTE* SearchBytes, std::vector<DWORD_PTR>& AddressRet, bool useCache = true)
    {
        // Check cache first
        std::string patternKey = std::to_string((DWORD_PTR)SearchBytes);
        if (useCache && lastPattern == patternKey && !cachedPatterns.empty()) {
            AddressRet = cachedPatterns;
            return true;
        }

        AddressRet.clear();

        if (!IsAttached || ProcessHandle == nullptr) {
            if (!AttackProcess(GetEmulatorRunning())) return false;
        }

        MEMORY_BASIC_INFORMATION mbi;
        DWORD_PTR dwAddress = StartRange;
        DWORD_PTR nSearchSize = _msize(SearchBytes);

        std::vector<MEMORY_REGION> regions;

        // Collect memory regions (optimized)
        while (VirtualQueryEx(ProcessHandle, (LPCVOID)dwAddress, &mbi, sizeof(mbi)) &&
            (dwAddress < EndRange) && ((dwAddress + mbi.RegionSize) > dwAddress)) {
            if ((mbi.State == MEM_COMMIT) && ((mbi.Protect & PAGE_GUARD) == 0) &&
                (mbi.Protect != PAGE_NOACCESS) && ((mbi.AllocationProtect & PAGE_NOCACHE) != PAGE_NOCACHE)) {
                regions.push_back({ (DWORD_PTR)mbi.BaseAddress, mbi.RegionSize });
            }
            dwAddress = (DWORD_PTR)mbi.BaseAddress + mbi.RegionSize;
        }

        // Parallel search using async
        std::mutex mtx;
        std::vector<std::future<void>> futures;

        for (const auto& region : regions) {
            futures.push_back(std::async(std::launch::async, [&, region]() {
                BYTE* buffer = new BYTE[region.dwMemorySize];
                SIZE_T bytesRead = 0;

                if (NtReadVirtualMemory(ProcessHandle, (PVOID)region.dwBaseAddr, buffer, region.dwMemorySize, &bytesRead) == 0 && bytesRead > 0) {
                    DWORD_PTR offset = 0;
                    int found = Memfind(buffer, bytesRead, SearchBytes, nSearchSize);

                    while (found != -1) {
                        offset += found;
                        std::lock_guard<std::mutex> lock(mtx);
                        AddressRet.push_back(offset + region.dwBaseAddr);
                        offset += nSearchSize;
                        found = Memfind(buffer + offset, bytesRead - offset - nSearchSize, SearchBytes, nSearchSize);
                    }
                }

                delete[] buffer;
                }));
        }

        for (auto& fut : futures) {
            fut.wait();
        }

        // Cache the results
        if (useCache && !AddressRet.empty()) {
            cachedPatterns = AddressRet;
            lastPattern = patternKey;
        }

        return !AddressRet.empty();
    }

    // ⚡ Fast Memfind with optimization
    int Memfind(BYTE* buffer, DWORD_PTR dwBufferSize, BYTE* bstr, DWORD_PTR dwStrLen)
    {
        if (dwBufferSize < dwStrLen) return -1;

        for (DWORD_PTR i = 0; i <= dwBufferSize - dwStrLen; i++) {
            bool found = true;
            for (DWORD_PTR j = 0; j < dwStrLen; j++) {
                if (bstr[j] != '?' && buffer[i + j] != bstr[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return -1;
    }

    // ⚡ Fast replace pattern (with protection change)
    bool ReplacePattern(DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* SearchAob, BYTE* ReplaceAob)
    {
        int RepByteSize = _msize(ReplaceAob);
        if (RepByteSize <= 0) return false;

        std::vector<DWORD_PTR> addresses;
        if (!FindPattern(dwStartRange, dwEndRange, SearchAob, addresses)) return false;

        for (auto addr : addresses) {
            SIZE_T protectSize = RepByteSize;
            PVOID pAddr = (PVOID)addr;
            ULONG oldProtect = 0;

            // Change protection
            if (NtProtectVirtualMemory(ProcessHandle, &pAddr, &protectSize, PAGE_EXECUTE_READWRITE, &oldProtect) == 0) {
                // Write using NT syscall
                SIZE_T written = 0;
                NtWriteVirtualMemory(ProcessHandle, (PVOID)addr, ReplaceAob, RepByteSize, &written);

                // Restore protection
                protectSize = RepByteSize;
                NtProtectVirtualMemory(ProcessHandle, &pAddr, &protectSize, oldProtect, &oldProtect);
            }
        }

        return true;
    }

    // ⚡ Clean up
    void Detach()
    {
        if (ProcessHandle != nullptr && ProcessHandle != INVALID_HANDLE_VALUE) {
            CloseHandle(ProcessHandle);
            ProcessHandle = nullptr;
        }
        IsAttached = false;
    }

    ~SuperFastMemory()
    {
        Detach();
    }
};