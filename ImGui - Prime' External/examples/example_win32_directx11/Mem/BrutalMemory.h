#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <vector>
#include <string> 
#include <iostream>
#include <TlHelp32.h>
#include <tchar.h>
#include <winternl.h>
#include <mutex>
#include <map>
#include <future>
#include <random>
#include <imgui_settings.h>
#include "Memory.h"
#include "SmartyMem.h"
#include <mutex>
#include <future>


#pragma comment(lib, "ntdll.lib")

extern std::string MemoryLogs;



class BrutalMemory
{

public:
    DWORD ProcessId = 0;
    HANDLE ProcessHandle;

    typedef struct _MEMORY_REGION
    {
        DWORD_PTR dwBaseAddr;
        DWORD_PTR dwMemorySize;
    }MEMORY_REGION;

    int GetPid(const char* procname)
    {
        if (procname == NULL)
            return 0;

        DWORD pid = 0;
        DWORD threadCount = 0;

        HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnap == INVALID_HANDLE_VALUE)
            return 0;

        PROCESSENTRY32 pe;
        pe.dwSize = sizeof(PROCESSENTRY32);

        if (Process32First(hSnap, &pe))
        {
            do
            {

#ifdef UNICODE
                char exeFile[MAX_PATH];
                size_t convertedChars = 0;
                wcstombs_s(&convertedChars, exeFile, pe.szExeFile, _TRUNCATE);
                if (_stricmp(exeFile, procname) == 0)

#else

                if (_stricmp(pe.szExeFile, procname) == 0)

#endif

                {
                    if ((int)pe.cntThreads > threadCount)
                    {
                        threadCount = pe.cntThreads;
                        pid = pe.th32ProcessID;
                    }
                }
            } while (Process32Next(hSnap, &pe));
        }

        CloseHandle(hSnap);

