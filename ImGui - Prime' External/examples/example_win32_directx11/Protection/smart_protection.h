#pragma once
#include <windows.h>
#include <cstdint>
#include <string>
#include <atomic>
#include <thread>
#include <vector>

// ── Smart Protection: Master orchestrator for all protection subsystems ──

#include "string_encryption.h"
#include "anti_debug.h"
#include "anti_vm.h"
#include "anti_dump.h"
#include "anti_tamper.h"
#include "anti_attach.h"
#include "anti_patch.h"
#include "memory_protection.h"
#include "syscall_layer.h"
#include "secure_imports.h"
#include "stealth_threads.h"
#include "crash_handler.h"
#include "watchdog.h"
#include "self_destruct.h"
#include "integrity_check.h"
#include "virtualization_guard.h"
#include "mutation_engine.h"
#include "online_auth.h"
#include "hwid_system.h"

namespace protection {

    // ── Protection state ──
    enum class ProtectionLevel : uint32_t {
        None        = 0,
        Light       = 1,  // Basic anti-debug + crash handler
        Standard    = 2,  // Anti-tamper, integrity checks
        Enhanced    = 3,  // Anti-VM, anti-dump, syscalls
        Maximum     = 4,  // Watchdog, self-destruct, mutation
        Paranoid    = 5   // Everything including stealth threads
    };

    struct ProtectionConfig {
        ProtectionLevel level;
        bool enableAntiDebug;
        bool enableAntiVm;
        bool enableAntiDump;
        bool enableAntiTamper;
        bool enableAntiAttach;
        bool enableAntiPatch;
        bool enableMemoryProtection;
        bool enableSyscallLayer;
        bool enableSecureImports;
        bool enableStealthThreads;
        bool enableCrashHandler;
        bool enableWatchdog;
        bool enableSelfDestruct;
        bool enableIntegrityCheck;
        bool enableVirtualizationGuard;
        bool enableMutationEngine;
        bool enableOnlineAuth;
        bool enableHwidSystem;
        uint32_t monitorIntervalMs;

        ProtectionConfig() : level(ProtectionLevel::Standard),
            enableAntiDebug(true), enableAntiVm(true), enableAntiDump(false),
            enableAntiTamper(true), enableAntiAttach(false), enableAntiPatch(true),
            enableMemoryProtection(false), enableSyscallLayer(true),
            enableSecureImports(true), enableStealthThreads(false),
            enableCrashHandler(true), enableWatchdog(false),
            enableSelfDestruct(false), enableIntegrityCheck(true),
            enableVirtualizationGuard(true), enableMutationEngine(false),
            enableOnlineAuth(false), enableHwidSystem(false),
            monitorIntervalMs(5000) {}

        static ProtectionConfig FromLevel(ProtectionLevel lvl) {
            ProtectionConfig cfg;
            cfg.level = lvl;
            switch (lvl) {
                case ProtectionLevel::Light:
                    cfg.enableAntiDebug = true;
                    cfg.enableCrashHandler = true;
                    break;
                case ProtectionLevel::Standard:
                    cfg.enableAntiDebug = true;
                    cfg.enableAntiVm = true;
                    cfg.enableAntiTamper = true;
                    cfg.enableAntiPatch = true;
                    cfg.enableCrashHandler = true;
                    cfg.enableIntegrityCheck = true;
                    cfg.enableVirtualizationGuard = true;
                    break;
                case ProtectionLevel::Enhanced:
                    cfg.enableAntiDebug = true;
                    cfg.enableAntiVm = true;
                    cfg.enableAntiDump = true;
                    cfg.enableAntiTamper = true;
                    cfg.enableAntiAttach = true;
                    cfg.enableAntiPatch = true;
                    cfg.enableSyscallLayer = true;
                    cfg.enableCrashHandler = true;
                    cfg.enableIntegrityCheck = true;
                    cfg.enableVirtualizationGuard = true;
                    cfg.enableHwidSystem = true;
                    break;
                case ProtectionLevel::Maximum:
                    cfg.enableAntiDebug = true;
                    cfg.enableAntiVm = true;
                    cfg.enableAntiDump = true;
                    cfg.enableAntiTamper = true;
                    cfg.enableAntiAttach = true;
                    cfg.enableAntiPatch = true;
                    cfg.enableMemoryProtection = true;
                    cfg.enableSyscallLayer = true;
                    cfg.enableSecureImports = true;
                    cfg.enableCrashHandler = true;
                    cfg.enableWatchdog = true;
                    cfg.enableIntegrityCheck = true;
                    cfg.enableVirtualizationGuard = true;
                    cfg.enableHwidSystem = true;
                    break;
                case ProtectionLevel::Paranoid:
                    cfg = ProtectionConfig::Maximum(); // all enabled
                    cfg.enableStealthThreads = true;
                    cfg.enableSelfDestruct = true;
                    cfg.enableMutationEngine = true;
                    cfg.enableOnlineAuth = true;
                    break;
            }
            return cfg;
        }

        static ProtectionConfig Maximum() {
            ProtectionConfig cfg;
            cfg.level = ProtectionLevel::Maximum;
            cfg.enableAntiDebug = true;
            cfg.enableAntiVm = true;
            cfg.enableAntiDump = true;
            cfg.enableAntiTamper = true;
            cfg.enableAntiAttach = true;
            cfg.enableAntiPatch = true;
            cfg.enableMemoryProtection = true;
            cfg.enableSyscallLayer = true;
            cfg.enableSecureImports = true;
            cfg.enableCrashHandler = true;
            cfg.enableWatchdog = true;
            cfg.enableIntegrityCheck = true;
            cfg.enableVirtualizationGuard = true;
            cfg.enableHwidSystem = true;
            return cfg;
        }
    };

