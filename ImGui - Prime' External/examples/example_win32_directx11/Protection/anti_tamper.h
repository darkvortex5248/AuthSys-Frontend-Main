#pragma once
#include <windows.h>
#include <cstdint>
#include <vector>
#include <array>
#include <atomic>

// ── Anti-Tamper: Integrity checks, hook detection, runtime validation ──

namespace protection::anti_tamper {

    // ── CRC64 lookup table ──
    inline uint64_t crc64_table[256] = {};
    inline bool crc64_init = false;

    inline void InitCRC64() {
        if (crc64_init) return;
        for (int i = 0; i < 256; i++) {
            uint64_t crc = i;
            for (int j = 0; j < 8; j++)
                crc = (crc >> 1) ^ (0xC96C5795D7870F42ull & -(crc & 1));
            crc64_table[i] = crc;
        }
        crc64_init = true;
    }

    inline uint64_t CRC64(const uint8_t* data, size_t len) {
        InitCRC64();
        uint64_t crc = 0xFFFFFFFFFFFFFFFFull;
        for (size_t i = 0; i < len; i++)
            crc = crc64_table[(crc ^ data[i]) & 0xFF] ^ (crc >> 8);
        return crc ^ 0xFFFFFFFFFFFFFFFFull;
    }

    // ── Per-function integrity check structure ──
    struct IntegrityEntry {
        const char* name;
        uint8_t* address;
        size_t size;
        uint64_t originalHash;
        bool critical; // If critical, terminate immediately on mismatch
    };

    inline std::vector<IntegrityEntry> g_integrityEntries;
    inline std::atomic<bool> g_tamperDetected{ false };

    // ── Register a function/code region for integrity monitoring ──
    inline void RegisterRegion(const char* name, uint8_t* address, size_t size, bool critical = true) {
        IntegrityEntry entry;
        entry.name = name;
        entry.address = address;
        entry.size = size;
        entry.originalHash = CRC64(address, size);
        entry.critical = critical;
        g_integrityEntries.push_back(entry);
    }

    // ── Check a single region for modification ──
    inline bool CheckRegion(const IntegrityEntry& entry) {
        uint64_t currentHash = CRC64(entry.address, entry.size);
        return currentHash == entry.originalHash;
    }

    // ── Scan for INT3 / CC bytes in executable code ──
    inline bool CheckForBreakpoints(uint8_t* address, size_t size) {
        for (size_t i = 0; i < size; i++) {
            if (address[i] == 0xCC) // INT3 software breakpoint
                return true;
        }
        return false;
    }

