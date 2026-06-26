#pragma once
#include <windows.h>
#include <cstdint>
#include <algorithm>
#include <random>

// ── Anti-Memory Dump: PE header destruction, section encryption, guard pages ──

namespace protection::anti_dump {

    // ── Random number generator for encryption ──
    inline uint32_t FastRand() {
        static uint32_t state = __rdtsc() & 0x7FFFFFFF;
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF;
        return state;
    }

    // ── Erase PE headers from memory ──
    inline bool ErasePEHeaders() {
        // Get base address of the module
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        // Change protection to RW
        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);

        DWORD oldProtect = 0;
        SIZE_T headerSize = dos->e_lfanew + sizeof(IMAGE_NT_HEADERS64);
        if (!VirtualProtect(baseAddr, headerSize, PAGE_READWRITE, &oldProtect))
            return false;

        // Fill with random data (not zeros — avoids easy detection)
        for (SIZE_T i = 0; i < headerSize; i++)
            baseAddr[i] = static_cast<uint8_t>(FastRand() & 0xFF);

        // Restore protection — but use PAGE_NOACCESS to crash memory scanners
        VirtualProtect(baseAddr, headerSize, PAGE_NOACCESS, &oldProtect);

        // Flush instruction cache
        FlushInstructionCache(GetCurrentProcess(), baseAddr, headerSize);
        return true;
    }

    // ── Encrypt/decrypt a memory section ──
    inline void XorSection(uint8_t* base, SIZE_T size, uint32_t key) {
        uint32_t k = key;
        for (SIZE_T i = 0; i < size; i++) {
            base[i] ^= static_cast<uint8_t>(k & 0xFF);
            k = (k * 0x41C64E6D) + 0x3039;
        }
    }

    // ── Protect .text section (encrypt when not executing, decrypt on demand) ──
    inline bool ProtectTextSection() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);

        // Find .text section
        IMAGE_SECTION_HEADER* sections = IMAGE_FIRST_SECTION(nt);
        for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) {
            if (memcmp(sections[i].Name, ".text", 5) == 0) {
                uint8_t* sectionAddr = baseAddr + sections[i].VirtualAddress;
                SIZE_T sectionSize = sections[i].SizeOfRawData;

                // Change to RWX temporarily
                DWORD oldProtect = 0;
                if (!VirtualProtect(sectionAddr, sectionSize, PAGE_EXECUTE_READWRITE, &oldProtect))
                    return false;

                // Generate per-session key and encrypt (simplified XOR)
                uint32_t sessionKey = __rdtsc() & 0x7FFFFFFF;
                XorSection(sectionAddr, sectionSize, sessionKey);

                // Store key in a safe location (simplified — actual impl would use TPM/DPAPI)
                // In production, use RtlEncryptMemory from crypt32
                DWORD oldProtect2;
                VirtualProtect(sectionAddr, sectionSize, oldProtect, &oldProtect2);
                return true;
            }
        }
        return false;
    }

    // ── Set guard pages on sensitive regions ──
    inline bool SetGuardPages() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        // Allocate a guard page region to trap memory scanners
        void* guardPage = VirtualAlloc(nullptr, 0x1000, MEM_COMMIT | MEM_RESERVE,
            PAGE_GUARD | PAGE_READWRITE);
        if (!guardPage) return false;

        // Write a fake PE signature to attract dump tools
        memcpy(guardPage, "MZ", 2);

        // When a scanner reads this page, it triggers STATUS_GUARD_PAGE_VIOLATION
        // Our VEH handler catches it and we can log/take action
        return true;
    }

    // ── Randomize section names in memory ──
    inline bool RandomizeSectionNames() {
        uint8_t* baseAddr = reinterpret_cast<uint8_t*>(GetModuleHandleW(nullptr));
        if (!baseAddr) return false;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(baseAddr);
        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(baseAddr + dos->e_lfanew);

        IMAGE_SECTION_HEADER* sections = IMAGE_FIRST_SECTION(nt);
        DWORD oldProtect = 0;
        VirtualProtect(sections, nt->FileHeader.NumberOfSections * sizeof(IMAGE_SECTION_HEADER),
            PAGE_READWRITE, &oldProtect);

        // XOR section names with random data
        for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) {
            for (int j = 0; j < IMAGE_SIZEOF_SHORT_NAME && sections[i].Name[j]; j++) {
                sections[i].Name[j] ^= static_cast<uint8_t>(FastRand() & 0xFF);
            }
        }

        VirtualProtect(sections, nt->FileHeader.NumberOfSections * sizeof(IMAGE_SECTION_HEADER),
            oldProtect, &oldProtect);
        return true;
    }

    // ── Add fake PE headers to confuse dump tools ──
    inline bool CreateFakePEs() {
        // Allocate several fake PE-like structures in memory
        for (int i = 0; i < 5; i++) {
            SIZE_T fakeSize = 0x1000 + (FastRand() % 0x4000);
            void* fakePE = VirtualAlloc(nullptr, fakeSize, MEM_COMMIT | MEM_RESERVE,
                PAGE_READWRITE);
            if (fakePE) {
                // Write MZ header + random data that looks like a PE
                IMAGE_DOS_HEADER* fakeDos = reinterpret_cast<IMAGE_DOS_HEADER*>(fakePE);
                fakeDos->e_magic = IMAGE_DOS_SIGNATURE;
                fakeDos->e_lfanew = sizeof(IMAGE_DOS_HEADER) + (FastRand() % 0x100);

                // Fill rest with plausible-looking random data
                uint8_t* data = reinterpret_cast<uint8_t*>(fakePE);
                for (SIZE_T j = 0; j < fakeSize; j++)
                    data[j] = static_cast<uint8_t>(FastRand() & 0xFF);

                // Put real MZ back
                fakeDos->e_magic = IMAGE_DOS_SIGNATURE;
            }
        }
        return true;
    }

    // ── Initialize all anti-dump protections ──
    inline bool Initialize() {
        bool result = true;

        // Set guard pages first (before headers are erased)
        result &= SetGuardPages();

        // Create decoy PE images
        result &= CreateFakePEs();

        // Randomize section name strings in memory
        result &= RandomizeSectionNames();

        // Erase the PE headers (makes dump analysis much harder)
        result &= ErasePEHeaders();

        return result;
    }

} // namespace protection::anti_dump
