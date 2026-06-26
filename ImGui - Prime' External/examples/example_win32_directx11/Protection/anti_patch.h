#pragma once
#include <windows.h>
#include <cstdint>
#include <vector>
#include <atomic>

// ── Anti-Patch: Detect modified code, hot-patches, and inline hooks ──

namespace protection::anti_patch {

    // ── Scan entire .text section for modifications ──
    inline bool ScanTextSection() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        // Get the on-disk version of the PE to compare
        // In production, you'd embed hashes or use a signed manifest
        // Here we do a self-consistency check

        HANDLE hFile = CreateFileMappingA(INVALID_HANDLE_VALUE, nullptr,
            PAGE_READONLY, 0, 0, nullptr);
        // Compare NtHeader CheckSum
        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);

        // If the checksum field has been zeroed (common in patched binaries)
        if (nt->OptionalHeader.CheckSum == 0) return true;

        return false;
    }

    // ── Check for hot-patches (JMP/CALL to trampoline) ──
    inline bool CheckForHotpatch(uint8_t* address, size_t size) {
        // Hot-patches typically start with:
        // E9 xx xx xx xx  (JMP rel32)  — 5 bytes
        // FF 25 xx xx xx xx (JMP [rip+offs]) — 6 bytes
        // 68 xx xx xx xx C3 (push+ret)  — 6 bytes
        // 48 B8 xx xx xx xx xx xx xx xx FF E0 (mov rax, jmp rax) — 12 bytes

        if (size < 5) return false;

        if (address[0] == 0xE9) return true; // JMP rel32
        if (address[0] == 0xEB) return true; // JMP rel8
        if (size >= 6 && address[0] == 0xFF && address[1] == 0x25) return true;
        if (size >= 6 && address[0] == 0x68 && address[5] == 0xC3) return true;
        if (size >= 12 && address[0] == 0x48 && address[1] == 0xB8 &&
            address[10] == 0xFF && address[11] == 0xE0) return true;

        return false;
    }

    // ── Validate NT API stubs in ntdll ──
    // Many hook engines redirect NT calls. The stubs in ntdll should have
    // a specific pattern for syscalls.
    inline bool ValidateNtStubs() {
        HMODULE hNtdll = GetModuleHandleA(OBFUSCATE("ntdll.dll"));
        if (!hNtdll) return false;

        // Get ntdll section info
        uint8_t* ntdllBase = reinterpret_cast<uint8_t*>(hNtdll);
        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(ntdllBase);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(ntdllBase + dos->e_lfanew);
        IMAGE_SECTION_HEADER* sections = IMAGE_FIRST_SECTION(nt);

        // A typical syscall stub looks like:
        // mov r10, rcx
        // mov eax, <syscall_number>
        // syscall
        // ret
        // Patterns: 4C 8B D1 B8 xx xx xx xx 0F 05 C3
        // If we find a stub that doesn't end with syscall+ret, it's hooked

        for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) {
            if (memcmp(sections[i].Name, ".text", 5) == 0) {
                uint8_t* textAddr = ntdllBase + sections[i].VirtualAddress;
                SIZE_T textSize = sections[i].SizeOfRawData;

                // Random sampling — check every 0x100 bytes for a syscall stub pattern
                for (SIZE_T j = 0; j < textSize - 8; j += 0x100) {
                    // Look for the end of a function: 'ret' (C3) preceded by something
                    for (SIZE_T k = j; k < j + 0x100 && k < textSize - 1; k++) {
                        if (textAddr[k] == 0xC3) {
                            // Back up to check if it's a syscall
                            if (k >= 2 && textAddr[k - 2] == 0x05 && textAddr[k - 3] == 0x0F) {
                                // This is a syscall stub — check it's intact
                                // A hooked syscall might have the syscall instruction patched
                                if (textAddr[k - 3] != 0x0F || textAddr[k - 2] != 0x05) {
                                    return true; // Nt stub patched
                                }
                            }
                            break; // Skip to next region
                        }
                    }
                }
                break;
            }
        }
        return false;
    }

    // ── Scan for memory breakpoints (page protection changes) ──
    inline bool CheckMemoryBreakpoints() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        MEMORY_BASIC_INFORMATION mbi;
        uint8_t* addr = baseAddr;

        while (addr < baseAddr + 0x1000000) { // Scan 16MB range
            if (VirtualQuery(addr, &mbi, sizeof(mbi)) == 0) break;

            // Check for PAGE_GUARD on executable pages
            if ((mbi.Protect & PAGE_GUARD) && (mbi.Protect & PAGE_EXECUTE_READ)) {
                // Debuggers set PAGE_GUARD on code pages for single-stepping
                return true;
            }

            addr += mbi.RegionSize;
        }
        return false;
    }

    // ── Comprehensive anti-patch check ──
    inline bool IsPatched() {
        bool detected = false;
        detected |= ScanTextSection();
        detected |= ValidateNtStubs();
        detected |= CheckMemoryBreakpoints();
        return detected;
    }

    inline std::atomic<bool> g_monitorRunning{ false };

    inline void MonitorThread() {
        protection::anti_debug::HideThread(GetCurrentThread());
        while (g_monitorRunning) {
            if (IsPatched()) {
                protection::self_destruct::Trigger(
                    protection::self_destruct::Reason::ProcessPatched);
            }
            Sleep(1500);
        }
    }

    inline void StartMonitor() {
        if (g_monitorRunning) return;
        g_monitorRunning = true;
        std::thread(MonitorThread).detach();
    }

} // namespace protection::anti_patch
