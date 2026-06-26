#pragma once
#include <windows.h>
#include <cstdint>
#include <string>

// ── Self-Destruct: Secure data wipe and process termination ──

namespace protection::self_destruct {

    // ── Reasons for self-destruct trigger ──
    enum class Reason : uint32_t {
        DebuggerDetected = 0,
        TamperDetected,
        VirtualMachineDetected,
        ProcessPatched,
        IntegrityViolation,
        ManualTrigger
    };

    // ── Memory wiping strategies ──
    enum class WipeLevel : uint32_t {
        None       = 0,
        Quick      = 1,  // Single pass of zeros
        Normal     = 2,  // Zeros then ones
        Secure     = 3,  // Three passes (zeros, ones, random)
        Paranoid   = 4   // Seven passes with crypto random
    };

    static WipeLevel g_wipeLevel = WipeLevel::Secure;
    static bool g_selfDestructArmed = false;
    static std::string g_destructMessage;

    // ── Set wipe level ──
    inline void SetWipeLevel(WipeLevel level) {
        g_wipeLevel = level;
    }

    // ── Wipe a memory buffer ──
    inline void WipeMemory(void* buffer, size_t size, WipeLevel level = g_wipeLevel) {
        if (!buffer || !size) return;

        volatile uint8_t* ptr = static_cast<volatile uint8_t*>(buffer);

        switch (level) {
            case WipeLevel::Quick:
                for (size_t i = 0; i < size; i++) ptr[i] = 0;
                break;

            case WipeLevel::Normal:
                for (size_t i = 0; i < size; i++) ptr[i] = 0;
                for (size_t i = 0; i < size; i++) ptr[i] = 0xFF;
                break;

            case WipeLevel::Secure:
                for (size_t i = 0; i < size; i++) ptr[i] = 0;
                for (size_t i = 0; i < size; i++) ptr[i] = 0xFF;
                for (size_t i = 0; i < size; i++) ptr[i] = static_cast<uint8_t>(rand());
                break;

            case WipeLevel::Paranoid:
                for (int pass = 0; pass < 7; pass++) {
                    uint8_t pattern = (pass == 0) ? 0x00 :
                                      (pass == 1) ? 0xFF :
                                      (pass == 2) ? 0x55 :
                                      (pass == 3) ? 0xAA :
                                      (pass == 4) ? 0xCC :
                                      (pass == 5) ? 0x33 :
                                      static_cast<uint8_t>(rand());
                    for (size_t i = 0; i < size; i++) ptr[i] = pattern;
                }
                break;

            default:
                break;
        }

        // Prevent compiler from optimizing away the wipe
        MemoryBarrier();
    }

    // ── Wipe a string ──
    inline void WipeString(std::string& str) {
        if (!str.empty()) {
            WipeMemory(&str[0], str.size());
            str.clear();
        }
    }

    // ── Wipe a wide string ──
    inline void WipeString(std::wstring& str) {
        if (!str.empty()) {
            WipeMemory(&str[0], str.size() * sizeof(wchar_t));
            str.clear();
        }
    }

    // ── Delete evidence files ──
    inline void DeleteEvidence(const wchar_t* path = nullptr) {
        if (path) {
            // Secure delete: overwrite then delete
            HANDLE hFile = CreateFileW(path, GENERIC_WRITE, 0, nullptr,
                OPEN_EXISTING, FILE_FLAG_WRITE_THROUGH, nullptr);
            if (hFile != INVALID_HANDLE_VALUE) {
                LARGE_INTEGER fileSize;
                if (GetFileSizeEx(hFile, &fileSize)) {
                    // Overwrite with random data
                    const size_t blockSize = 4096;
                    uint8_t* block = new uint8_t[blockSize];
                    for (LONGLONG i = 0; i < fileSize.QuadPart; i += blockSize) {
                        for (size_t j = 0; j < blockSize; j++)
                            block[j] = static_cast<uint8_t>(rand());
                        DWORD written;
                        WriteFile(hFile, block, blockSize, &written, nullptr);
                    }
                    delete[] block;
                }
                CloseHandle(hFile);

                // Set file to delete on next reboot
                MoveFileExW(path, nullptr, MOVEFILE_DELAY_UNTIL_REBOOT);
                DeleteFileW(path);
            }
        } else {
            // Delete self
            wchar_t modulePath[MAX_PATH];
            if (GetModuleFileNameW(nullptr, modulePath, MAX_PATH)) {
                // Can't delete a running executable directly
                // Mark for deletion on next reboot
                MoveFileExW(modulePath, nullptr, MOVEFILE_DELAY_UNTIL_REBOOT);
            }
        }
    }

    // ── Arm the self-destruct ──
    inline void Arm(const std::string& message = "Self-destruct initiated") {
        g_selfDestructArmed = true;
        g_destructMessage = message;

        // Set a termination handler
        SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX);
    }

    // ── Trigger self-destruct from detection events ──
    inline void Trigger(Reason reason) {
        std::string msg;
        switch (reason) {
            case Reason::DebuggerDetected:       msg = "Debugger detected"; break;
            case Reason::TamperDetected:         msg = "Code tampering detected"; break;
            case Reason::VirtualMachineDetected: msg = "Virtual machine detected"; break;
            case Reason::ProcessPatched:         msg = "Process patching detected"; break;
            case Reason::IntegrityViolation:     msg = "Integrity violation"; break;
            case Reason::ManualTrigger:          msg = "Manual trigger"; break;
        }
        Arm(msg);
        Execute();
    }

    // ── Execute self-destruct ──
    inline __declspec(noreturn) void Execute() {
        if (!g_selfDestructArmed) {
            // Not armed, just exit
            TerminateProcess(GetCurrentProcess(), 0);
        }

        // 1. Wipe all sensitive data
        // In production: iterate over global data structures and wipe them
        // For now: clear the destruct message
        WipeString(g_destructMessage);

        // 2. Delete evidence files
        DeleteEvidence(nullptr);

        // 3. Generate a hard error to prevent clean debugging
        ULONG_PTR args[4] = {};
        ULONG response = 0;

        // Try to use NtRaiseHardError for a harder crash
        HMODULE ntdll = GetModuleHandleW(L"ntdll.dll");
        if (ntdll) {
            using NtRaiseHardErrorFn = NTSTATUS(NTAPI*)(NTSTATUS, ULONG, ULONG, ULONG_PTR*, ULONG, PULONG);
            auto NtRaiseHardError = reinterpret_cast<NtRaiseHardErrorFn>(
                GetProcAddress(ntdll, "NtRaiseHardError"));
            if (NtRaiseHardError) {
                NtRaiseHardError(0xC0000350L, 0, 0, nullptr, 6, &response);
            }
        }

        // 4. Terminate (should not reach here if NtRaiseHardError worked)
        TerminateProcess(GetCurrentProcess(), 0xDEAD);
        __assume(0);
    }

    // ── Emergency shutdown (no cleanup) ──
    inline __declspec(noreturn) void EmergencyExit(int code = 0) {
        TerminateProcess(GetCurrentProcess(), code);
        __assume(0);
    }

} // namespace protection::self_destruct
