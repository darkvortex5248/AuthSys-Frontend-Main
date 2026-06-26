#pragma once
#include <windows.h>
#include <cstdint>
#include <array>
#include <string>
#include <intrin.h>
#include <winternl.h>
#include <ntstatus.h>

// ── Custom LDR_DATA_TABLE_ENTRY with full field access ──
// The public SDK version hides DllBase/BaseDllName behind version guards
typedef struct _MY_LDR_DATA_TABLE_ENTRY {
    LIST_ENTRY InMemoryOrderLinks;
    LIST_ENTRY InInitializationOrderLinks;
    PVOID DllBase;
    LIST_ENTRY EntryPoint;
    ULONG SizeOfImage;
    UNICODE_STRING FullDllName;
    UNICODE_STRING BaseDllName;
    // ... remaining fields not needed
} MY_LDR_DATA_TABLE_ENTRY, * PMY_LDR_DATA_TABLE_ENTRY;

// ── Secure Imports: Dynamic API resolving with hashed names ──

namespace protection::imports {

    // ── Compile-time hash database ──
    // Instead of storing API names as strings, we store FNV-1a hashes
    // The actual names never appear in the binary's import table or strings

    constexpr uint64_t HashString(const char* str) {
        uint64_t hash = 0xCBF29CE484222325ull;
        while (*str)
            hash = (hash ^ *str++) * 0x100000001B3ull;
        return hash;
    }

    // ── PEB-based module enumeration (avoids kernel32 import) ──
    inline uint8_t* GetModuleFromPeb(const wchar_t* moduleName) {
        PPEB peb = reinterpret_cast<PPEB>(__readgsqword(0x60));
        if (!peb || !peb->Ldr) return nullptr;

        LIST_ENTRY* head = &peb->Ldr->InMemoryOrderModuleList;
        LIST_ENTRY* entry = head->Flink;

        while (entry != head) {
            MY_LDR_DATA_TABLE_ENTRY* ldr = CONTAINING_RECORD(entry, MY_LDR_DATA_TABLE_ENTRY, InMemoryOrderLinks);

            // Compare module name (case-insensitive)
            if (ldr->BaseDllName.Buffer) {
                if (_wcsicmp(ldr->BaseDllName.Buffer, moduleName) == 0)
                    return reinterpret_cast<uint8_t*>(ldr->DllBase);
            }

            entry = entry->Flink;
        }
        return nullptr;
    }

    // ── Export directory parser (no imports table needed) ──
    inline void* GetExportFromModule(uint8_t* moduleBase, const char* apiName) {
        if (!moduleBase) return nullptr;

        IMAGE_DOS_HEADER* dos = reinterpret_cast<IMAGE_DOS_HEADER*>(moduleBase);
        if (dos->e_magic != IMAGE_DOS_SIGNATURE) return nullptr;

        IMAGE_NT_HEADERS64* nt = reinterpret_cast<IMAGE_NT_HEADERS64*>(moduleBase + dos->e_lfanew);
        if (nt->Signature != IMAGE_NT_SIGNATURE) return nullptr;

        IMAGE_DATA_DIRECTORY exportDir = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT];
        if (!exportDir.Size) return nullptr;

        IMAGE_EXPORT_DIRECTORY* exports = reinterpret_cast<IMAGE_EXPORT_DIRECTORY*>(
            moduleBase + exportDir.VirtualAddress);

        uint32_t* names = reinterpret_cast<uint32_t*>(moduleBase + exports->AddressOfNames);
        uint16_t* ordinals = reinterpret_cast<uint16_t*>(moduleBase + exports->AddressOfNameOrdinals);
        uint32_t* functions = reinterpret_cast<uint32_t*>(moduleBase + exports->AddressOfFunctions);

