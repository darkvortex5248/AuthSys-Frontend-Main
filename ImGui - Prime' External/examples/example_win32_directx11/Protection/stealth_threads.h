#pragma once
#include <windows.h>
#include <cstdint>
#include <tlhelp32.h>

// ── Stealth Threads: Obfuscated thread creation and hiding ──

namespace protection::threads {

    // ── Shellcode to wrap a function call ──
    // This small stub calls an arbitrary function pointer with one argument
    #pragma pack(push, 1)
    struct ThreadStub {
        uint8_t  sub_rsp[4];    // 48 83 EC 28       sub rsp, 0x28
        uint8_t  mov_rcx[2];    // 48 B9             mov rcx, param
        void*    param;
        uint8_t  mov_rax[2];    // 48 B8             mov rax, func
        void*    func;
        uint8_t  call_rax[2];   // FF D0             call rax
        uint8_t  add_rsp[4];    // 48 83 C4 28       add rsp, 0x28
        uint8_t  xor_eax[2];    // 33 C0             xor eax, eax
        uint8_t  ret;           // C3                ret
    };
    #pragma pack(pop)

    static_assert(sizeof(ThreadStub) == 33, "ThreadStub size mismatch");

    // ── Create a thread with an obfuscated start address ──
    // Wraps the real function in executable shellcode so the start address
    // doesn't appear in thread enumeration
    inline HANDLE CreateStealthThread(LPTHREAD_START_ROUTINE func, LPVOID param) {
        ThreadStub stub;
        stub.sub_rsp[0] = 0x48; stub.sub_rsp[1] = 0x83;
        stub.sub_rsp[2] = 0xEC; stub.sub_rsp[3] = 0x28;
        stub.mov_rcx[0] = 0x48; stub.mov_rcx[1] = 0xB9;
        stub.param      = param;
        stub.mov_rax[0] = 0x48; stub.mov_rax[1] = 0xB8;
        stub.func       = func;
        stub.call_rax[0]= 0xFF; stub.call_rax[1]= 0xD0;
        stub.add_rsp[0] = 0x48; stub.add_rsp[1] = 0x83;
        stub.add_rsp[2] = 0xC4; stub.add_rsp[3] = 0x28;
        stub.xor_eax[0] = 0x33; stub.xor_eax[1] = 0xC0;
        stub.ret        = 0xC3;

        void* execMem = VirtualAlloc(nullptr, sizeof(ThreadStub),
            MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!execMem) return nullptr;

        memcpy(execMem, &stub, sizeof(ThreadStub));
        FlushInstructionCache(GetCurrentProcess(), execMem, sizeof(ThreadStub));

        HANDLE hThread = CreateThread(nullptr, 0,
            static_cast<LPTHREAD_START_ROUTINE>(execMem), nullptr, 0, nullptr);

        if (!hThread) {
            VirtualFree(execMem, 0, MEM_RELEASE);
            return nullptr;
        }

        return hThread;
    }

    // ── Hide thread from debugger ──
    inline bool HideFromDebugger(HANDLE hThread) {
        using NtSetInformationThreadFn = NTSTATUS(NTAPI*)(HANDLE, ULONG, PVOID, ULONG);
        HMODULE ntdll = GetModuleHandleW(L"ntdll.dll");
        if (!ntdll) return false;

        auto NtSetInformationThread = reinterpret_cast<NtSetInformationThreadFn>(
            GetProcAddress(ntdll, "NtSetInformationThread"));
        if (!NtSetInformationThread) return false;

        const ULONG ThreadHideFromDebugger = 0x11;
        NTSTATUS status = NtSetInformationThread(hThread,
            ThreadHideFromDebugger, nullptr, 0);
        return status >= 0;
    }

    // ── Create a thread with random entry point delay ──
    // Adds junk instructions before the real start to confuse scanners
    inline HANDLE CreateJunkPrologueThread(LPTHREAD_START_ROUTINE func, LPVOID param) {
        // Allocate larger shellcode with NOP sled + junk
        const size_t junkSize = 128;
        uint8_t* shellcode = static_cast<uint8_t*>(
            VirtualAlloc(nullptr, junkSize, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE));
        if (!shellcode) return nullptr;

        // Fill with benign junk (mov rdi, rdi = 2-byte NOP equivalent)
        for (size_t i = 0; i < junkSize - 32; i += 2) {
            shellcode[i] = 0x48; shellcode[i + 1] = 0xFF; // inc/dec patterns
        }

        // At the end, jump to the real function
        // jmp rax pattern
        size_t offset = junkSize - 16;
        shellcode[offset]     = 0x48; shellcode[offset + 1] = 0xB8; // mov rax, func
        memcpy(&shellcode[offset + 2], &func, sizeof(func));
        shellcode[offset + 10] = 0xFF; shellcode[offset + 11] = 0xE0; // jmp rax
        shellcode[offset + 12] = 0xCC; // int3 (shouldn't be reached)

        FlushInstructionCache(GetCurrentProcess(), shellcode, junkSize);

        HANDLE hThread = CreateThread(nullptr, 0,
            reinterpret_cast<LPTHREAD_START_ROUTINE>(shellcode), param, 0, nullptr);

        if (!hThread) {
            VirtualFree(shellcode, 0, MEM_RELEASE);
            return nullptr;
        }

        return hThread;
    }

    // ── Thread name spoofing via NtSetInformationThread ──
    inline bool SetThreadName(HANDLE hThread, const wchar_t* name) {
        using NtSetInformationThreadFn = NTSTATUS(NTAPI*)(HANDLE, ULONG, PVOID, ULONG);
        HMODULE ntdll = GetModuleHandleW(L"ntdll.dll");
        if (!ntdll) return false;

        auto NtSetInformationThread = reinterpret_cast<NtSetInformationThreadFn>(
            GetProcAddress(ntdll, "NtSetInformationThread"));
        if (!NtSetInformationThread) return false;

        // This is only supported in some Windows versions
        // ThreadNameInformation = 0x26 (not officially documented)
        return false;
    }

    // ── Enumerate threads in a process ──
    inline DWORD CountThreads(DWORD pid = GetCurrentProcessId()) {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return 0;

        THREADENTRY32 te = { sizeof(THREADENTRY32) };
        DWORD count = 0;

        if (Thread32First(hSnapshot, &te)) {
            do {
                if (te.th32OwnerProcessID == pid) count++;
            } while (Thread32Next(hSnapshot, &te));
        }

        CloseHandle(hSnapshot);
        return count;
    }

} // namespace protection::threads
