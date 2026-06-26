#pragma once
#include <windows.h>
#include <cstdint>
#include <thread>
#include <atomic>
#include <intrin.h>
#include <winternl.h>

// ── Advanced Anti-Debugging (PEB, NtQuery, HWBP, Timing, VEH) ──

namespace protection::anti_debug {

    // ── Internal NTAPI definitions ──
#pragma pack(push, 1)
    typedef struct _PROCESS_BASIC_INFORMATION {
        NTSTATUS ExitStatus;
        PPEB PebBaseAddress;
        ULONG_PTR AffinityMask;
        KPRIORITY BasePriority;
        ULONG_PTR UniqueProcessId;
        ULONG_PTR InheritedFromUniqueProcessId;
    } PROCESS_BASIC_INFORMATION;

    typedef enum _PROCESSINFOCLASS {
        ProcessBasicInformation = 0,
        ProcessDebugPort = 7,
        ProcessDebugFlags = 31,
        ProcessDebugObjectHandle = 30
    } PROCESSINFOCLASS;
#pragma pack(pop)

    typedef NTSTATUS(NTAPI* pNtQueryInformationProcess)(
        HANDLE, PROCESSINFOCLASS, PVOID, ULONG, PULONG);

    typedef NTSTATUS(NTAPI* pNtSetInformationThread)(
        HANDLE, ULONG, PVOID, ULONG);

    typedef NTSTATUS(NTAPI* pNtRaiseHardError)(
        NTSTATUS, ULONG, ULONG, PULONG_PTR, ULONG, PULONG);

    typedef LONG(NTAPI* pNtUnhandledExceptionFilter)(LPEXCEPTION_POINTERS);

    // ── Module handles (cached) ──
    inline HMODULE g_hNtdll = nullptr;
    inline pNtQueryInformationProcess g_NtQueryInformationProcess = nullptr;
    inline pNtSetInformationThread g_NtSetInformationThread = nullptr;
    inline std::atomic<bool> g_DebuggerDetected{ false };

    // ── Initialize required API pointers ──
    inline bool Initialize() {
        g_hNtdll = GetModuleHandleA(OBFUSCATE("ntdll.dll"));
        if (!g_hNtdll) return false;
        g_NtQueryInformationProcess = (pNtQueryInformationProcess)
            GetProcAddress(g_hNtdll, OBFUSCATE("NtQueryInformationProcess"));
        g_NtSetInformationThread = (pNtSetInformationThread)
            GetProcAddress(g_hNtdll, OBFUSCATE("NtSetInformationThread"));
        return g_NtQueryInformationProcess != nullptr;
    }

    // ── 1. IsDebuggerPresent via PEB ──
    inline bool CheckPEB() {
        PPEB peb = reinterpret_cast<PPEB>(__readgsqword(0x60));
        if (!peb) return false;
        // BeingDebugged flag
        if (peb->BeingDebugged) return true;
        // NtGlobalFlag (0x68 offset in 64-bit PEB)
        if ((*(uint32_t*)((uint8_t*)peb + 0xBC)) & 0x70) return true; // NtGlobalFlag at offset 0xBC on x64
        return false;
    }

    // ── 2. NtQueryInformationProcess checks ──
    inline bool CheckDebugPort() {
        if (!g_NtQueryInformationProcess) return false;
        HANDLE hDebugPort = nullptr;
        ULONG returnLen = 0;
        NTSTATUS status = g_NtQueryInformationProcess(GetCurrentProcess(),
            ProcessDebugPort, &hDebugPort, sizeof(hDebugPort), &returnLen);
        if (status >= 0 && hDebugPort) return true;

        // Check DebugObjectHandle
        HANDLE hDebugObject = nullptr;
        status = g_NtQueryInformationProcess(GetCurrentProcess(),
            ProcessDebugObjectHandle, &hDebugObject, sizeof(hDebugObject), &returnLen);
        if (status >= 0 && hDebugObject) return true;

        return false;
    }

    // ── 3. Hardware breakpoint detection (DR0-DR3) ──
    inline bool CheckHardwareBreakpoints() {
        CONTEXT ctx = {};
        ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS;
        if (!GetThreadContext(GetCurrentThread(), &ctx)) return false;
        return (ctx.Dr0 || ctx.Dr1 || ctx.Dr2 || ctx.Dr3);
    }

    // ── 4. Timing attack: detect debugger-induced slowdown ──
    inline bool CheckTiming() {
        volatile uint64_t start = __rdtsc();
        volatile uint64_t end = __rdtsc();
        uint64_t diff = end - start;

        // NOP sled to amplify timing difference
        for (int i = 0; i < 100; i++) {
            start = __rdtsc();
            end = __rdtsc();
            uint64_t t = end - start;
            if (t > diff) diff = t;
        }

        // If RDTSC takes unreasonably long, debugger may be intercepting
        return diff > 5000;
    }

    // ── 5. Check for kernel debugger ──
    inline bool CheckKernelDebugger() {
        typedef NTSTATUS(NTAPI* pNtSystemDebugControl)(
            ULONG, PVOID, ULONG, PVOID, ULONG, PULONG);
        auto NtSystemDebugControl = (pNtSystemDebugControl)
            GetProcAddress(g_hNtdll, OBFUSCATE("NtSystemDebugControl"));
        if (!NtSystemDebugControl) return false;

        ULONG returnLen = 0;
        NTSTATUS status = NtSystemDebugControl(2, nullptr, 0, nullptr, 0, &returnLen);
        // SysDbgGetTriageDump = 2, or SysDbgQueryDebug = ...
        // If KdDebuggerEnabled, certain calls return STATUS_SUCCESS
        ULONG debuggerEnabled = 0;
        // Alternative: check KUSER_SHARED_DATA
        uint8_t* KdDebuggerEnabled = (uint8_t*)0x7FFE02D8;
        if (KdDebuggerEnabled) {
            return *KdDebuggerEnabled != 0;
        }
        return false;
    }