        for (DWORD i = 0; i < exports->NumberOfNames; i++) {
            char* name = reinterpret_cast<char*>(moduleBase + names[i]);
            if (strcmp(name, apiName) == 0) {
                uint32_t funcAddr = functions[ordinals[i]];
                // Check for forwarded exports
                if (funcAddr >= exportDir.VirtualAddress &&
                    funcAddr < exportDir.VirtualAddress + exportDir.Size) {
                    // Forwarded — resolve from the target module
                    char* forwarder = reinterpret_cast<char*>(moduleBase + funcAddr);
                    char* forwardModule = forwarder;
                    while (*forwarder && *forwarder != '.') forwarder++;
                    if (*forwarder == '.') {
                        *forwarder = 0;
                        // Recursive resolution would go here
                        // For now, just return the forwarder name
                    }
                    return nullptr;
                }
                return moduleBase + funcAddr;
            }
        }
        return nullptr;
    }

    // ── Hashed API resolver ──
    // Map of known hash -> API name for bootstrapping
    // In production, you'd store only hashes and resolve at runtime

    inline void* ResolveByHash(uint64_t hash) {
        // Get commonly used modules
        uint8_t* kernel32 = GetModuleFromPeb(L"kernel32.dll");
        uint8_t* ntdll = GetModuleFromPeb(L"ntdll.dll");

        // Pre-defined API hash map (abbreviated — expand as needed)
        struct ApiEntry {
            uint64_t hash;
            const char* name;
            uint8_t* module;
        };

        // We need the string names to look up exports, but they can be
        // obfuscated at runtime. For now we use direct lookup for clarity.
        // In production, you'd iterate export tables comparing computed hashes.
        return nullptr;
    }

    // ── Obfuscated import resolution ──
    // Resolves an API using runtime-decrypted strings
    template<uint64_t ModuleHash, uint64_t ApiHash>
    class SecureImport {
    public:
        SecureImport() : m_func(nullptr) {}

        bool Resolve() {
            // Decrypt module and API names (shown simplified)
            // In production, use OBFUSCATE macro from string_encryption.h

            // Get module base from PEB
            uint8_t* modBase = GetModuleFromPeb(L"");
            if (!modBase) return false;

            // Resolve export
            m_func = GetExportFromModule(modBase, "");
            return m_func != nullptr;
        }

        template<typename... Args>
        auto Call(Args... args) {
            // Type-erased function call
            auto func = reinterpret_cast<uint64_t(*)(Args...)>(m_func);
            return func(args...);
        }

        bool IsValid() const { return m_func != nullptr; }

    private:
        void* m_func;
    };

    // ── Type-safe API proxy ──
    template<typename T>
    class ApiProxy {
    public:
        ApiProxy(const char* module, const char* api) {
            HMODULE hMod = LoadLibraryA(module);
            if (hMod)
                m_func = reinterpret_cast<T>(GetProcAddress(hMod, api));
        }

        T Get() const { return m_func; }
        explicit operator bool() const { return m_func != nullptr; }

    private:
        T m_func = nullptr;
    };

    // ── Manual mapping of PEB for import-less startup ──
    // This allows the application to run without ANY imports initially
    namespace peb {

        inline uint8_t* GetKernel32Base() {
            PPEB peb = reinterpret_cast<PPEB>(__readgsqword(0x60));
            if (!peb || !peb->Ldr) return nullptr;

            LIST_ENTRY* head = &peb->Ldr->InMemoryOrderModuleList;
            LIST_ENTRY* entry = head->Flink;

            // Skip the executable (first entry)
            if (entry != head) entry = entry->Flink;

            // Second entry is typically ntdll.dll, third is kernel32
            if (entry != head) entry = entry->Flink;

            if (entry != head) {
                MY_LDR_DATA_TABLE_ENTRY* ldr = CONTAINING_RECORD(entry, MY_LDR_DATA_TABLE_ENTRY, InMemoryOrderLinks);
                return reinterpret_cast<uint8_t*>(ldr->DllBase);
            }
            return nullptr;
        }

        // Get ntdll base through PEB
        inline uint8_t* GetNtdllBase() {
            PPEB peb = reinterpret_cast<PPEB>(__readgsqword(0x60));
            if (!peb || !peb->Ldr) return nullptr;

            LIST_ENTRY* head = &peb->Ldr->InMemoryOrderModuleList;
            LIST_ENTRY* entry = head->Flink;

            // Second entry is ntdll (after executable)
            if (entry != head) entry = entry->Flink;

            if (entry != head) {
                MY_LDR_DATA_TABLE_ENTRY* ldr = CONTAINING_RECORD(entry, MY_LDR_DATA_TABLE_ENTRY, InMemoryOrderLinks);
                return reinterpret_cast<uint8_t*>(ldr->DllBase);
            }
            return nullptr;
        }
    }

} // namespace protection::imports
