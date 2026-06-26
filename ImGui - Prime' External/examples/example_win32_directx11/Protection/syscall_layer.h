#pragma once
#include <windows.h>
#include <cstdint>
#include <array>

// ── Syscall Layer: Indirect syscall invocations via ntdll stubs ──

namespace protection::syscall {

    // ── Syscall stub structure ──
    struct SyscallStub {
        uint8_t  mov_r10;     // 0x4C, 0x8B, 0xD1     mov r10, rcx
        uint8_t  mov_eax[2];  // 0xB8 + syscall number // mov eax, SSN
        uint8_t  syscall[2];  // 0x0F, 0x05             syscall
        uint8_t  ret;         // 0xC3                   ret
    };

    // ── Resolve syscall number from ntdll ──
    inline uint32_t ResolveSyscallNumber(const char* functionName) {
        uint8_t* ntdll = reinterpret_cast<uint8_t*>(GetModuleHandleW(L"ntdll.dll"));
        if (!ntdll) return 0;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(ntdll);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(ntdll + dos->e_lfanew);

        IMAGE_DATA_DIRECTORY exportDir = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT];
        IMAGE_EXPORT_DIRECTORY* exports = reinterpret_cast<IMAGE_EXPORT_DIRECTORY*>(
            ntdll + exportDir.VirtualAddress);

        uint32_t* names = reinterpret_cast<uint32_t*>(ntdll + exports->AddressOfNames);
        uint16_t* ordinals = reinterpret_cast<uint16_t*>(ntdll + exports->AddressOfNameOrdinals);
        uint32_t* functions = reinterpret_cast<uint32_t*>(ntdll + exports->AddressOfFunctions);

        for (DWORD i = 0; i < exports->NumberOfNames; i++) {
            char* name = reinterpret_cast<char*>(ntdll + names[i]);
            if (strcmp(name, functionName) == 0) {
                uint8_t* funcAddr = ntdll + functions[ordinals[i]];

                // In ntdll, the syscall instruction is at offset ~0x12-0x14
                // The SSN (syscall number) is at offset ~0x4
                // Pattern: mov eax, SSN at rva+4
                if (funcAddr[0] == 0x4C && funcAddr[1] == 0x8B && funcAddr[2] == 0xD1) {
                    // mov r10, rcx followed by mov eax, SSN
                    uint32_t ssn = *(uint32_t*)(funcAddr + 4) & 0xFFFF;
                    return ssn;
                }
            }
        }
        return 0;
    }

    // ── Build a fresh syscall stub ──
    inline SyscallStub BuildStub(uint32_t syscallNumber) {
        SyscallStub stub;
        stub.mov_r10    = 0x4C;
        stub.mov_eax[0] = 0xB8;
        stub.mov_eax[1] = static_cast<uint8_t>(syscallNumber & 0xFF);
        stub.syscall[0] = 0x0F;
        stub.syscall[1] = 0x05;
        stub.ret        = 0xC3;
        return stub;
    }

    // ── Execute a syscall stub ──
    // Note: In production, allocate executable memory and copy stub there
    template<typename... Args>
    inline int64_t Execute(uint32_t syscallNumber, Args... args) {
        auto stub = BuildStub(syscallNumber);

        // Allocate executable memory for the stub
        void* execMem = VirtualAlloc(nullptr, sizeof(SyscallStub),
            MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!execMem) return -1;

        memcpy(execMem, &stub, sizeof(SyscallStub));
        FlushInstructionCache(GetCurrentProcess(), execMem, sizeof(SyscallStub));

        // Execute via function pointer
        using SsnFunc = int64_t(__fastcall*)(Args...);
        auto func = static_cast<SsnFunc>(execMem);
        int64_t result = func(args...);

        VirtualFree(execMem, 0, MEM_RELEASE);
        return result;
    }

    // ── Commonly used syscall numbers (Windows 10 22H2 x64) ──
    // These are resolved dynamically in production
    namespace ssn {
        inline uint32_t NtAllocateVirtualMemory     = 0x18;
        inline uint32_t NtProtectVirtualMemory      = 0x50;
        inline uint32_t NtCreateThreadEx            = 0xC2;
        inline uint32_t NtOpenProcess               = 0x26;
        inline uint32_t NtOpenThread                = 0xBE;
        inline uint32_t NtSuspendProcess            = 0x1CE;
        inline uint32_t NtResumeProcess             = 0x1F7;
        inline uint32_t NtQueryInformationProcess   = 0x37;
        inline uint32_t NtReadVirtualMemory         = 0x3F;
        inline uint32_t NtWriteVirtualMemory        = 0x5A;
        inline uint32_t NtClose                     = 0x0F;
        inline uint32_t NtDelayExecution            = 0x4B;
        inline uint32_t NtRaiseHardError            = 0x37; // varies
        inline uint32_t NtSetInformationThread      = 0x41;
    }

    // ── Dynamically populate syscall numbers from ntdll ──
    inline void InitializeSyscalls() {
        ssn::NtAllocateVirtualMemory   = ResolveSyscallNumber("NtAllocateVirtualMemory");
        ssn::NtProtectVirtualMemory    = ResolveSyscallNumber("NtProtectVirtualMemory");
        ssn::NtCreateThreadEx          = ResolveSyscallNumber("NtCreateThreadEx");
        ssn::NtOpenProcess             = ResolveSyscallNumber("NtOpenProcess");
        ssn::NtOpenThread              = ResolveSyscallNumber("NtOpenThread");
        ssn::NtSuspendProcess          = ResolveSyscallNumber("NtSuspendProcess");
        ssn::NtResumeProcess           = ResolveSyscallNumber("NtResumeProcess");
        ssn::NtQueryInformationProcess = ResolveSyscallNumber("NtQueryInformationProcess");
        ssn::NtReadVirtualMemory       = ResolveSyscallNumber("NtReadVirtualMemory");
        ssn::NtWriteVirtualMemory      = ResolveSyscallNumber("NtWriteVirtualMemory");
        ssn::NtClose                   = ResolveSyscallNumber("NtClose");
        ssn::NtDelayExecution          = ResolveSyscallNumber("NtDelayExecution");
        ssn::NtRaiseHardError          = ResolveSyscallNumber("NtRaiseHardError");
        ssn::NtSetInformationThread    = ResolveSyscallNumber("NtSetInformationThread");
    }

    // ── Wrapper: NtDelayExecution (stealth sleep) ──
    inline void StealthSleep(DWORD milliseconds) {
        LARGE_INTEGER interval;
        interval.QuadPart = -static_cast<LONGLONG>(milliseconds) * 10000;
        Execute(ssn::NtDelayExecution, FALSE, &interval);
    }

    // ── Wrapper: NtRaiseHardError (hard system crash) ──
    inline void RaiseHardError() {
        ULONG_PTR params[4] = {};
        ULONG response;
        Execute(ssn::NtRaiseHardError, 0xC0000350L, 0, 0, params, 6, &response);
    }

} // namespace protection::syscall