        return pid;
    }

    const char* GetEmulatorRunning()
    {
        if (GetPid("HD-Player.exe") != 0)
            return "HD-Player.exe";

        else if (GetPid("LdVBoxHeadless.exe") != 0)
            return "LdVBoxHeadless.exe";

        else if (GetPid("MEmuHeadless.exe") != 0)
            return "MEmuHeadless.exe";

        else if (GetPid("LdVBoxHeadless.exe") != 0)
            return "LdVBoxHeadless.exe";

        else if (GetPid("AndroidProcess.exe") != 0)
            return "AndroidProcess.exe";

        else if (GetPid("aow_exe.exe") != 0)
            return "aow_exe.exe";

        else if (GetPid("NoxVMHandle.exe") != 0)
            return "NoxVMHandle.exe";
    }

    struct EntitySpeedHere
    {
        DWORD_PTR addressSpeed;
        std::vector<BYTE> patternSpeed;
    };

    std::vector<EntitySpeedHere> OldSpeed;
    std::vector<DWORD_PTR> NewSpeed;

    struct EntityHere
    {
        std::vector<EntityHere> SpeedoriginalBytesMap;
        DWORD_PTR addressSpeed;

    };



    std::unordered_map<uintptr_t, std::vector<BYTE>> SpeedoriginalBytesMap;











    // Sniper Switch
    std::vector<DWORD_PTR> sniperswitch_addresses;
    bool sniperswitch_loaded = false;

    bool LoadSniperSwitch()
    {
        if (!AttackProcess("HD-Player.exe"))
        {
            MemoryLogs = "Emulator Not Found!";
            return false;
        }

        SYSTEM_INFO si;
        GetSystemInfo(&si);
        DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
        DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

        std::vector<BYTE> SearchSwitch = { 0x00, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x80, 0x3E, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x20, 0x41, 0x00, 0x00, 0x34, 0x42, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x8F, 0xC2, 0x35, 0x3F, 0x9A, 0x99, 0x99, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        sniperswitch_addresses.clear();
        FindPattern(start, end, SearchSwitch.data(), sniperswitch_addresses);

        if (!sniperswitch_addresses.empty())
        {
            sniperswitch_loaded = true;
            MemoryLogs = "Sniper Switch Loaded!";
            return true;
        }

        sniperswitch_loaded = false;
        MemoryLogs = "Sniper Switch Pattern Not Found!";
        return false;
    }

    bool SniperSwitchON()
    {
        if (!sniperswitch_loaded || sniperswitch_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x3C, 0x00, 0x00, 0xF5, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x20, 0x41, 0x00, 0x00, 0x34, 0x42, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x8F, 0xC2, 0x35, 0x3F, 0x9A, 0x99, 0x99, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        for (auto addr : sniperswitch_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Sniper Switch ON!";
        CloseHandle(ProcessHandle);
        return true;
    }

    bool SniperSwitchOFF()
    {
        if (!sniperswitch_loaded || sniperswitch_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x80, 0x3E, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x20, 0x41, 0x00, 0x00, 0x34, 0x42, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x8F, 0xC2, 0x35, 0x3F, 0x9A, 0x99, 0x99, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        for (auto addr : sniperswitch_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Sniper Switch OFF!";
        CloseHandle(ProcessHandle);
        return true;
    }

    // Camera Hack Variables
    std::vector<DWORD_PTR> camera_addresses;
    bool camera_loaded = false;

    bool LoadCamera()
    {
        if (!AttackProcess("HD-Player.exe"))
        {
            MemoryLogs = "Emulator Not Found!";
            return false;
        }

        SYSTEM_INFO si;
        GetSystemInfo(&si);
        DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
        DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

        std::vector<BYTE> SearchCamera = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF };

        camera_addresses.clear();
        FindPattern(start, end, SearchCamera.data(), camera_addresses);

        if (!camera_addresses.empty())
        {
            camera_loaded = true;
            MemoryLogs = "Camera Loaded Successfully!";
            return true;
        }

        camera_loaded = false;
        MemoryLogs = "Camera Pattern Not Found!";
        return false;
    }

    bool CameraON()
    {
        if (!camera_loaded || camera_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF };

        for (auto addr : camera_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Camera Activated!";
        CloseHandle(ProcessHandle);
        return true;
    }

    bool CameraOFF()
    {
        if (!camera_loaded || camera_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF };

        for (auto addr : camera_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Camera Deactivated!";
        CloseHandle(ProcessHandle);
        return true;
    }


    // Fast Landing
    std::vector<DWORD_PTR> fastlanding_addresses;
    bool fastlanding_loaded = false;

    bool LoadFastLanding()
    {
        if (!AttackProcess("HD-Player.exe"))
        {
            MemoryLogs = "Emulator Not Found!";
            return false;
        }

        SYSTEM_INFO si;
        GetSystemInfo(&si);
        DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
        DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

        // Fast Landing scan pattern (original bytes)
        std::vector<BYTE> SearchFastLanding = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0xFF };

        fastlanding_addresses.clear();
        FindPattern(start, end, SearchFastLanding.data(), fastlanding_addresses);

        if (!fastlanding_addresses.empty())
        {
            fastlanding_loaded = true;
            MemoryLogs = "Fast Landing Loaded!";
            return true;
        }

        fastlanding_loaded = false;
        MemoryLogs = "Pattern Not Found!";
        return false;
    }

    bool FastLandingON()
    {
        if (!fastlanding_loaded || fastlanding_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Fast Landing patched bytes (ON)
        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0xFF };

        for (auto addr : fastlanding_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Fast Landing ON!";
        CloseHandle(ProcessHandle);
        return true;
    }

    bool FastLandingOFF()
    {
        if (!fastlanding_loaded || fastlanding_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Fast Landing original bytes (OFF)
        std::vector<BYTE> replace = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0x7F, 0x00, 0x00, 0x80, 0xFF };

        for (auto addr : fastlanding_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Fast Landing OFF!";
        CloseHandle(ProcessHandle);
        return true;
    }



    // Speed Hack
    std::vector<DWORD_PTR> speedhack_addresses;
    bool speedhack_loaded = false;

    bool LoadSpeedHack()
    {
        if (!AttackProcess("HD-Player.exe"))
        {
            MemoryLogs = "Emulator Not Found!";
            return false;
        }

        SYSTEM_INFO si;
        GetSystemInfo(&si);
        DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
        DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

        // Speed Hack scan pattern (original bytes)
        std::vector<BYTE> SearchSpeed = { 0x01, 0x00, 0x00, 0x00, 0x02, 0x2B, 0x07, 0x3D };

        speedhack_addresses.clear();
        FindPattern(start, end, SearchSpeed.data(), speedhack_addresses);

        if (!speedhack_addresses.empty())
        {
            speedhack_loaded = true;
            MemoryLogs = "Speed Hack Loaded!";
            return true;
        }

        speedhack_loaded = false;
        MemoryLogs = "Speed Pattern Not Found!";
        return false;
    }

    bool SpeedHackON()
    {
        if (!speedhack_loaded || speedhack_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Speed Hack patched bytes (ON) - values changed to increase speed
        std::vector<BYTE> replace = { 0x01, 0x00, 0x00, 0x00, 0x92, 0xE4, 0x70, 0x3D };

        for (auto addr : speedhack_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Speed Hack ON!";
        CloseHandle(ProcessHandle);
        return true;
    }

    bool SpeedHackOFF()
    {
        if (!speedhack_loaded || speedhack_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Speed Hack original bytes (OFF)
        std::vector<BYTE> replace = { 0x01, 0x00, 0x00, 0x00, 0x02, 0x2B, 0x07, 0x3D };

        for (auto addr : speedhack_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Speed Hack OFF!";
        CloseHandle(ProcessHandle);
        return true;
    }
    // Glitch Fire
    std::vector<DWORD_PTR> glitchfire_addresses;
    bool glitchfire_loaded = false;

    bool LoadGlitchFire()
    {
        if (!AttackProcess("HD-Player.exe"))
        {
            MemoryLogs = "Emulator Not Found!";
            return false;
        }

        SYSTEM_INFO si;
        GetSystemInfo(&si);
        DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
        DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

        // Glitch Fire scan pattern (original fire rate bytes)
        std::vector<BYTE> SearchGlitch = { 0xC0, 0x41, 0x00, 0x00, 0x10, 0xC1, 0x00, 0x00, 0x90, 0xC1, 0x00, 0x00, 0x70, 0x41, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x3F, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        glitchfire_addresses.clear();
        FindPattern(start, end, SearchGlitch.data(), glitchfire_addresses);

        if (!glitchfire_addresses.empty())
        {
            glitchfire_loaded = true;
            MemoryLogs = "Glitch Fire Loaded!";
            return true;
        }

        glitchfire_loaded = false;
        MemoryLogs = "Glitch Fire Pattern Not Found!";
        return false;
    }

    bool GlitchFireON()
    {
        if (!glitchfire_loaded || glitchfire_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Glitch Fire patched bytes (ON) - fire rate increased
        std::vector<BYTE> replace = { 0xC0, 0x41, 0x00, 0x00, 0x10, 0xC1, 0x00, 0x00, 0x90, 0xC1, 0x00, 0x00, 0x70, 0x41, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x3C, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        for (auto addr : glitchfire_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Glitch Fire ON!";
        CloseHandle(ProcessHandle);
        return true;
    }

    bool GlitchFireOFF()
    {
        if (!glitchfire_loaded || glitchfire_addresses.empty()) return false;
        if (!AttackProcess("HD-Player.exe")) return false;

        // Glitch Fire original bytes (OFF)
        std::vector<BYTE> replace = { 0xC0, 0x41, 0x00, 0x00, 0x10, 0xC1, 0x00, 0x00, 0x90, 0xC1, 0x00, 0x00, 0x70, 0x41, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x3F, 0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x80, 0x3F };

        for (auto addr : glitchfire_addresses)
        {
            SIZE_T written;
            WriteProcessMemory(ProcessHandle, (LPVOID)addr, replace.data(), replace.size(), &written);
        }

        MemoryLogs = "Glitch Fire OFF!";
        CloseHandle(ProcessHandle);
        return true;
    }







    bool SpeedOriginalBytes(uintptr_t address)
    {
        std::vector<BYTE> bytes(256);

        // Read original bytes and store them in the map
        if (ReadProcessMemory(ProcessHandle, reinterpret_cast<LPCVOID>(address), bytes.data(), bytes.size(), nullptr))
        {
            SpeedoriginalBytesMap[address] = bytes;
            return true;
        }

        MemoryLogs += "Failed to read memory at address: " + std::to_string(address) + "\n";
        return false;
    }

    bool RevertSpeed()
    {

        if (SpeedoriginalBytesMap.empty())
        {
            MemoryLogs = "No changes to revert";
            return false;
        }

        for (const auto& entry : SpeedoriginalBytesMap)
        {
            uintptr_t address = entry.first;
            const std::vector<BYTE>& bytes = entry.second;

            if (WriteProcessMemory(ProcessHandle, reinterpret_cast<LPVOID>(address), bytes.data(), bytes.size(), nullptr))
            {
                MemoryLogs += "Successfully reverted changes at address: " + std::to_string(address) + "\n";
            }
            else
            {
                MemoryLogs += "Failed to revert changes at address: " + std::to_string(address) + "\n";
                return false;
            }
        }
        SpeedoriginalBytesMap.clear();
        return true;
    }

    std::vector<BYTE> IntToByteArray(int value)
    {
        std::vector<BYTE> byteArray(sizeof(value));
        BYTE* pValue = reinterpret_cast<BYTE*>(&value);

        for (size_t i = 0; i < sizeof(value); ++i)
        {
            byteArray[i] = pValue[i];
        }

        return byteArray;
    }


    void ReWrite(std::string type, DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* Search, BYTE* Replace)
    {
        if (!AttackProcess(GetEmulatorRunning()))
            MemoryLogs = type + ": An unexpected error occurred";

        MemoryLogs = "Applying - " + type;
        bool Status = ReplacePattern(dwStartRange, dwEndRange, Search, Replace);
        if (Status)
            MemoryLogs = type + " - Disable !";
        else
            MemoryLogs = type + " : Failed to Enable!";

        CloseHandle(ProcessHandle);
    }

    void deWrite(std::string type, DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* Search, BYTE* Replace)
    {
        if (!AttackProcess(GetEmulatorRunning()))
            MemoryLogs = type + ": An unexpected error occurred";;

        bool Status = ReplacePattern(dwStartRange, dwEndRange, Search, Replace);
        if (Status)
            MemoryLogs = type + " - Disabled!";
        else
            MemoryLogs = type + " : Failed to Disable!";

        CloseHandle(ProcessHandle);
    }

    BOOL AttackProcess(const char* procname)
    {
        DWORD p_id = GetPid(GetEmulatorRunning());
        if (p_id == 0)
            return false;

        ProcessId = p_id;
        ProcessHandle = OpenProcess(PROCESS_ALL_ACCESS, 0, ProcessId);
        return ProcessHandle != nullptr;
    }

    bool ReplacePattern(DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* SearchAob, BYTE* ReplaceAob)
    {
        int RepByteSize = _msize(ReplaceAob);
        if (RepByteSize <= 0) return false;
        std::vector<DWORD_PTR> foundedAddress;
        FindPattern(dwStartRange, dwEndRange, SearchAob, foundedAddress);
        if (foundedAddress.empty())
            return false;

        DWORD OldProtect;
        for (int i = 0; i < foundedAddress.size(); i++)
        {
            ZwProtectVirtualMemory(ProcessHandle, (LPVOID)foundedAddress[i], RepByteSize, PAGE_EXECUTE_READWRITE, &OldProtect);
            ZwWriteVirtualMemory(ProcessHandle, (LPVOID)foundedAddress[i], ReplaceAob, RepByteSize, 0);
            ZwProtectVirtualMemory(ProcessHandle, (LPVOID)foundedAddress[i], RepByteSize, PAGE_EXECUTE_READ, &OldProtect);
        }

        return true;
    }


    bool ChangePattern(DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* Search, BYTE* Replace)
    {
        if (!AttackProcess(GetEmulatorRunning())) return false;

        bool Status = ReplacePattern(dwStartRange, dwEndRange, Search, Replace);
        if (Status) return true;
        else return false;

        CloseHandle(ProcessHandle);
    }

    bool HookPattern(DWORD_PTR dwStartRange, DWORD_PTR dwEndRange, BYTE* SearchAob, BYTE* ReplaceAob, std::vector<DWORD_PTR>& AddressRet)
    {
        if (!AttackProcess(GetEmulatorRunning())) return false;
        int RepByteSize = _msize(ReplaceAob);
        if (RepByteSize <= 0) return false;

        if (AddressRet.empty())
        {
            FindPattern(dwStartRange, dwEndRange, SearchAob, AddressRet);
            if (AddressRet.empty()) return false;

            DWORD OldProtect;
            for (int i = 0; i < AddressRet.size(); i++)
            {
                WriteProcessMemory(ProcessHandle, (LPVOID)AddressRet[i], ReplaceAob, RepByteSize, 0);
            }

            return true;
        }
        else {
            DWORD OldProtect;
            for (int i = 0; i < AddressRet.size(); i++)
            {
                WriteProcessMemory(ProcessHandle, (LPVOID)AddressRet[i], ReplaceAob, RepByteSize, 0);
            }
            return true;
        }
        CloseHandle(ProcessHandle);
    }

    bool FindPattern(DWORD_PTR StartRange, DWORD_PTR EndRange, BYTE* SearchBytes, std::vector<DWORD_PTR>& AddressRet) {
        MEMORY_BASIC_INFORMATION mbi;
        mbi.RegionSize = 0x1000;
        DWORD_PTR dwAddress = StartRange;
        DWORD_PTR nSearchSize = _msize(SearchBytes);

        std::vector<MEMORY_REGION> m_vMemoryRegion;

        // Collect all memory regions
        while (VirtualQueryEx(ProcessHandle, (LPCVOID)dwAddress, &mbi, sizeof(mbi)) && (dwAddress < EndRange) && ((dwAddress + mbi.RegionSize) > dwAddress)) {
            if ((mbi.State == MEM_COMMIT) && ((mbi.Protect & PAGE_GUARD) == 0) && (mbi.Protect != PAGE_NOACCESS) && ((mbi.AllocationProtect & PAGE_NOCACHE) != PAGE_NOCACHE)) {
                MEMORY_REGION mData = { (DWORD_PTR)mbi.BaseAddress, mbi.RegionSize };
                m_vMemoryRegion.push_back(mData);
            }
            dwAddress = (DWORD_PTR)mbi.BaseAddress + mbi.RegionSize;
        }

        std::mutex mtx;

        auto processRegion = [&](MEMORY_REGION mData) {
            BYTE* pCurrMemoryData = new BYTE[mData.dwMemorySize];
            ZeroMemory(pCurrMemoryData, mData.dwMemorySize);
            DWORD_PTR dwNumberOfBytesRead = 0;

            // Read process memory
            ReadProcessMemory(ProcessHandle, (LPCVOID)mData.dwBaseAddr, pCurrMemoryData, mData.dwMemorySize, &dwNumberOfBytesRead);
            if ((int)dwNumberOfBytesRead > 0) {
                DWORD_PTR dwOffset = 0;
                int iOffset = Memfind(pCurrMemoryData, dwNumberOfBytesRead, SearchBytes, nSearchSize);
                while (iOffset != -1) {
                    dwOffset += iOffset;
                    DWORD_PTR firstByteAddress = dwOffset + mData.dwBaseAddr;

                    std::lock_guard<std::mutex> lock(mtx);
                    AddressRet.push_back(firstByteAddress);

                    dwOffset += nSearchSize;
                    iOffset = Memfind(pCurrMemoryData + dwOffset, dwNumberOfBytesRead - dwOffset - nSearchSize, SearchBytes, nSearchSize);
                }
            }

            delete[] pCurrMemoryData;
            };

        // Launch threads to process memory regions concurrently
        std::vector<std::future<void>> futures;
        for (const auto& region : m_vMemoryRegion) {
            futures.push_back(std::async(std::launch::async, processRegion, region));
        }


        for (auto& fut : futures)
        {
            fut.get();
        }

        return true;
    }
    int Memfind(BYTE* buffer, DWORD_PTR dwBufferSize, BYTE* bstr, DWORD_PTR dwStrLen) {
        if (dwBufferSize < 0) {
            return -1;
        }
        DWORD_PTR  i, j;
        for (i = 0; i < dwBufferSize; i++) {
            for (j = 0; j < dwStrLen; j++) {
                if (buffer[i + j] != bstr[j] && bstr[j] != '?')
                    break;

            }
            if (j == dwStrLen)
                return i;
        }
        return -1;
    }
};