    // ── Detect IAT/EAT hooks by comparing with on-disk PE ──
    inline bool CheckIATHooks() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);

        IMAGE_DATA_DIRECTORY importDir = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
        if (!importDir.Size) return false;

        IMAGE_IMPORT_DESCRIPTOR* imports = reinterpret_cast<IMAGE_IMPORT_DESCRIPTOR*>(
            baseAddr + importDir.VirtualAddress);

        // Verify that import thunks are present and not redirected
        for (; imports->Name; imports++) {
            char* moduleName = reinterpret_cast<char*>(baseAddr + imports->Name);
            HMODULE hMod = GetModuleHandleA(moduleName);
            if (!hMod) continue;

            // Check FirstThunk vs OriginalFirstThunk
            IMAGE_THUNK_DATA64* thunk = reinterpret_cast<IMAGE_THUNK_DATA64*>(
                baseAddr + imports->FirstThunk);
            IMAGE_THUNK_DATA64* origThunk = reinterpret_cast<IMAGE_THUNK_DATA64*>(
                baseAddr + imports->OriginalFirstThunk);

            for (; thunk->u1.AddressOfData; thunk++, origThunk++) {
                // If FirstThunk doesn't match OriginalFirstThunk (and isn't forwarded),
                // someone may have hooked the IAT
                if (thunk->u1.Function != origThunk->u1.Function &&
                    (thunk->u1.AddressOfData & 0x8000000000000000) == 0) {
                    return true; // IAT hook detected
                }
            }
        }
        return false;
    }

    // ── Check if a specific API is hooked (first 8 bytes vs original) ──
    inline bool IsApiHooked(const char* module, const char* api, const uint8_t* expectedBytes, size_t expectedLen) {
        HMODULE hMod = GetModuleHandleA(module);
        if (!hMod) return false;
        uint8_t* funcAddr = reinterpret_cast<uint8_t*>(GetProcAddress(hMod, api));
        if (!funcAddr) return false;

        // Check if first bytes match original (if provided)
        if (expectedBytes && expectedLen > 0) {
            if (memcmp(funcAddr, expectedBytes, expectedLen) != 0)
                return true;
        }

        // Check for common hook patterns: JMP [FF 25], JMP far [EA], CALL [E8], etc.
        if (funcAddr[0] == 0xE9 || funcAddr[0] == 0xEB) return true; // JMP rel32/rel8
        if (funcAddr[0] == 0xEA) return true; // JMP far
        if (funcAddr[0] == 0xFF && funcAddr[1] == 0x25) return true; // JMP [rip+offs]
        if (funcAddr[0] == 0x68 && funcAddr[5] == 0xC3) return true; // push + ret (hook)
        if (funcAddr[0] == 0x48 && funcAddr[1] == 0xB8 && funcAddr[10] == 0xFF && funcAddr[11] == 0xE0)
            return true; // mov rax, imm64; jmp rax

        return false;
    }

    // ── Comprehensive tamper check ──
    inline bool CheckTamper() {
        if (g_tamperDetected) return true;

        bool tampered = false;

        // Check all registered integrity regions
        for (auto& entry : g_integrityEntries) {
            if (!CheckRegion(entry)) {
                tampered = true;
                if (entry.critical) {
                    g_tamperDetected = true;
                    protection::self_destruct::Trigger(
                        protection::self_destruct::Reason::TamperDetected);
                    return true;
                }
            }
        }

        // Check for IAT hooks
        if (CheckIATHooks()) {
            g_tamperDetected = true;
            protection::self_destruct::Trigger(
                protection::self_destruct::Reason::TamperDetected);
            return true;
        }

        return tampered;
    }

    // ── Register current module's .text section ──
    inline void RegisterSelfModule() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);
        IMAGE_SECTION_HEADER* sections = IMAGE_FIRST_SECTION(nt);

        // We skip the first few KB of .text that contains our own registration
        // to avoid false positives (the act of registering changes the hash)
        for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) {
            char* secName = reinterpret_cast<char*>(sections[i].Name);
            if (strncmp(secName, ".text", 5) == 0) {
                uint8_t* textStart = baseAddr + sections[i].VirtualAddress;
                SIZE_T textSize = sections[i].SizeOfRawData;

                // Register in 4KB blocks for granular checking
                const SIZE_T blockSize = 0x1000;
                for (SIZE_T offset = blockSize; offset < textSize; offset += blockSize) {
                    SIZE_T thisBlock = min(blockSize, textSize - offset);
                    if (thisBlock > 0) {
                        char name[64];
                        sprintf_s(name, ".text+0x%llX", (uint64_t)offset);
                        RegisterRegion(name, textStart + offset, thisBlock, false);
                    }
                }
                break;
            }
        }
    }

    // ── Monitor thread ──
    inline std::atomic<bool> g_monitorRunning{ false };

    inline void MonitorThread() {
        protection::anti_debug::HideThread(GetCurrentThread());
        while (g_monitorRunning) {
            CheckTamper();
            Sleep(1000); // Check every second
        }
    }

    inline void StartMonitor() {
        RegisterSelfModule();
        if (g_monitorRunning) return;
        g_monitorRunning = true;
        std::thread(MonitorThread).detach();
    }

} // namespace protection::anti_tamper
