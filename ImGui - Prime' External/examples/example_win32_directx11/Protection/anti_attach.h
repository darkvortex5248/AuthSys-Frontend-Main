#pragma once
#include <windows.h>
#include <cstdint>

// ── Anti-Process-Attach: Prevent OpenProcess, debugger attachment ──

namespace protection::anti_attach {

    // ── Internal NTAPI type definitions ──
    typedef enum _PROCESSINFOCLASS2 {
        ProcessBreakOnTermination = 29,
        ProcessProtectionLevel = 61  // Win10+ PPL
    } PROCESSINFOCLASS2;

    typedef NTSTATUS(NTAPI* pNtSetInformationProcess)(
        HANDLE, PROCESSINFOCLASS2, PVOID, ULONG);

    typedef NTSTATUS(NTAPI* pNtClose)(HANDLE);

    // ── Protected Process Light (PPL) ──
    // Note: Requires signing to set PPL. This is an educational implementation.
    // In practice, a driver would be needed for true PPL.

    typedef enum _PS_PROTECTED_TYPE {
        PsProtectedTypeNone = 0,
        PsProtectedTypeProtectedLight = 1,
        PsProtectedTypeProtected = 2
    } PS_PROTECTED_TYPE;

    typedef enum _PS_PROTECTED_SIGNER {
        PsProtectedSignerNone = 0,
        PsProtectedSignerAuthenticode = 1,
        PsProtectedSignerCodeGen = 2,
        PsProtectedSignerAntimalware = 3,
        PsProtectedSignerLsa = 4,
        PsProtectedSignerWindows = 5,
        PsProtectedSignerWinTcb = 6,
        PsProtectedSignerWinSystem = 7,
        PsProtectedSignerApp = 8,
        PsProtectedSignerMax = 9
    } PS_PROTECTED_SIGNER;

    typedef struct _PS_PROTECTION {
        union {
            struct {
                uint8_t Type : 3;    // PS_PROTECTED_TYPE
                uint8_t Signer : 4;   // PS_PROTECTED_SIGNER
                uint8_t Audit : 1;    // Reserved
            };
            uint8_t Level;
        };
    } PS_PROTECTION;

    inline HMODULE g_hNtdll = nullptr;
    inline pNtSetInformationProcess g_NtSetInformationProcess = nullptr;

    inline bool Initialize() {
        g_hNtdll = GetModuleHandleA(OBFUSCATE("ntdll.dll"));
        if (!g_hNtdll) return false;
        g_NtSetInformationProcess = (pNtSetInformationProcess)
            GetProcAddress(g_hNtdll, OBFUSCATE("NtSetInformationProcess"));
        return g_NtSetInformationProcess != nullptr;
    }

    // ── Set process as "break on termination" (anti-debugger) ──
    // When a debugger tries to detach, it triggers a breakpoint
    inline bool SetBreakOnTermination() {
        if (!g_NtSetInformationProcess) return false;
        ULONG breakOnTermination = 1;
        NTSTATUS status = g_NtSetInformationProcess(GetCurrentProcess(),
            ProcessBreakOnTermination, &breakOnTermination, sizeof(breakOnTermination));
        return status >= 0;
    }

    // ── Attempt to set PPL-like protection ──
    // Note: This generally requires a driver on Win10+.
    // This shows the concept — in production, use a kernel driver.
    inline bool SetProcessProtection() {
        if (!g_NtSetInformationProcess) return false;
        PS_PROTECTION prot = {};
        prot.Type = PsProtectedTypeProtectedLight;
        prot.Signer = PsProtectedSignerAntimalware; // Needs ELAM driver
        NTSTATUS status = g_NtSetInformationProcess(GetCurrentProcess(),
            ProcessProtectionLevel, &prot, sizeof(prot));
        return status >= 0;
    }

    // ── Hook NtClose to detect improper handle closing (debugger artifact) ──
    // Debuggers sometimes close invalid handles, which NtClose will report as
    // STATUS_INVALID_HANDLE. We can detect this.
    inline bool DetectInvalidClose() {
        // Call NtClose on an invalid handle
        NTSTATUS status = NtClose((HANDLE)0xDEADBEEF);
        // If STATUS_INVALID_HANDLE (0xC0000008) is returned, it's normal.
        // If STATUS_SUCCESS, something is intercepting (debugger/hook)
        return status == 0xC0000008 ? false : true;
    }

    // ── Set a hardened process mitigation policy ──
    inline bool SetHardenedMitigations() {
        typedef NTSTATUS(NTAPI* pNtSetInformationProcess)(
            HANDLE, ULONG, PVOID, ULONG);
        auto NtSetInformationProcess = (pNtSetInformationProcess)
            GetProcAddress(g_hNtdll, "NtSetInformationProcess");
        if (!NtSetInformationProcess) return false;

        // ProcessMitigationPolicy = 0x34 (Win8.1+)
        // ProcessSignaturePolicy = 0x08
        // MITIGATION_BINARY_SIGNATURE_POLICY
        struct {
            ULONG MicrosoftSignedOnly : 1;
            ULONG StoreSignedOnly : 1;
            ULONG MitigationOptIn : 1;
            ULONG AuditMicrosoftSignedOnly : 1;
            ULONG AuditStoreSignedOnly : 1;
            ULONG Reserved : 27;
        } sigPolicy;
        memset(&sigPolicy, 0, sizeof(sigPolicy));
        sigPolicy.MicrosoftSignedOnly = 1;

        NTSTATUS status = NtSetInformationProcess(GetCurrentProcess(),
            0x34, &sigPolicy, sizeof(sigPolicy));
        return status >= 0;
    }

    // ── Initialize all anti-attach measures ──
    inline bool Initialize() {
        if (!Initialize()) return false;
        bool result = true;
        result &= SetBreakOnTermination();
        result &= SetHardenedMitigations();
        // PPL requires driver — attempt but don't fail if unsupported
        SetProcessProtection();
        return result;
    }

} // namespace protection::anti_attach
