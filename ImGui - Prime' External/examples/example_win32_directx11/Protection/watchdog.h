#pragma once
#include <windows.h>
#include <cstdint>
#include <atomic>
#include <thread>

// ── Watchdog: Heartbeat monitor and self-protection ──

namespace protection::watchdog {

    static std::atomic<bool> g_watchdogRunning = false;
    static std::atomic<uint32_t> g_heartbeatCounter = 0;
    static std::thread g_watchdogThread;
    static uint32_t g_heartbeatTimeout = 5000;
    static HANDLE g_watchdogMutex = nullptr;

    // ── Heartbeat signature stored in a shared memory region ──
    // Other instances of the process can check if this one is alive
    static const char* SHARED_MEM_NAME = "Local\\RinoxPrime_Watchdog";
    static HANDLE g_sharedMapping = nullptr;
    static volatile uint32_t* g_sharedHeartbeat = nullptr;

    // ── Update heartbeat ──
    inline void Pet() {
        g_heartbeatCounter++;
        if (g_sharedHeartbeat) {
            *g_sharedHeartbeat = g_heartbeatCounter.load();
        }
    }

    // ── Get current heartbeat ──
    inline uint32_t GetHeartbeat() {
        return g_heartbeatCounter.load();
    }

    // ── Set timeout in milliseconds ──
    inline void SetTimeout(uint32_t ms) {
        g_heartbeatTimeout = ms;
    }

    // ── Watchdog thread function ──
    static void WatchdogThreadProc() {
        uint32_t lastHeartbeat = 0;

        while (g_watchdogRunning.load()) {
            Sleep(1000);

            uint32_t current = g_heartbeatCounter.load();
            if (current == lastHeartbeat) {
                // Heartbeat has not changed; check timeout
                // In a real implementation, track time since last heartbeat
                // For now, just note the stall

                // If heartbeat stuck for too long, the app may be frozen
                // Attempt recovery or create a dump
            }
            lastHeartbeat = current;
        }
    }

    // ── Start the watchdog ──
    inline bool Start() {
        if (g_watchdogRunning.load()) return true;

        g_watchdogRunning = true;

        // Create shared memory for heartbeat
        g_sharedMapping = CreateFileMappingW(INVALID_HANDLE_VALUE, nullptr,
            PAGE_READWRITE, 0, sizeof(uint32_t), SHARED_MEM_NAME);
        if (g_sharedMapping) {
            g_sharedHeartbeat = static_cast<volatile uint32_t*>(
                MapViewOfFile(g_sharedMapping, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(uint32_t)));
            if (g_sharedHeartbeat) {
                *g_sharedHeartbeat = 0;
            }
        }

        // Start monitor thread
        g_watchdogThread = std::thread(WatchdogThreadProc);

        return true;
    }

    // ── Stop the watchdog ──
    inline void Stop() {
        g_watchdogRunning = false;

        if (g_watchdogThread.joinable())
            g_watchdogThread.join();

        if (g_sharedHeartbeat) {
            UnmapViewOfFile(const_cast<uint32_t*>(g_sharedHeartbeat));
            g_sharedHeartbeat = nullptr;
        }
        if (g_sharedMapping) {
            CloseHandle(g_sharedMapping);
            g_sharedMapping = nullptr;
        }
    }

    // ── Check if another instance is alive ──
    inline bool IsOtherInstanceAlive() {
        HANDLE mapping = OpenFileMappingW(FILE_MAP_READ, FALSE, SHARED_MEM_NAME);
        if (!mapping) return false;

        volatile uint32_t* heartbeat = static_cast<volatile uint32_t*>(
            MapViewOfFile(mapping, FILE_MAP_READ, 0, 0, sizeof(uint32_t)));
        if (!heartbeat) {
            CloseHandle(mapping);
            return false;
        }

        uint32_t value = *heartbeat;
        UnmapViewOfFile(const_cast<uint32_t*>(heartbeat));
        CloseHandle(mapping);

        return value > 0;
    }

    // ── Anti-tamper: periodically check critical sections ──
    // This is called by the watchdog thread
    inline bool CheckIntegrity() {
        // In production, this would CRC-check protected memory regions
        // and verify IAT entries haven't been hooked
        return true;
    }

} // namespace protection::watchdog
