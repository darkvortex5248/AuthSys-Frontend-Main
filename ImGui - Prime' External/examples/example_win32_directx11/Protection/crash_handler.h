#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <fstream>
#include <ctime>
#include <vector>

// ── Crash Handler: SEH, VEH, minidump generation ──

namespace protection::crash {

    // ── Global crash state ──
    struct CrashReport {
        uint64_t exceptionCode;
        uint64_t exceptionAddress;
        uint64_t exceptionFlags;
        uint64_t contextRip;
        uint64_t contextRsp;
        uint64_t contextRbp;
        uint64_t contextRax;
        uint64_t contextRbx;
        uint64_t contextRcx;
        uint64_t contextRdx;
        DWORD    threadId;
        DWORD    processId;
        time_t   timestamp;
        char     moduleName[256];
    };

    static CrashReport g_lastCrash = {};
    static PVOID g_vehHandle = nullptr;
    static bool g_crashHandlerInitialized = false;

    // ── Exception filter for __try/__except ──
    inline LONG WINAPI TopLevelExceptionFilter(_EXCEPTION_POINTERS* ExceptionInfo) {
        if (!ExceptionInfo) return EXCEPTION_CONTINUE_SEARCH;

        g_lastCrash.exceptionCode     = ExceptionInfo->ExceptionRecord->ExceptionCode;
        g_lastCrash.exceptionAddress  = reinterpret_cast<uint64_t>(ExceptionInfo->ExceptionRecord->ExceptionAddress);
        g_lastCrash.exceptionFlags    = ExceptionInfo->ExceptionRecord->ExceptionFlags;
        g_lastCrash.contextRip        = ExceptionInfo->ContextRecord->Rip;
        g_lastCrash.contextRsp        = ExceptionInfo->ContextRecord->Rsp;
        g_lastCrash.contextRbp        = ExceptionInfo->ContextRecord->Rbp;
        g_lastCrash.contextRax        = ExceptionInfo->ContextRecord->Rax;
        g_lastCrash.contextRbx        = ExceptionInfo->ContextRecord->Rbx;
        g_lastCrash.contextRcx        = ExceptionInfo->ContextRecord->Rcx;
        g_lastCrash.contextRdx        = ExceptionInfo->ContextRecord->Rdx;
        g_lastCrash.threadId          = GetCurrentThreadId();
        g_lastCrash.processId         = GetCurrentProcessId();
        g_lastCrash.timestamp         = time(nullptr);

        HMODULE hMod = nullptr;
        GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
            GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
            reinterpret_cast<LPCWSTR>(ExceptionInfo->ExceptionRecord->ExceptionAddress), &hMod);
        if (hMod) {
            GetModuleFileNameA(hMod, g_lastCrash.moduleName, sizeof(g_lastCrash.moduleName));
        } else {
            strcpy_s(g_lastCrash.moduleName, "unknown");
        }

        // Try to prevent the crash from taking down the process
        // Return EXCEPTION_CONTINUE_EXECUTION to retry (may cause infinite loop)
        return EXCEPTION_EXECUTE_HANDLER;
    }

    // ── VEH handler ──
    static LONG CALLBACK VectoredExceptionHandler(_EXCEPTION_POINTERS* ExceptionInfo) {
        if (!ExceptionInfo) return EXCEPTION_CONTINUE_SEARCH;

        // Call the common handler
        TopLevelExceptionFilter(ExceptionInfo);

        // For certain codes, try to fix up and continue
        DWORD code = ExceptionInfo->ExceptionRecord->ExceptionCode;
        if (code == EXCEPTION_ACCESS_VIOLATION || code == EXCEPTION_STACK_OVERFLOW) {
            return EXCEPTION_CONTINUE_SEARCH;
        }

        return EXCEPTION_CONTINUE_EXECUTION;
    }

    // ── Write crash report to disk ──
    inline bool WriteCrashReport(const wchar_t* path = L"crash_report.txt") {
        std::ofstream file(path);
        if (!file.is_open()) return false;

        char timeStr[64];
        struct tm timeinfo;
        localtime_s(&timeinfo, &g_lastCrash.timestamp);
        strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);

        file << "=== CRASH REPORT ===\n";
        file << "Time: " << timeStr << "\n";
        file << "Process ID: " << g_lastCrash.processId << "\n";
        file << "Thread ID: " << g_lastCrash.threadId << "\n";
        file << "Module: " << g_lastCrash.moduleName << "\n";
        file << "Exception Code: 0x" << std::hex << g_lastCrash.exceptionCode << "\n";
        file << "Exception Address: 0x" << g_lastCrash.exceptionAddress << "\n";
        file << "Exception Flags: 0x" << g_lastCrash.exceptionFlags << "\n";
        file << "RIP: 0x" << g_lastCrash.contextRip << "\n";
        file << "RSP: 0x" << g_lastCrash.contextRsp << "\n";
        file << "RBP: 0x" << g_lastCrash.contextRbp << "\n";
        file << "RAX: 0x" << g_lastCrash.contextRax << "\n";
        file << "RBX: 0x" << g_lastCrash.contextRbx << "\n";
        file << "RCX: 0x" << g_lastCrash.contextRcx << "\n";
        file << "RDX: 0x" << g_lastCrash.contextRdx << "\n";
        file << "=== END OF REPORT ===\n";

        file.close();
        return true;
    }

    // ── Enable SEH top-level filter ──
    inline void EnableTopLevelFilter() {
        SetUnhandledExceptionFilter(TopLevelExceptionFilter);
    }

    // ── Enable VEH handler ──
    inline bool EnableVectoredHandler() {
        if (g_vehHandle) return true;

        g_vehHandle = AddVectoredExceptionHandler(1, VectoredExceptionHandler);
        return g_vehHandle != nullptr;
    }

    // ── Disable VEH handler ──
    inline void DisableVectoredHandler() {
        if (g_vehHandle) {
            RemoveVectoredExceptionHandler(g_vehHandle);
            g_vehHandle = nullptr;
        }
    }

    // ── Initialize crash handling ──
    inline void Initialize() {
        if (g_crashHandlerInitialized) return;

        EnableTopLevelFilter();
        EnableVectoredHandler();

        // Prevent the OS from showing the "application has stopped working" dialog
        SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX | SEM_NOOPENFILEERRORBOX);

        g_crashHandlerInitialized = true;
    }

    // ── Shutdown ──
    inline void Shutdown() {
        DisableVectoredHandler();
        g_crashHandlerInitialized = false;
    }

    // ── Retrieve last crash info ──
    inline const CrashReport& GetLastCrash() {
        return g_lastCrash;
    }

} // namespace protection::crash
