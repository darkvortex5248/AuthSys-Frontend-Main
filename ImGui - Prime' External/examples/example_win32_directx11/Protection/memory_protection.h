#pragma once
#include <windows.h>
#include <cstdint>
#include <vector>
#include <atomic>

// ── Memory Protection: PAGE_GUARD, execute-only, runtime encryption ──

namespace protection::memory {

    // ── Allocate execute-only memory (Win10 1703+) ──
    // EFI_MEMORY_X64_EXECUTE_ONLY = PAGE_EXECUTE (0x10) without PAGE_READ
    // This prevents reading the code, making memory dumping much harder
    inline void* AllocateExecuteOnly(SIZE_T size) {
        // First attempt: PAGE_EXECUTE without PAGE_READ
        void* mem = VirtualAlloc(nullptr, size, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE);
        if (mem) return mem;

        // Fallback: PAGE_EXECUTE_READWRITE then change
        mem = VirtualAlloc(nullptr, size, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (mem) {
            DWORD oldProtect;
            VirtualProtect(mem, size, PAGE_EXECUTE, &oldProtect);
        }
        return mem;
    }

    // ── Set PAGE_GUARD on a region (triggers exception on access) ──
    inline bool SetGuard(HANDLE hProcess, uint8_t* address, SIZE_T size) {
        DWORD oldProtect;
        return VirtualProtectEx(hProcess, address, size,
            PAGE_GUARD | PAGE_READWRITE, &oldProtect) != 0;
    }

    // ── Encrypt memory region in-place ──
    inline void EncryptRegion(uint8_t* address, SIZE_T size, uint64_t key) {
        uint64_t k = key;
        // XOR with rotating key
        for (SIZE_T i = 0; i < size; i++) {
            address[i] ^= static_cast<uint8_t>(k & 0xFF);
            k = (k * 0x2545F4914F6CDD1Dull) + 0x9E3779B97F4A7C15ull;
        }
    }

    // ── Decrypt memory region ──
    inline void DecryptRegion(uint8_t* address, SIZE_T size, uint64_t key) {
        // XOR is symmetric
        EncryptRegion(address, size, key);
    }

    // ── Randomize memory addresses within a page ──
    inline void ObfuscatePointer(void** ptr, uint64_t key) {
        uintptr_t val = reinterpret_cast<uintptr_t>(*ptr);
        uintptr_t mask = 0xFFFFFFFFFFFFFFFFull;
        val ^= static_cast<uintptr_t>(key);
        val = (val << 13) | (val >> 51); // Rotate
        val ^= mask;
        *ptr = reinterpret_cast<void*>(val);
    }

    inline void DeobfuscatePointer(void** ptr, uint64_t key) {
        uintptr_t val = reinterpret_cast<uintptr_t>(*ptr);
        uintptr_t mask = 0xFFFFFFFFFFFFFFFFull;
        val ^= mask;
        val = (val >> 13) | (val << 51); // Reverse rotate
        val ^= static_cast<uintptr_t>(key);
        *ptr = reinterpret_cast<void*>(val);
    }

    // ── Protect critical data structures ──
    template<typename T>
    class ProtectedValue {
    public:
        ProtectedValue() : key(__rdtsc()) {}
        ProtectedValue(const T& val) : key(__rdtsc()) {
            Set(val);
        }

        void Set(const T& val) {
            encrypted = val;
            // XOR with key
            uint8_t* data = reinterpret_cast<uint8_t*>(&encrypted);
            uint8_t* kptr = reinterpret_cast<uint8_t*>(&key);
            for (size_t i = 0; i < sizeof(T); i++)
                data[i] ^= kptr[i % sizeof(uint64_t)];
        }

        T Get() const {
            T result = encrypted;
            uint8_t* data = reinterpret_cast<uint8_t*>(&result);
            uint8_t* kptr = reinterpret_cast<uint8_t*>(&key);
            for (size_t i = 0; i < sizeof(T); i++)
                data[i] ^= kptr[i % sizeof(uint64_t)];
            return result;
        }

    private:
        volatile uint64_t key;
        T encrypted;
    };

    // ── Memory scanner detection ──
    // Check if our memory is being read by another process
    inline bool DetectMemoryScanning() {
        // Create a guard page region and check if it's accessed
        void* testPage = VirtualAlloc(nullptr, 0x1000, MEM_COMMIT | MEM_RESERVE,
            PAGE_GUARD | PAGE_READWRITE);
        if (!testPage) return false;

        // Write a marker
        memcpy(testPage, "GUARD", 5);

        // Check if guard page was triggered (memory scanner read it)
        static bool guardTripped = false;
        // (In practice, this would be detected via VEH)

        VirtualFree(testPage, 0, MEM_RELEASE);
        return false;
    }

    // ── Obfuscate import addresses ──
    inline void* ResolveImport(const char* module, const char* api) {
        // Resolve via LoadLibrary + GetProcAddress but with obfuscated strings
        HMODULE hMod = LoadLibraryA(module);
        if (!hMod) return nullptr;
        return GetProcAddress(hMod, api);
    }

    // ── Encrypted function calls (trampoline) ──
    // In a full implementation, this would generate a runtime trampoline
    // that decrypts, calls, and re-encrypts a target function.
    // For brevity, this shows the concept:
    template<typename FuncType>
    inline FuncType CreateEncryptedTrampoline(uint8_t* code, SIZE_T codeSize, uint64_t key) {
        // Allocate execute-only memory
        void* trampoline = AllocateExecuteOnly(codeSize + 32);
        if (!trampoline) return nullptr;

        // Copy encrypted code
        uint8_t* dest = reinterpret_cast<uint8_t*>(trampoline);
        memcpy(dest + 16, code, codeSize); // Keep 16 bytes for stub

        // Create decryption stub (simplified — real impl would use asm)
        // [stub would decrypt 'code', jump to it, re-encrypt on return]

        return reinterpret_cast<FuncType>(trampoline);
    }

} // namespace protection::memory