    // ── 6. Check for debug objects using NtQueryObject ──
    inline bool CheckDebugObjects() {
        typedef NTSTATUS(NTAPI* pNtQueryObject)(
            HANDLE, ULONG, PVOID, ULONG, PULONG);
        auto NtQueryObject = (pNtQueryObject)
            GetProcAddress(g_hNtdll, OBFUSCATE("NtQueryObject"));
        if (!NtQueryObject) return false;

        // ObjectAllTypesInformation = 3
        ULONG size = 0;
        NTSTATUS status = NtQueryObject(nullptr, 3, nullptr, 0, &size);
        if (status != 0xC0000004 && status != 0) return true; // Expected STATUS_INFO_LENGTH_MISMATCH

        return false;
    }

    // ── 7. Vectored Exception Handler shield ──
    inline PVOID g_vehHandle = nullptr;
    inline LONG NTAPI VexHandler(LPEXCEPTION_POINTERS ep) {
        // If we receive an exception that shouldn't happen (single-step, breakpoint)
        // and no debugger is present, we handle it silently
        if (ep->ExceptionRecord->ExceptionCode == STATUS_SINGLE_STEP ||
            ep->ExceptionRecord->ExceptionCode == STATUS_BREAKPOINT) {
            g_DebuggerDetected = true;
            ep->ContextRecord->EFlags |= 0x100; // Continue execution
            return EXCEPTION_CONTINUE_EXECUTION;
        }
        return EXCEPTION_CONTINUE_SEARCH;
    }

    inline void InstallVEH() {
        if (!g_vehHandle)
            g_vehHandle = AddVectoredExceptionHandler(1, VexHandler);
    }

    inline void RemoveVEH() {
        if (g_vehHandle) {
            RemoveVectoredExceptionHandler(g_vehHandle);
            g_vehHandle = nullptr;
        }
    }

    // ── 8. Thread hiding via NtSetInformationThread ──
    inline bool HideThread(HANDLE hThread) {
        if (!hThread) hThread = GetCurrentThread();
        // ThreadHideFromDebugger = 0x11
        NTSTATUS status = g_NtSetInformationThread(hThread, 0x11, nullptr, 0);
        return status >= 0;
    }

    // ── 9. Parent process validation ──
    inline bool ValidateParent() {
        if (!g_NtQueryInformationProcess) return false;
        PROCESS_BASIC_INFORMATION pbi = {};
        ULONG retLen = 0;
        NTSTATUS status = g_NtQueryInformationProcess(GetCurrentProcess(),
            ProcessBasicInformation, &pbi, sizeof(pbi), &retLen);
        if (status < 0) return true;

        // Get parent PID
        HANDLE hParent = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE,
            (DWORD)pbi.InheritedFromUniqueProcessId);
        if (!hParent) return true;

        wchar_t parentPath[MAX_PATH] = {};
        DWORD pathSize = MAX_PATH;
        BOOL ok = QueryFullProcessImageNameW(hParent, 0, parentPath, &pathSize);
        CloseHandle(hParent);
        if (!ok) return true;

        // Check if parent is a known debugger/launcher
        _wcslwr_s(parentPath);
        const wchar_t* badParents[] = {
            L"x64dbg.exe", L"x32dbg.exe", L"ida.exe", L"ida64.exe",
            L"ollydbg.exe", L"windbg.exe", L"dbgview.exe",
            L"processhacker.exe", L"cheatengine.exe",
            L"dnspy.exe", L"httppreview.exe"
        };
        for (auto bp : badParents) {
            if (wcsstr(parentPath, bp)) return false;
        }
        return true;
    }

    // ── Comprehensive anti-debug check ──
    inline bool IsDebuggerPresent() {
        if (g_DebuggerDetected) return true;

        // Run multiple checks
        bool detected = false;
        detected |= CheckPEB();
        detected |= CheckDebugPort();
        detected |= CheckHardwareBreakpoints();
        detected |= CheckTiming();
        detected |= CheckKernelDebugger();
        detected |= CheckDebugObjects();
        detected |= !ValidateParent();

        if (detected) g_DebuggerDetected = true;
        return detected;
    }

    // ── Run continuous monitoring in background ──
    inline std::thread* g_monitorThread = nullptr;
    inline std::atomic<bool> g_monitorRunning{ false };

    inline void MonitorThread() {
        HideThread(GetCurrentThread());
        while (g_monitorRunning) {
            if (IsDebuggerPresent()) {
                // Signal self-destruct or crash
                protection::self_destruct::Trigger(
                    protection::self_destruct::Reason::DebuggerDetected);
            }
            Sleep(200); // Check every 200ms — low CPU
        }
    }

    inline void StartMonitor() {
        if (g_monitorRunning) return;
        g_monitorRunning = true;
        g_monitorThread = new std::thread(MonitorThread);
        g_monitorThread->detach();
    }

    inline void StopMonitor() {
        g_monitorRunning = false;
        delete g_monitorThread;
        g_monitorThread = nullptr;
    }

} // namespace protection::anti_debug