    // ── Attack log entry ──
    struct AttackLogEntry {
        uint64_t timestamp;
        std::string type;
        std::string details;
    };

    static std::vector<AttackLogEntry> g_attackLog;
    static std::atomic<bool> g_protectionInitialized = false;
    static std::atomic<bool> g_monitorRunning = false;
    static std::thread g_monitorThread;
    static ProtectionConfig g_config;

    // ── Log an attack event ──
    inline void LogAttack(const std::string& type, const std::string& details) {
        AttackLogEntry entry;
        entry.timestamp = GetTickCount64();
        entry.type = type;
        entry.details = details;
        g_attackLog.push_back(entry);

        // In production, also notify the watchdog
    }

    // ── Monitor thread function ──
    static void MonitorThreadProc() {
        while (g_monitorRunning.load()) {
            // Periodically run checks based on config
            if (g_config.enableAntiDebug) {
                bool debugged = anti_debug::IsDebuggerPresent();
                if (debugged) {
                    LogAttack("AntiDebug", "Debugger detected during monitoring");
                    // Take action based on severity
                }
            }

            if (g_config.enableAntiTamper) {
                bool tampered = anti_tamper::CheckTamper();
                if (tampered) {
                    LogAttack("AntiTamper", "Code tampering detected");
                }
            }

            if (g_config.enableIntegrityCheck) {
                // Run integrity check
            }

            Sleep(g_config.monitorIntervalMs);
        }
    }

    // ── Initialize protection ──
    inline bool Initialize(const ProtectionConfig& config = ProtectionConfig()) {
        if (g_protectionInitialized.load()) return true;

        g_config = config;

        // 1. Anti-debug (earliest possible)
        if (config.enableAntiDebug) {
            anti_debug::Initialize();
        }

        // 2. Crash handler (before any risky operations)
        if (config.enableCrashHandler) {
            crash::Initialize();
        }

        // 3. Anti-VM check
        if (config.enableAntiVm) {
            if (anti_vm::IsVirtualMachine()) {
                // Running in VM — may want to limit functionality
                LogAttack("AntiVM", "Virtual machine detected");
            }
        }

        // 4. Integrity check
        if (config.enableIntegrityCheck) {
            integrity::FullCheck();
        }

        // 5. Virtualization guard
        if (config.enableVirtualizationGuard) {
            vguard::IsHvciEnabled();
            vguard::IsVbsEnabled();
        }

        // 6. HWID system
        if (config.enableHwidSystem) {
            hwid::GenerateFingerprint();
        }

        // 7. Syscall layer
        if (config.enableSyscallLayer) {
            syscall::InitializeSyscalls();
        }

        // 8. Anti-tamper
        if (config.enableAntiTamper) {
            anti_tamper::StartMonitor();
        }

        // 9. Anti-patch
        if (config.enableAntiPatch) {
            anti_patch::StartMonitor();
        }

        // 10. Anti-dump
        if (config.enableAntiDump) {
            anti_dump::Initialize();
        }

        // 11. Memory protection
        if (config.enableMemoryProtection) {
            memory::SetGuard(GetCurrentProcess(), nullptr, 0);
        }

        // 12. Start monitor thread
        if (config.enableWatchdog || config.enableAntiDebug || config.enableAntiTamper) {
            g_monitorRunning = true;
            g_monitorThread = std::thread(MonitorThreadProc);
        }

        // 13. Start watchdog
        if (config.enableWatchdog) {
            watchdog::Start();
        }

        g_protectionInitialized = true;
        return true;
    }

    // ── Shutdown protection ──
    inline void Shutdown() {
        g_monitorRunning = false;
        if (g_monitorThread.joinable())
            g_monitorThread.join();

        watchdog::Stop();
        crash::Shutdown();

        g_protectionInitialized = false;
    }

    // ── Get attack log ──
    inline const std::vector<AttackLogEntry>& GetAttackLog() {
        return g_attackLog;
    }

    // ── Get protection status ──
    inline std::string GetStatusReport() {
        std::string report;
        report += "Protection: " + std::string(g_protectionInitialized.load() ? "Active" : "Inactive") + "\n";
        report += "Level: " + std::to_string(static_cast<uint32_t>(g_config.level)) + "\n";
        report += "AntiDebug: " + std::string(g_config.enableAntiDebug ? "On" : "Off") + "\n";
        report += "AntiVM: " + std::string(g_config.enableAntiVm ? "On" : "Off") + "\n";
        report += "AntiDump: " + std::string(g_config.enableAntiDump ? "On" : "Off") + "\n";
        report += "AntiTamper: " + std::string(g_config.enableAntiTamper ? "On" : "Off") + "\n";
        report += "AntiAttach: " + std::string(g_config.enableAntiAttach ? "On" : "Off") + "\n";
        report += "AntiPatch: " + std::string(g_config.enableAntiPatch ? "On" : "Off") + "\n";
        report += "CrashHandler: " + std::string(g_config.enableCrashHandler ? "On" : "Off") + "\n";
        report += "Watchdog: " + std::string(g_config.enableWatchdog ? "On" : "Off") + "\n";
        report += "Integrity: " + std::string(g_config.enableIntegrityCheck ? "On" : "Off") + "\n";
        report += "Attacks Logged: " + std::to_string(g_attackLog.size()) + "\n";
        return report;
    }

} // namespace protection
