#include "main.h"
#include "Auth/AuthSys.hpp"

AuthSys::api AuthSysApp(
    "ATOI",
    "ThJO7EjJCAGc",
    "f6b2fc03ab0e8e754d1919996c0de8f6fe56b8aad5562fb0698b559367f7d3f2",
    "1.0.0",
    "https://authsys-main-production.up.railway.app/api/v1"
);
#include "Mem/SmartyMem2.h"
#include "Mem/SmartyMem.h"
#include "Mem/BrutalMemory.h"
#include "Notifications.h"
#include "Sound/Welcome_Sound.h"
#include "Sound/Welcome_Baby.h"
#include "Sound/Activated.h"
#include <mmsystem.h>
#include <stdio.h>
#include <urlmon.h>
#include "DiscordRPC/DiscordWebhook.h" 
#include "FakeLag/windivert.h"
#include "FakeLag/FakeLag.h"
#include "FakeLag/FakeLagMonitor.h"
#include "DynamicSelector.h"
#include "Xyz/PCCleaner.h"
#include "Xyz/PCOptimizer.h"
#include "Xyz/PopupDialog.h"
#include "Xyz/VirusScanner.h"
#include <atomic>
#include <chrono>
#include <unordered_map>
#include "Mem/SuperFastMemory.h"

#pragma comment(lib, "WinDivert.lib")
#pragma comment(lib, "urlmon.lib")
#pragma comment(lib, "winmm.lib")

using namespace std;
using namespace KeyAuth;
using namespace ImStyle;
using namespace ImStyle::elements;
using namespace ImStyle::text;
#define SNOW_LIMIT 20

std::string MemoryLogs;


SuperFastMemory fastMem;

Memory elite;

BrutalMemory mirza;
SmartyMemory Smarty2;
BrutalMemory brutalmem;

CNotifications p_notif;

ImVec4 accent_color = ImVec4(0.00f, 0.94f, 1.00f, 1.00f);











ImU32 ColorWithAlpha(ImU32 col, float alpha) {
    return ImColor(
        (int)((col >> IM_COL32_R_SHIFT) & 0xFF),
        (int)((col >> IM_COL32_G_SHIFT) & 0xFF),
        (int)((col >> IM_COL32_B_SHIFT) & 0xFF),
        (int)(alpha * 255.f)
    );
}


ImU32 faded = ColorWithAlpha(ImGui::GetColorU32(text::active), 0.5f);





bool fake_lag_enabled = false;
bool fake_lag_driver_loaded = false;
bool fake_lag_aim_lag_active = true;
bool fake_lag_freeze_active = false;
int fake_lag_aim_key = 0;
int fake_lag_freeze_key = 0;
int fake_lag_delay = 1;
std::string fake_lag_error = "";
HANDLE fake_lag_handle = NULL;
std::thread* fake_lag_thread = nullptr;
bool fake_lag_running = false;



static bool aimbot_visible_enabled = false;

static bool show_popup = false;
static bool pc_optimize_clicked = false;







bool use_beep_sound = false;
static int aimbot_type = 0; // 0=Head, 1=Drag, 2=Neck
static bool is_injecting = false;


bool fastlanding_loaded = false;
bool fastlanding_active = false;
static int fastlanding_key = 0;

bool camera_loaded = false;
bool camera_active = false;
static int camera_hack_key = 0;

bool authenticated = false;

bool fixchams = false;
bool streamer_mode = false;
bool sound_muted = false;
bool chams_dll_loaded = false;



bool aimbot_external = false;
bool aimbot_drag = false;
bool sniper_scope = false;
bool sniper_tracking = false;
bool sniper_aim = false;
bool sniperswitch_loaded = false;
bool sniperswitch_active = false;
static int sniperswitch_key = 0;
bool sniper_fix = false;
bool chams_menu = false;
bool chams_hologram = false;
bool chams_box = false;
bool chams_wukong = false;
bool load_camera = false;
bool activate_camera = false;
bool load_wallhack = false;
bool activate_wallhack = false;


static int aimbot_e_key;
static int aimbot_d_key;
static int speed_key = 0;
static int speed_mode = 0;
bool speed_loaded = false;
bool speed_active = false;
static int camera_key;
static int wallhack_key;
static int glitchfire_key = 0;
static int glitchfire_mode = 0;
bool glitchfire_loaded = false;
bool glitchfire_active = false;

static int aimbotdrkey;

int entityspeed = 0;
int fastlanding_mode = 0;
int camera_mode = 0;
int sniper_delay = 330;

bool aimbothead = false;



DWORD picker_flags = ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_AlphaBar | ImGuiColorEditFlags_NoInputs | ImGuiColorEditFlags_AlphaPreview;



std::vector<Snowflake::Snowflake> snow;



int tabs = 0;

float timer_loading = 0.f;

DWORD win_flags = ImGuiWindowFlags_NoBackground | ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoMove;













static int aimbot_ai_key = 0;           // Keybind
static bool aimbot_ai_checkbox = false; // Checkbox
static bool aimbot_ai_loaded = false;   // Pre-loaded?
static std::vector<DWORD_PTR> aimbot_ai_addrs;


void AimbotAi_PreLoad()
{
    if (!elite.AttackProcess("HD-Player.exe"))
    {
        aimbot_ai_loaded = false;
        return;
    }

    SYSTEM_INFO si;
    GetSystemInfo(&si);
    DWORD_PTR startAddr = (DWORD_PTR)si.lpMinimumApplicationAddress;
    DWORD_PTR endAddr = (DWORD_PTR)si.lpMaximumApplicationAddress;

    std::vector<BYTE> pattern = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA5, 0x43, '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 0x80, 0xBF };

    std::vector<DWORD_PTR> results;
    mirza.FindPattern(startAddr, endAddr, pattern.data(), results);
    CloseHandle(mirza.ProcessHandle);

    if (!results.empty())
    {
        aimbot_ai_addrs = results;
        aimbot_ai_loaded = true;
        p_notif.AddMessage("AI Ready - Hold LMB", "b", ImGui::GetColorU32(accent_primary));
    }
    else
    {
        aimbot_ai_loaded = false;
        p_notif.AddMessage("Pattern Not Found!", "b", ImColor(255, 100, 100));
    }
}

void AimbotAi_Write()
{
    if (!aimbot_ai_loaded || aimbot_ai_addrs.empty()) return;
    if (!elite.AttackProcess("HD-Player.exe")) return;

    for (DWORD_PTR baseAddr : aimbot_ai_addrs)
    {
        int head = 0;
        if (!ReadProcessMemory(mirza.ProcessHandle, (LPCVOID)(baseAddr + 0xF5), &head, sizeof(int), NULL))
            continue;
        if (head == 0) continue;

        WriteProcessMemory(mirza.ProcessHandle, (LPVOID)(baseAddr - 0x35B), &head, sizeof(int), NULL);
    }

    CloseHandle(mirza.ProcessHandle);
}








// Sniper Scope System
bool sniper_scope_loaded = false;
bool sniper_scope_active = false;
bool sniper_scope_fired = false;
std::vector<DWORD_PTR> sniper_addresses;
static int sniper_scope_key = 0; // 0 = not set
DWORD sniper_last_fire_time = 0;

std::vector<BYTE> sniper_original = { 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x9A, 0x99, 0x99, 0x3E, 0xFF, 0xFF, 0xFF, 0xFF, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x60, 0x40, 0xCD, 0xCC, 0x8C, 0x3F, 0x8F, 0xC2, 0xF5, 0x3C, 0xCD, 0xCC, 0xCC, 0x3D, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x33, 0x33, 0x13, 0x40, 0x00, 0x00, 0xB0, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x01 };

std::vector<BYTE> sniper_patched = { 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x9A, 0x99, 0x99, 0x3E, 0xFF, 0xFF, 0xFF, 0xFF, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x60, 0x40, 0xCD, 0xCC, 0x8C, 0x3F, 0x8F, 0xC2, 0xF5, 0x3C, 0xCD, 0xCC, 0xCC, 0x3D, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x33, 0x33, 0x13, 0x40, 0x00, 0x00, 0xB0, 0x3F, 0x00, 0x00, 0x80, 0x3F, 0x01 };



void SniperScopeLoad()
{
    if (!mirza.AttackProcess("HD-Player.exe"))
    {
        p_notif.AddMessage("Emulator Not Found!", "b", ImGui::GetColorU32(accent_primary));
        return;
    }

    p_notif.AddMessage("Scanning Pattern...", "b", ImGui::GetColorU32(accent_primary));

    SYSTEM_INFO si;
    GetSystemInfo(&si);
    DWORD_PTR start = (DWORD_PTR)si.lpMinimumApplicationAddress;
    DWORD_PTR end = (DWORD_PTR)si.lpMaximumApplicationAddress;

    std::vector<DWORD_PTR> results;
    mirza.FindPattern(start, end, sniper_original.data(), results);

    if (!results.empty())
    {
        sniper_addresses = results;
        sniper_scope_loaded = true;

        if (!sound_muted) {
            Beep(500, 500);
        }
        p_notif.AddMessage("Sniper Scope Loaded!", "b", ImGui::GetColorU32(accent_primary));
    }
    else
    {
        sniper_addresses.clear();
        sniper_scope_loaded = false;
        p_notif.AddMessage("Pattern Not Found!", "b", ImGui::GetColorU32(accent_primary));
    }

    CloseHandle(mirza.ProcessHandle);
}

void SniperScopeFire()
{
    if (!sniper_scope_loaded || sniper_addresses.empty()) return;
    if (!mirza.AttackProcess("HD-Player.exe")) return;

    // Write patched bytes
    for (auto addr : sniper_addresses)
    {
        SIZE_T written;
        WriteProcessMemory(mirza.ProcessHandle, (LPVOID)addr,
            sniper_patched.data(), sniper_patched.size(), &written);
    }

    sniper_scope_fired = true;
    sniper_last_fire_time = GetTickCount();

    CloseHandle(mirza.ProcessHandle);
}

void SniperScopeRestore()
{
    if (!sniper_scope_fired) return;
    if (!mirza.AttackProcess("HD-Player.exe")) return;

    // Restore original bytes
    for (auto addr : sniper_addresses)
    {
        SIZE_T written;
        WriteProcessMemory(mirza.ProcessHandle, (LPVOID)addr,
            sniper_original.data(), sniper_original.size(), &written);
    }

    sniper_scope_fired = false;
    CloseHandle(mirza.ProcessHandle);
}








// ⚡ Super Fast Aimbot (0.01 second)
void AimbotHead_SuperFast()
{
    if (is_injecting) return;
    is_injecting = true;

    // ✅ Attack process (instant return if already attached)
    if (!fastMem.AttackProcess("HD-Player.exe"))
    {
        p_notif.AddMessage("Process not found!", "b", ImColor(255, 0, 0));
        is_injecting = false;
        return;
    }

    // ✅ Scan first time, then read from cache
    static std::vector<DWORD_PTR> addresses;
    static bool loaded = false;

    if (!loaded)
    {
        SYSTEM_INFO si;
        GetSystemInfo(&si);

        std::vector<BYTE> pattern = {
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?',
            '?', '?', '?', '?', '?', '?', '?', '?',
            0x00, 0x00, 0x00, 0x00,
            '?', '?', '?', '?',
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA5, 0x43,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        };

        fastMem.FindPattern((DWORD_PTR)si.lpMinimumApplicationAddress,
            (DWORD_PTR)si.lpMaximumApplicationAddress,
            pattern.data(), addresses);
        loaded = true;
        p_notif.AddMessage(("Cached " + std::to_string(addresses.size()) + " addresses").c_str(),
            "b", ImGui::GetColorU32(accent_primary));
    }

        // ✅ Super fast swap (using NT syscalls)
    int success = 0;
    for (auto addr : addresses)
    {
        if (fastMem.SwapValues(addr + 0x88, addr + 0x8C))
        {
            success++;
        }
    }

    if (success > 0)
    {
        if (!sound_muted) {
            if (use_beep_sound) Beep(800, 100);
            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
        }
        p_notif.AddMessage(("Injected to " + std::to_string(success) + " addrs!").c_str(),
            "b", ImGui::GetColorU32(accent_primary));
    }

    is_injecting = false;
}

// ⚡ Batch operation - even faster (read all then write all)
void AimbotHead_Batch()
{
    if (is_injecting) return;
    is_injecting = true;

    if (!fastMem.AttackProcess("HD-Player.exe"))
    {
        p_notif.AddMessage("Process not found!", "b", ImColor(255, 0, 0));
        is_injecting = false;
        return;
    }

    static std::vector<DWORD_PTR> addresses;
    static bool loaded = false;

    if (!loaded)
    {
        // Pattern scan...
        loaded = true;
    }

    // ✅ Batch read - read all values in one call
    std::vector<int> values1, values2;
    fastMem.BatchRead(addresses, values1, 0x88);
    fastMem.BatchRead(addresses, values2, 0x8C);

    // ✅ Batch write - write all values in one call
    fastMem.BatchWrite(addresses, values2, 0x88);
    fastMem.BatchWrite(addresses, values1, 0x8C);

    if (!sound_muted) {
        if (use_beep_sound) Beep(800, 100);
        else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
    }

    p_notif.AddMessage("Batch injected!", "b", ImGui::GetColorU32(accent_primary));
    is_injecting = false;
}






void AimbotHead()
{
    if (is_injecting) return;
    is_injecting = true;

    SYSTEM_INFO si;
    GetSystemInfo(&si);
    DWORD_PTR startAddress = (DWORD_PTR)si.lpMinimumApplicationAddress;
    DWORD_PTR endAddress = (DWORD_PTR)si.lpMaximumApplicationAddress;

    p_notif.AddMessage("Applying Aimbot Head", "b", ImGui::GetColorU32(accent_primary));

    // ✅ Temporary memory object
    SmartyMemory tempMemory;

    if (tempMemory.AttackProcess("HD-Player.exe"))
    {
        std::vector<DWORD_PTR> aimbot_new;
        std::vector<BYTE> SearchAimbot = { 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 0x00, 0x00, 0x00, 0x00, '?', '?', '?', '?', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA5, 0x43, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

        tempMemory.FindPattern(startAddress, endAddress, SearchAimbot.data(), aimbot_new);

        if (aimbot_new.empty())
        {
            p_notif.AddMessage("Pattern not found!", "b", ImGui::GetColorU32(accent_primary));
            CloseHandle(tempMemory.ProcessHandle);
            is_injecting = false;
            return;
        }

        int successCount = 0;

        for (auto result : aimbot_new)
        {
            int originalValue, originalValuex;

            // ✅ 1st READ at 0x88
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0x81), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0x81) << "\n";
                continue;
            }

            // ✅ 2nd READ at 0x8C
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0x85), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0x85) << "\n";
                continue;
            }

            // ✅ 1st WRITE at 0x88 (swap with originalValuex)
            if (!WriteProcessMemory(tempMemory.ProcessHandle, (LPVOID)(result + 0x81), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0x81) << "\n";
                continue;
            }

            // ✅ 2nd WRITE at 0x8C (swap with originalValue)
            if (!WriteProcessMemory(tempMemory.ProcessHandle, (LPVOID)(result + 0x85), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0x85) << "\n";
                continue;
            }

            // ✅ VERIFICATION - Read new value
            int newValue;
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0x85), &newValue, sizeof(newValue), NULL)) {
                std::cerr << "Failed to read new value at address: " << std::hex << (result + 0x85) << "\n";
                continue;
            }

            std::cout << "New value at 0x" << std::hex << (result + 0x85) << ": " << std::dec << newValue << "\n";
            successCount++;
        }

        // ✅ Close handle after all operations
        CloseHandle(tempMemory.ProcessHandle);

        if (successCount > 0)
        {
            if (!sound_muted) {
                if (use_beep_sound) {
                    Beep(800, 300);
                }
                else {
                    PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                }
            }
            p_notif.AddMessage(("Successfully applied to " + std::to_string(successCount) + " addresses").c_str(), "b", ImGui::GetColorU32(accent_primary));
        }
        else
        {
            p_notif.AddMessage("Failed to write memory!", "b", ImGui::GetColorU32(accent_primary));
        }
    }
    else
    {
        p_notif.AddMessage("Failed to attach to process!", "b", ImGui::GetColorU32(accent_primary));
    }

    is_injecting = false;
}



void AimbotDrag() {

    if (is_injecting) return;
    is_injecting = true;
    SYSTEM_INFO si;
    GetSystemInfo(&si);
    DWORD_PTR startAddress = (DWORD_PTR)si.lpMinimumApplicationAddress;
    DWORD_PTR endAddress = (DWORD_PTR)si.lpMaximumApplicationAddress;


    p_notif.AddMessage("Applying", "b", ImGui::GetColorU32(accent_primary));


    if (mirza.AttackProcess("HD-Player.exe")) {

        std::vector<DWORD_PTR> aimbot_new;
        std::vector<BYTE> SearchAimbot = { 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xE0, 0xB9, 0x0C, 0xB2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F, 0x31, 0x43, 0xF2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x02, 0x02, 0x00, 0x00, 0x00, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F, 0x31, 0x43, 0xF2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x09, 0x09, 0x00, 0x00, 0x00, 0x09, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA0, 0xBF, 0x43, 0xBA, 0xA0, 0xBF, 0x43, 0xBA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0xE8, 0x45, 0xBA, 0x58, 0x37, 0x54, 0xAF, 0x58, 0x37, 0x54, 0xAF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x99, 0xC1, 0x84, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x58, 0x9E, 0x4E, 0x94, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F };


        mirza.FindPattern(startAddress, endAddress, SearchAimbot.data(), aimbot_new);


        for (auto result : aimbot_new) {
            int originalValue, originalValuex;

            if (!ReadProcessMemory(mirza.ProcessHandle, (LPCVOID)(result + 0x218), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0x218) << "\n";
                continue;
            }
            if (!ReadProcessMemory(mirza.ProcessHandle, (LPCVOID)(result + 0x214), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0x214) << "\n";
                continue;
            }
            if (!WriteProcessMemory(mirza.ProcessHandle, (LPVOID)(result + 0x218), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0x218) << "\n";
                continue;
            }
            if (!WriteProcessMemory(mirza.ProcessHandle, (LPVOID)(result + 0x214), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0x214) << "\n";

                continue;
            }
            int newValue;
            if (!ReadProcessMemory(mirza.ProcessHandle, (LPCVOID)(result + 0x214), &newValue, sizeof(newValue), NULL)) {
                std::cerr << "Failed to read new value at address: " << std::hex << (result + 0x214) << "\n";
                continue;
            }
            std::cout << "New value at 0x" << std::hex << (result + 0x214) << ": " << std::dec << newValue << "\n";
        }
        CloseHandle(mirza.ProcessHandle);

        if (!sound_muted) {
            if (use_beep_sound) {
                Beep(800, 300);  // High pitch beep for success
            }
            else {
                PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
            }
        }
        p_notif.AddMessage("Successfully applied", "b", ImGui::GetColorU32(accent_primary));

    }

    else {

        p_notif.AddMessage("Failed To Apply!", "b", ImGui::GetColorU32(accent_primary));
    }

    is_injecting = false;
}

void AimbotNeck()
{
    if (is_injecting) return;
    is_injecting = true;

    SYSTEM_INFO si;
    GetSystemInfo(&si);
    DWORD_PTR startAddress = (DWORD_PTR)si.lpMinimumApplicationAddress;
    DWORD_PTR endAddress = (DWORD_PTR)si.lpMaximumApplicationAddress;

    p_notif.AddMessage("Applying Aimbot Neck", "b", ImGui::GetColorU32(accent_primary));

    // ✅ Temporary memory object
    SmartyMemory tempMemory;

    if (tempMemory.AttackProcess("HD-Player.exe"))
    {
        std::vector<DWORD_PTR> aimbot_new;
        std::vector<BYTE> SearchAimbot = { 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA5, 0x43 };

        tempMemory.FindPattern(startAddress, endAddress, SearchAimbot.data(), aimbot_new);

        if (aimbot_new.empty())
        {
            p_notif.AddMessage("Pattern not found!", "b", ImGui::GetColorU32(accent_primary));
            CloseHandle(tempMemory.ProcessHandle);
            is_injecting = false;
            return;
        }

        int successCount = 0;

        for (auto result : aimbot_new)
        {
            int originalValue, originalValuex;

            // ✅ 1st READ at 0xB8
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0xB8), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0xB8) << "\n";
                continue;
            }

            // ✅ 2nd READ at 0xB4
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0xB4), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to read memory at address: " << std::hex << (result + 0xB4) << "\n";
                continue;
            }

            // ✅ 1st WRITE at 0xB8 (swap with originalValuex)
            if (!WriteProcessMemory(tempMemory.ProcessHandle, (LPVOID)(result + 0xB8), &originalValuex, sizeof(originalValuex), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0xB8) << "\n";
                continue;
            }

            // ✅ 2nd WRITE at 0xB4 (swap with originalValue)
            if (!WriteProcessMemory(tempMemory.ProcessHandle, (LPVOID)(result + 0xB4), &originalValue, sizeof(originalValue), NULL)) {
                std::cerr << "Failed to write memory at address: " << std::hex << (result + 0xB4) << "\n";
                continue;
            }

            // ✅ VERIFICATION - Read new value
            int newValue;
            if (!ReadProcessMemory(tempMemory.ProcessHandle, (LPCVOID)(result + 0xB4), &newValue, sizeof(newValue), NULL)) {
                std::cerr << "Failed to read new value at address: " << std::hex << (result + 0xB4) << "\n";
                continue;
            }

            std::cout << "New value at 0x" << std::hex << (result + 0xB4) << ": " << std::dec << newValue << "\n";
            successCount++;
        }

        // ✅ Close handle after all operations
        CloseHandle(tempMemory.ProcessHandle);

        if (successCount > 0)
        {
            if (!sound_muted) {
                if (use_beep_sound) {
                    Beep(800, 300);
                }
                else {
                    PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                }
            }
            p_notif.AddMessage(("Successfully applied to " + std::to_string(successCount) + " addresses").c_str(), "b", ImGui::GetColorU32(accent_primary));
        }
        else
        {
            p_notif.AddMessage("Failed to write memory!", "b", ImGui::GetColorU32(accent_primary));
        }
    }
    else
    {
        p_notif.AddMessage("Failed to attach to process!", "b", ImGui::GetColorU32(accent_primary));
    }

    is_injecting = false;
}














void LoginManual()
{
    std::string user_str(KeyAuth_USER_user_char);
    std::string pass_str(KeyAuth_USER_pass_char);

    AuthSysApp.login(user_str, pass_str);

    if (!AuthSysApp.sessionid.empty()) {
        PlaySoundA((LPCSTR)Welcome_Baby, NULL, SND_MEMORY | SND_ASYNC);
        p_notif.AddMessage("Successfully Logged In", "b", ImGui::GetColorU32(ImStyle::general_color));
        
        tabs = 0;
        authenticated = true;
        hide_login = true;

        std::string usernameDisplay = "User: " + AuthSysApp.user_data.username;
        std::string expiryDisplay = "Expiry: Lifetime";

        static char usernameBuf[64];
        static char expiryBuf[64];
        strncpy(usernameBuf, usernameDisplay.c_str(), sizeof(usernameBuf));
        strncpy(expiryBuf, expiryDisplay.c_str(), sizeof(expiryBuf));

        DiscordEventHandlers handle;
        memset(&handle, 0, sizeof(handle));
        Discord_Initialize("1371392284440006656", &handle, 1, NULL);

        DiscordRichPresence discordPresence;
        memset(&discordPresence, 0, sizeof(discordPresence));
        discordPresence.details = usernameBuf;
        discordPresence.state = expiryBuf;
        discordPresence.startTimestamp = std::time(0);
        discordPresence.largeImageKey = "https://i.ibb.co/qL3XJb2P/Chat-GPT-Image-May-5-2025-11-09-07-PM.png";
        discordPresence.largeImageText = "Nyzro Cipher";
        discordPresence.smallImageKey = "https://i.gifer.com/3OWpa.gif";
        discordPresence.button1_label = "Nyzro Cipher";
        discordPresence.button1_url = "https://discord.gg/SXXN9nKxR9";
        discordPresence.button2_label = "Join Discord";
        discordPresence.button2_url = "https://discord.gg/SXXN9nKxR9";

        Discord_UpdatePresence(&discordPresence);
    }
    else {
        p_notif.AddMessage("Login Failed", "b", ImColor(255, 0, 0));
        authenticated = false;
    }
}

int APIENTRY WinMain(HINSTANCE, HINSTANCE, LPSTR, int)
{
    AuthSysApp.init();
    const char* targetProcessName = "HD-Player.exe";

    if (FirstStart == true)
    {
        FirstStart = false;
    }

    WNDCLASSEXW wc;
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_CLASSDC;
    wc.lpfnWndProc = WndProc;
    wc.cbClsExtra = NULL;
    wc.cbWndExtra = NULL;
    wc.hInstance = nullptr;
    wc.hIcon = LoadIcon(0, IDI_APPLICATION);
    wc.hCursor = LoadCursor(0, IDC_ARROW);
    wc.hbrBackground = nullptr;
    wc.lpszMenuName = L"ImGui";
    wc.lpszClassName = L"Example";
    wc.hIconSm = LoadIcon(0, IDI_APPLICATION);

    RegisterClassExW(&wc);
    hwnd = CreateWindowExW(NULL, wc.lpszClassName, L"Example", WS_POPUP, (GetSystemMetrics(SM_CXSCREEN) / 2) - (window::size.x / 2), (GetSystemMetrics(SM_CYSCREEN) / 2) - (window::size.y / 2), window::size.x, window::size.y, 0, 0, 0, 0);

    MARGINS margins = { -1 };
    DwmExtendFrameIntoClientArea(hwnd, &margins);

    POINT mouse;
    rc = { 0 };
    GetWindowRect(hwnd, &rc);

    if (!CreateDeviceD3D(hwnd))
    {
        CleanupDeviceD3D();
        ::UnregisterClassW(wc.lpszClassName, wc.hInstance);
        return 1;
    }

    ::ShowWindow(hwnd, SW_SHOWDEFAULT);
    ::UpdateWindow(hwnd);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();

    ImGuiIO& io = ImGui::GetIO(); (void)io;
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableGamepad;

    ImFontConfig cfg;
    cfg.FontBuilderFlags = ImGuiFreeTypeBuilderFlags_NoHinting | ImGuiFreeTypeBuilderFlags_LightHinting | ImGuiFreeTypeBuilderFlags_LoadColor;

    io.Fonts->AddFontFromMemoryTTF(poppins, sizeof(poppins), 23.f, &cfg, io.Fonts->GetGlyphRangesCyrillic());

    static const ImWchar icomoon_ranges[] = { 0xF000, 0xF3FF, 0 };

    static ImFontConfig icomoon_config;
    icomoon_config.OversampleH = icomoon_config.OversampleV = 1;
    icomoon_config.MergeMode = true;
    icomoon_config.GlyphOffset.y = 6.5f;
    icomoon_config.FontBuilderFlags |= ImGuiFreeTypeBuilderFlags_LoadColor;

    poppins_reg = io.Fonts->AddFontFromMemoryTTF(&poppins, sizeof poppins, 23, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    fonts::roboto = io.Fonts->AddFontFromMemoryTTF(&roboto, sizeof roboto, 45, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    lexend_reg = io.Fonts->AddFontFromMemoryTTF(&lexend_regular, sizeof lexend_regular, 14, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    lexend_b = io.Fonts->AddFontFromMemoryTTF(lexend_regular, sizeof(lexend_regular), 19, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    icon_widget = io.Fonts->AddFontFromMemoryTTF(icomoon_widget, sizeof(icomoon_widget), 15.f, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    fonts::icon = io.Fonts->AddFontFromMemoryTTF(&ico, sizeof ico, 35, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    icon_moon2 = io.Fonts->AddFontFromMemoryTTF(&icomoon2, sizeof icomoon2, 35, NULL, io.Fonts->GetGlyphRangesCyrillic());
    icomoon_widget2 = io.Fonts->AddFontFromMemoryTTF(icomoonw2, sizeof(icomoonw2), 16.f, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    icon_moon = io.Fonts->AddFontFromMemoryTTF(&icomoon, sizeof icomoon, 20, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    inter = io.Fonts->AddFontFromMemoryTTF(inter_semibold, sizeof(inter_semibold), 17.f, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    notif_font = io.Fonts->AddFontFromMemoryCompressedBase85TTF(icomoon_compressed_data_base85, 25.f, &icomoon_config, icomoon_ranges);
    fonts::jupiter = io.Fonts->AddFontFromMemoryTTF(&jupiter_mission, sizeof jupiter_mission, 40, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    ImFont* jupiter_mini = io.Fonts->AddFontFromMemoryTTF(&jupiter_mission, sizeof jupiter_mission, 30, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    ImFont* jupiter_anim = io.Fonts->AddFontFromMemoryTTF(&jupiter_mission, sizeof jupiter_mission, 48, &cfg, io.Fonts->GetGlyphRangesCyrillic());
    ImFont* poppins_mini = io.Fonts->AddFontFromMemoryTTF(&poppins, sizeof poppins, 18, &cfg, io.Fonts->GetGlyphRangesCyrillic());

    io.Fonts->Build();

    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX11_Init(g_pd3dDevice, g_pd3dDeviceContext);

    ImVec4 clear_color = ImVec4(0.45f, 0.55f, 0.60f, 1.00f);

    // ═══════════════════════════════════
    // UI Hide Key - declare once here
    // ═══════════════════════════════════
    static int ui_hide_key = VK_INSERT;
    static bool menu_visible = true;



    static bool show_optimize_popup = false;
    static std::atomic<bool> optimizing{false};
    static bool optimize_dialog_open = false;
    static bool pc_cleaner_clicked = false;

    static bool scan_virus_clicked = false;
    static bool show_scan_popup = false;
    static std::atomic<bool> virus_scanning{false};
    static bool scan_dialog_open = false;
    static int threat_count = 0;



    bool done = false;
    while (!done)
    {
        MSG msg;
        while (::PeekMessage(&msg, NULL, 0U, 0U, PM_REMOVE))
        {
            ::TranslateMessage(&msg);
            ::DispatchMessage(&msg);
            if (msg.message == WM_QUIT)
                done = true;
        }
        if (done)
            break;

        // ═══════════════════════════════════
        // UI Hide Key toggle
        // ═══════════════════════════════════
        if (GetAsyncKeyState(ui_hide_key) & 1) {
            menu_visible = !menu_visible;

            if (menu_visible) {
                ShowWindow(hwnd, SW_SHOW);
            }
            else {
                ShowWindow(hwnd, SW_HIDE);
            }
        }

        // Keybind section (before ImGui frame)
        if (!ImGui::IsAnyItemActive() && aimbot_e_key != 0 && GetAsyncKeyState(aimbot_e_key) & 0x8000) {
            if (!is_injecting) {
                std::thread([]() {
                    if (aimbot_type == 0)      AimbotHead();
                    else if (aimbot_type == 1) AimbotDrag();
                    else if (aimbot_type == 2) AimbotNeck();
                    }).detach();
                Sleep(200);
            }
        }





        // CHECKBOX (UI UPDATES) - LMB Hold
        if (aimbot_ai_checkbox && aimbot_ai_loaded)
        {
            bool lmb = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
            if (lmb)
            {
                AimbotAi_Write();
                Sleep(10);
            }
        }


        // CHECKBOX (UI UPDATES) - LMB Hold
        if (aimbot_ai_checkbox && aimbot_ai_loaded)
        {
            bool lmb = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
            if (lmb)
            {
                AimbotAi_Write();
                Sleep(10);
            }
        }













        // ═══════════════════════════════════
 // Sniper Scope Keybind (FIXED - No Frame Loop)
 // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && sniper_scope_loaded && sniper_scope_key != 0)
        {
            static bool was_key_held = false;  // ✅ Track previous state
            bool key_held = false;
            bool is_mouse_key = false;

            // Check if set key is MOUSE button
            if (sniper_scope_key == VK_LBUTTON || sniper_scope_key == VK_RBUTTON ||
                sniper_scope_key == VK_XBUTTON1 || sniper_scope_key == VK_XBUTTON2 ||
                sniper_scope_key == VK_MBUTTON)
            {
                is_mouse_key = true;
            }

            if (is_mouse_key)
            {
                SHORT keyState = GetAsyncKeyState(sniper_scope_key);
                key_held = (keyState & 0x8000) != 0;

                bool keyboard_pressed = false;
                for (int k = 0x01; k <= 0xFE; k++)
                {
                    if (k == VK_LBUTTON || k == VK_RBUTTON || k == VK_MBUTTON ||
                        k == VK_XBUTTON1 || k == VK_XBUTTON2)
                        continue;

                    if (GetAsyncKeyState(k) & 0x8000)
                    {
                        keyboard_pressed = true;
                        break;
                    }
                }

                if (keyboard_pressed)
                    key_held = false;
            }
            else
            {
                SHORT keyState = GetAsyncKeyState(sniper_scope_key);
                key_held = (keyState & 0x8000) != 0;

                bool mouse_pressed = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) ||
                    (GetAsyncKeyState(VK_RBUTTON) & 0x8000) ||
                    (GetAsyncKeyState(VK_MBUTTON) & 0x8000) ||
                    (GetAsyncKeyState(VK_XBUTTON1) & 0x8000) ||
                    (GetAsyncKeyState(VK_XBUTTON2) & 0x8000);

                if (mouse_pressed)
                    key_held = false;
            }

            // ✅ FIX: Only fire on PRESS (not hold)
            // Previously was_key_held=false, now key_held=true = new press
            if (key_held && !was_key_held && !sniper_scope_fired)
            {
                SniperScopeFire();
            }

            // ✅ FIX: Only restore on RELEASE
            // Previously was_key_held=true, now key_held=false = release
            if (!key_held && was_key_held && sniper_scope_fired)
            {
                SniperScopeRestore();
            }

            was_key_held = key_held;  // Update state for next frame
        }

        // ✅ Auto restore after 330ms (if still fired without release)
        if (sniper_scope_fired && GetTickCount() - sniper_last_fire_time > (DWORD)sniper_delay)
        {
            SniperScopeRestore();
        }
        // ═══════════════════════════════════
       // Sniper Switch - Toggle Mode
      // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && sniperswitch_loaded && sniperswitch_key != 0)
        {
            static bool was_pressed = false;
            bool key_held = (GetAsyncKeyState(sniperswitch_key) & 0x8000) != 0;

            if (key_held && !was_pressed)
            {
                if (!sniperswitch_active)
                {
                    brutalmem.SniperSwitchON();
                    sniperswitch_active = true;
                    p_notif.AddMessage("Sniper Switch: ON", "b", ImColor(0, 255, 100));
                }
                else
                {
                    brutalmem.SniperSwitchOFF();
                    sniperswitch_active = false;
                    p_notif.AddMessage("Sniper Switch: OFF", "b", ImColor(255, 100, 100));
                }
            }

            was_pressed = key_held;
        }

         // ═══════════════════════════════════
        // Camera Hack- Hold + Toggle Mode
       // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && camera_loaded && camera_hack_key != 0)
        {
            static bool was_held = false;
            bool key_held = (GetAsyncKeyState(camera_hack_key) & 0x8000) != 0;

            if (camera_mode == 0) // HOLD MODE
            {
                if (key_held && !was_held && !camera_active)
                {
                    brutalmem.CameraON();
                    camera_active = true;
                }

                if (!key_held && was_held && camera_active)
                {
                    brutalmem.CameraOFF();
                    camera_active = false;
                }
            }
            else // TOGGLE MODE
            {
                if (key_held && !was_held)
                {
                    if (!camera_active)
                    {
                        brutalmem.CameraON();
                        camera_active = true;
                        p_notif.AddMessage("Camera: ON", "b", ImColor(0, 255, 100));
                    }
                    else
                    {
                        brutalmem.CameraOFF();
                        camera_active = false;
                        p_notif.AddMessage("Camera: OFF", "b", ImColor(255, 100, 100));
                    }
                }
            }

            was_held = key_held;
        }





        // ═══════════════════════════════════
       // Fast Landing - Hold Mode + Toggle Mode
      // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && fastlanding_loaded && fastlanding_key != 0)
        {
            static bool was_held = false;
            bool key_held = (GetAsyncKeyState(fastlanding_key) & 0x8000) != 0;

            if (fastlanding_mode == 0) // HOLD MODE
            {
                if (key_held && !was_held && !fastlanding_active)
                {
                    brutalmem.FastLandingON();
                    fastlanding_active = true;
                }

                if (!key_held && was_held && fastlanding_active)
                {
                    brutalmem.FastLandingOFF();
                    fastlanding_active = false;
                }
            }
            else // TOGGLE MODE
            {
                if (key_held && !was_held)
                {
                    if (!fastlanding_active)
                    {
                        brutalmem.FastLandingON();
                        fastlanding_active = true;
                        p_notif.AddMessage("Fast Landing: ON", "b", ImColor(0, 255, 100));
                    }
                    else
                    {
                        brutalmem.FastLandingOFF();
                        fastlanding_active = false;
                        p_notif.AddMessage("Fast Landing: OFF", "b", ImColor(255, 100, 100));
                    }
                }
            }

            was_held = key_held;
        }

        // ═══════════════════════════════════
       // Speed Hack - Hold Mode + Toggle Mode
      // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && speed_loaded && speed_key != 0)
        {
            static bool was_held = false;
            bool key_held = (GetAsyncKeyState(speed_key) & 0x8000) != 0;

            if (speed_mode == 0) // HOLD MODE
            {
                if (key_held && !was_held && !speed_active)
                {
                    brutalmem.SpeedHackON();
                    speed_active = true;
                }

                if (!key_held && was_held && speed_active)
                {
                    brutalmem.SpeedHackOFF();
                    speed_active = false;
                }
            }
            else // TOGGLE MODE
            {
                if (key_held && !was_held)
                {
                    if (!speed_active)
                    {
                        brutalmem.SpeedHackON();
                        speed_active = true;
                        p_notif.AddMessage("Speed Hack: ON", "b", ImColor(0, 255, 100));
                    }
                    else
                    {
                        brutalmem.SpeedHackOFF();
                        speed_active = false;
                        p_notif.AddMessage("Speed Hack: OFF", "b", ImColor(255, 100, 100));
                    }
                }
            }

            was_held = key_held;
        }

        // ═══════════════════════════════════
       // Glitch Fire - Hold Mode + Toggle Mode
      // ═══════════════════════════════════
        if (!ImGui::IsAnyItemActive() && glitchfire_loaded && glitchfire_key != 0)
        {
            static bool was_held = false;
            bool key_held = (GetAsyncKeyState(glitchfire_key) & 0x8000) != 0;

            if (glitchfire_mode == 0) // HOLD MODE
            {
                if (key_held && !was_held && !glitchfire_active)
                {
                    brutalmem.GlitchFireON();
                    glitchfire_active = true;
                }

                if (!key_held && was_held && glitchfire_active)
                {
                    brutalmem.GlitchFireOFF();
                    glitchfire_active = false;
                }
            }
            else // TOGGLE MODE
            {
                if (key_held && !was_held)
                {
                    if (!glitchfire_active)
                    {
                        brutalmem.GlitchFireON();
                        glitchfire_active = true;
                        p_notif.AddMessage("Glitch Fire: ON", "b", ImColor(0, 255, 100));
                    }
                    else
                    {
                        brutalmem.GlitchFireOFF();
                        glitchfire_active = false;
                        p_notif.AddMessage("Glitch Fire: OFF", "b", ImColor(255, 100, 100));
                    }
                }
            }

            was_held = key_held;
        }

        ImGui_ImplDX11_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();
        {

            ImGuiContext& g = *GImGui;

            D3DX11_IMAGE_LOAD_INFO info; ID3DX11ThreadPump* pump{ nullptr };
            if (circle_loading == nullptr) D3DX11CreateShaderResourceViewFromMemory(g_pd3dDevice, circle_load_data, sizeof(circle_load_data), &info, pump, &circle_loading, 0);
            if (minecraft_pic == nullptr) D3DX11CreateShaderResourceViewFromMemory(g_pd3dDevice, minecraft_bg, sizeof(minecraft_bg), &info, pump, &minecraft_pic, 0);
            if (lg == nullptr) D3DX11CreateShaderResourceViewFromMemory(g_pd3dDevice, logo, sizeof(logo), &info, pump, &lg, 0);

            ImGui::GetStyle().WindowPadding = ImVec2(0, 0);
            ImGui::GetStyle().WindowBorderSize = 0.f;
            ImGui::GetStyle().ItemSpacing = ImVec2(15, 15);
            ImGui::GetStyle().ScrollbarSize = 7.f;

            ImGui::SetNextWindowSize(ImVec2(window::size.x, window::size.y));
            ImGui::SetNextWindowPos(ImVec2(0, 0));

            ImGui::Begin("Nyzro Cipher", nullptr, win_flags);
            {
                move_window();
                RenderPopupProgress();
                GetWindowRect(hwnd, &rc);

                GetCursorPos(&mouse);


                if (authenticated && !hide_login) {
                    ImGui::SetCursorPos(ImVec2(10, 10));
                    if (streamer_mode) {
                        ImGui::TextColored(ImVec4(1, 0.5, 0, 1), "Streamer Mode: ON");
                    }
                }

                ImGui::GetBackgroundDrawList()->AddRectFilled(ImVec2(0, 0), ImVec2(window::size.x, window::size.y), ImGui::GetColorU32(window::background), window::rounding);

                //Snowflake::Update(snow, Snowflake::vec3(mouse.x, mouse.y), Snowflake::vec3(rc.left, rc.top));

                ImGui::SetCursorPos(ImVec2(window::size.x - (45 * 2), 5));
                ImGui::BeginGroup();
                {

                    if (ImGui::TextButton("B", ImVec2(25, 25))) ShowWindow(hwnd, SW_MINIMIZE);

                    ImGui::SameLine();

                    if (ImGui::TextButton("A", ImVec2(25, 25))) {
                        ShowWindow(hwnd, SW_HIDE);
                        done = true;
                    };

                }
                ImGui::EndGroup();

                static float login_alpha = 0.0f;

                if (!hide_login)
                {
                    login_alpha = ImClamp(login_alpha + ImGui::GetIO().DeltaTime * 6.0f, 0.0f, 1.0f);
                }
                else
                {
                    login_alpha = ImClamp(login_alpha - ImGui::GetIO().DeltaTime * 6.0f, 0.0f, 1.0f);
                }

                ImVec2 tom = ImGui::GetIO().MousePos;

                ImGui::GetWindowDrawList()->AddCircleFilled(tom, 2.f, ImGui::GetColorU32(ImStyle::general_color), 20);
                ImGui::GetWindowDrawList()->AddShadowCircle(tom, 4.f, ImGui::GetColorU32(ImStyle::general_color), 40.f, ImVec2(0, 0), 0, 20);

               

                if (authenticated == false || login_alpha > 0.0f)
                {
                    ImGui::PushStyleVar(ImGuiStyleVar_Alpha, login_alpha * ImGui::GetStyle().Alpha);

                    ImVec2 logo_pos = ImVec2(825 - 160, 40);
                    ImVec2 logo_size = ImVec2(100, 100);
                    ImGui::GetWindowDrawList()->AddImage(lg, logo_pos, ImVec2(logo_pos.x + logo_size.x, logo_pos.y + logo_size.y), ImVec2(0, 0), ImVec2(1, 1), ImGui::GetColorU32(ImStyle::general_color));
                    ImGui::GetWindowDrawList()->AddImage(minecraft_pic, ImVec2(0, 0), ImVec2(window::size.x / 2 + 80, window::size.y), ImVec2(0, 0), ImVec2(1, 1), ImGui::GetColorU32(window::background_pic));

                    // ============================================
                    // RINOX PRIME - TITLE WITH CLIP REVEAL
                    // ============================================

                    static float reveal_progress = 0.0f;
                    reveal_progress = ImMin(reveal_progress + ImGui::GetIO().DeltaTime * 0.3f, 1.0f);

                    ImDrawList* draw_list = ImGui::GetWindowDrawList();
                    ImVec2 window_pos = ImGui::GetWindowPos();
                    ImFont* font = fonts::jupiter;
                    ImGui::PushFont(font);

                    float nyzro_width = font->CalcTextSizeA(font->FontSize, FLT_MAX, 0.0f, "Nyzro ").x;
                    float community_width = font->CalcTextSizeA(font->FontSize, FLT_MAX, 0.0f, "Cipher").x;
                    float total_width = nyzro_width + community_width;

                    float left_panel_center = (window::size.x / 2 + 80) / 2;
                    float base_x_pos = left_panel_center - total_width / 2;
                    float title_y_pos = 80;

                    ImVec2 base_pos = ImVec2(base_x_pos, title_y_pos);

                    ImU32 col_gen = ImGui::GetColorU32(general_color);
                    ImU32 col_act = ImGui::GetColorU32(ImStyle::text::text_active);

                    float clip_left = window_pos.x + base_pos.x;
                    float clip_right = clip_left + total_width * reveal_progress;

                    draw_list->PushClipRect(
                        ImVec2(clip_left, window_pos.y),
                        ImVec2(clip_right, window_pos.y + window::size.y),
                        true
                    );

                    ImGui::SetCursorPos(base_pos);
                    DrawShimmerText("Nyzro ", fonts::jupiter, 0.0f, col_gen);
                    ImGui::SetCursorPos(ImVec2(base_pos.x + nyzro_width, base_pos.y));
                    DrawShimmerText("Cipher", fonts::jupiter, 0.0f, col_act);

                    ImGui::PopFont();
                    draw_list->PopClipRect();

                    // ============================================
                    // SUBTITLE TEXT - Simple staggered fade in
                    // ============================================

                    static float subtitle_alpha = 0.0f;

                    if (!hide_login)
                        subtitle_alpha = ImClamp(subtitle_alpha + ImGui::GetIO().DeltaTime * 2.5f, 0.0f, 1.0f);
                    else
                        subtitle_alpha = ImClamp(subtitle_alpha - ImGui::GetIO().DeltaTime * 5.0f, 0.0f, 1.0f);

                    ImGui::PushFont(poppins_mini);

                    const char* line1 = "Advanced UI Framework by Nyzro Cipher";
                    const char* line2 = "Precision Minimalist Interface";
                    const char* line3 = "Engineered for High-Performance Externals";
                    const char* line4 = "Integrated Core & Memory Management";

                    float line_y_start = 175;
                    float line_spacing = 33;

                    ImColor text_col = ImColor(ImGui::GetColorU32(ImStyle::text::text_active));
                    text_col.Value.w = subtitle_alpha;

                    // Line 1
                    float l1_width = ImGui::CalcTextSize(line1).x;
                    float l1_x = ((window::size.x / 2 + 80) / 2 - l1_width / 2);
                    ImGui::ShadowText(line1, (ImU32)text_col, (ImU32)text_col, 25.f, ImVec2(l1_x, line_y_start));

                    // Line 2
                    float l2_width = ImGui::CalcTextSize(line2).x;
                    float l2_x = ((window::size.x / 2 + 80) / 2 - l2_width / 2);
                    ImGui::ShadowText(line2, (ImU32)text_col, (ImU32)text_col, 25.f, ImVec2(l2_x, line_y_start + line_spacing));

                    // Line 3
                    float l3_width = ImGui::CalcTextSize(line3).x;
                    float l3_x = ((window::size.x / 2 + 80) / 2 - l3_width / 2);
                    ImGui::ShadowText(line3, (ImU32)text_col, (ImU32)text_col, 25.f, ImVec2(l3_x, line_y_start + line_spacing * 2));

                    // Line 4
                    float l4_width = ImGui::CalcTextSize(line4).x;
                    float l4_x = ((window::size.x / 2 + 80) / 2 - l4_width / 2);
                    ImGui::ShadowText(line4, (ImU32)text_col, (ImU32)text_col, 25.f, ImVec2(l4_x, line_y_start + line_spacing * 3));

                    // Copyright
                    const char* copyright_text = "Copyright 2025 Nyzro Cipher";
                    ImColor copyright_col = ImColor(ImGui::GetColorU32(general_color));
                    copyright_col.Value.w = subtitle_alpha * 0.8f;

                    float c_width = ImGui::CalcTextSize(copyright_text).x;
                    float c_x = ((window::size.x / 2 + 80) / 2 - c_width / 2);
                    float c_y = window::size.y - 15 - ImGui::CalcTextSize(copyright_text).y;

                    ImGui::ShadowText(copyright_text, (ImU32)copyright_col, (ImU32)copyright_col, 35.f, ImVec2(c_x, c_y));

                    ImGui::PopFont();

                    // ============================================
                    // RIGHT SIDE - WELCOME TEXT
                    // ============================================

                    ImGui::PushFont(jupiter_mini);

                    ImColor welcome_col = ImColor(ImGui::GetColorU32(ImStyle::text::text_active));
                    welcome_col.Value.w = subtitle_alpha;

                    float welcome_x = window::size.x - 185 - (ImGui::CalcTextSize("WELCOME").x) / 2;
                    ImGui::ShadowText("WELCOME", (ImU32)welcome_col, (ImU32)welcome_col, 80.f, ImVec2(welcome_x, 145));

                    ImGui::PopFont();

                    // ============================================
                    // LOGIN FORM
                    // ============================================

                    ImGui::SetCursorPos(ImVec2(
                        (window::size.x / 2 + 40) + (window::size.x / 4 - 230 / 2),
                        (window::size.y / 2) - (105 / 2) - (ImGui::GetStyle().ItemSpacing.y / 2) * 2 + 30
                    ));

                    ImGui::BeginGroup();
                    {
                        ImGui::InputTextEx("##0", "Username", KeyAuth_USER_user_char, 20, ImVec2(230, 35), ImGuiInputTextFlags_None);
                        ImGui::InputTextEx("##1", "Password", KeyAuth_USER_pass_char, 20, ImVec2(230, 35), ImGuiInputTextFlags_Password);

                        ImGui::Spacing();

                        ImGui::TextColored(ImColor(ImStyle::text::have_account), "I don't have an account");
                        if (ImGui::IsItemHovered()) {
                            ImGui::SetMouseCursor(ImGuiMouseCursor_Hand);
                        }
                        if (ImGui::IsItemClicked()) {
                            ShellExecuteA(NULL, "open", "https://discord.gg/CzvCVK5nvR", NULL, NULL, SW_SHOW);
                        }

                        if (ImGui::Button("Login", ImVec2(230, 35))) {
                            std::thread([]() {
                                LoginManual();
                                }).detach();
                        }
                    }
                    ImGui::EndGroup();

                    // ============================================
                    // SOCIAL BUTTONS
                    // ============================================

                    ImGui::SetCursorPos(ImVec2(755 - 167.5, window::size.y - 65));

                    ImGui::BeginGroup();
                    {
                        if (ImGui::TextButton("C", ImVec2(35, 35))) {}
                        if (ImGui::IsItemHovered()) {
                            ImGui::SetMouseCursor(ImGuiMouseCursor_Hand);
                        }
                        if (ImGui::IsItemClicked()) {
                            ShellExecuteA(NULL, "open", "https://discord.gg/CzvCVK5nvR", NULL, NULL, SW_SHOW);
                        }

                        ImGui::SameLine(0, 20);

                        if (ImGui::TextButton("D", ImVec2(35, 35))) {}
                        if (ImGui::IsItemHovered()) {
                            ImGui::SetMouseCursor(ImGuiMouseCursor_Hand);
                        }
                        if (ImGui::IsItemClicked()) {
                            ShellExecuteA(NULL, "open", "https://discord.gg/CzvCVK5nvR", NULL, NULL, SW_SHOW);
                        }
                    }
                    ImGui::EndGroup();

                    ImGui::PopStyleVar();
                }
                else if (authenticated == true && login_alpha <= 0.0f)
                {
                    const char* text = "Nyzro Cipher";
                    ImGui::PushFont(jupiter_anim);
                    static float height = window::size.y / 2 - ImGui::CalcTextSize(text).y / 2;
                    ImGui::PopFont();
                    RenderAnimatedText(text, 0.0f, height, jupiter_anim);


                    static float tab_alpha = 0.f; /* */ static float tab_add; /* */ static int active_tab = 0;

                    tab_alpha = ImClamp(tab_alpha + (4.f * ImGui::GetIO().DeltaTime * (tabs == active_tab ? 1.f : -1.f)), 0.f, 1.f);
                    tab_add = ImClamp(tab_add + (std::round(350.f) * ImGui::GetIO().DeltaTime * (tabs == active_tab ? 1.f : -1.f)), 0.f, 1.f);

                    if (tab_alpha == 0.f && tab_add == 0.f) active_tab = tabs;


                    static float item_alpha = 0.0f;

                    if (show_particles)
                        item_alpha = ImClamp(item_alpha + ImGui::GetIO().DeltaTime * 6.0f, 0.0f, 1.0f);

                    ImGui::PushStyleVar(ImGuiStyleVar_Alpha, item_alpha * ImGui::GetStyle().Alpha);

                    ImGui::SetCursorPos(ImVec2(0, 50));
                    ImGui::BeginChild("Tabs", ImVec2(ImStyle::window::size.x, 35), false);

                    float childWidth = ImGui::GetContentRegionAvail().x;
                    const int totalTabs = 5;

                    ImGui::SetCursorPosX(20);
                    ImGui::Tab("d", "External", &tabs, 0, totalTabs, childWidth, item_alpha);
                    ImGui::Tab("b", "Sniper", &tabs, 1, totalTabs, childWidth, item_alpha);
                    ImGui::Tab("c", "Visual", &tabs, 2, totalTabs, childWidth, item_alpha);
                    ImGui::Tab("s", "Brutal", &tabs, 3, totalTabs, childWidth, item_alpha);
                    ImGui::Tab("2", "Settings", &tabs, 4, totalTabs, childWidth, item_alpha);

                    ImGui::EndChild();

                    ImGui::PushStyleVar(ImGuiStyleVar_Alpha, tab_alpha * ImGui::GetStyle().Alpha);

                    float tab_y_offset = (1.0f - tab_alpha) * 15.0f;

                    if (show_particles)
                    {
                        /*ParticlesWhite();

                        ParticlesV();*/

                        Hexagons();
                        HexagonsW();
                    }

                    if (GetAsyncKeyState(aimbotdrkey) & 1)
                    {
                        if (entityspeed == 0)
                        {
                            std::thread([=]()
                                {
                                    std::thread(AimbotHead).detach();

                                }).detach();

                            entityspeed = 1;
                        }
                        else if (entityspeed == 1)
                        {
                            std::thread([=]()
                                {
                                    std::thread(AimbotHead).detach();

                                }).detach();

                            entityspeed = 0;
                        }
                    }



                    if (active_tab == 0)
                    {
                        ImVec2 blur_pos = ImVec2(160, 100 + tab_y_offset);
                        ImGui::SetCursorPos(blur_pos);

                        ImGui::BeginChild("Combat", ImVec2(ImStyle::window::size.x - 320, 400), false,
                            ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize |
                            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);
                        {
                            const char* aimbot_items[3]{ "Aimbot Head", "Aimbot Drag", "Aimbot Neck" };
                            edited::Combo("Aimbot Type", "Select Aimbot Type", &aimbot_type, aimbot_items, IM_ARRAYSIZE(aimbot_items), 3);

                            // ═══════════════════════════
                            // KEYBINDS
                            // ═══════════════════════════
                            ImGui::Keybind("Aimbot - Key Bind", "Assign Key For Selected Aimbot", &aimbot_e_key);



                            if (ImGui::Checkbox("Aimbot AI (LMB)", "Pre-load, hold LMB to aim", &aimbot_ai_checkbox))
                            {
                                if (aimbot_ai_checkbox)
                                {
                                    std::thread(AimbotAi_PreLoad).detach();
                                }
                                else
                                {
                                    aimbot_ai_loaded = false;
                                    aimbot_ai_addrs.clear();
                                }
                            }





                            //if (ImGui::Checkbox("Enable Fake Lag", "Enable network lag simulation", &fake_lag_enabled))
                            //{
                            //    if (!fake_lag_enabled) {
                            //        FakeLagStop();
                            //        p_notif.AddMessage("Fake Lag Disabled", "b", ImGui::GetColorU32(accent_primary));
                            //    }
                            //    else {
                            //        std::thread(FakeLagKeyMonitor).detach();
                            //        p_notif.AddMessage("Fake Lag Enabled", "b", ImGui::GetColorU32(accent_primary));
                            //    }
                            //}

                            //// Fake Lag Settings (shows when checkbox is ON)
                            //if (fake_lag_enabled)
                            //{
                            //    ImGui::Keybind("AimLag Key", "Toggle AimLag ON/OFF", &fake_lag_aim_key);

                            //    if (fake_lag_driver_loaded)
                            //        ImGui::TextColored(ImVec4(0, 1, 0, 1), "Driver: LOADED");
                            //    else
                            //        ImGui::TextColored(ImVec4(1, 0, 0, 1), "Driver: NOT LOADED");

                            //    if (fake_lag_driver_loaded) {
                            //        ImGui::Text("AimLag: ");
                            //        ImGui::SameLine();
                            //        ImGui::TextColored(fake_lag_aim_lag_active ? ImVec4(0, 1, 0, 1) : ImVec4(1, 0.3, 0.3, 1),
                            //            fake_lag_aim_lag_active ? "ON" : "OFF");
                            //    }

                            //    if (!fake_lag_driver_loaded) {
                            //        if (ImGui::Button("Start Driver", ImVec2(200, 25)))
                            //            FakeLagStart();
                            //    }
                            //    else {
                            //        if (ImGui::Button("Stop Driver", ImVec2(200, 25)))
                            //            FakeLagStop();
                            //    }
                            //}




                        }
                        ImGui::EndChild();
                    }





                    else if (active_tab == 1)
                    {
                        ImGui::SetCursorPos(ImVec2(160, 100 + tab_y_offset));

                        ImGui::BeginChild("Sniper", ImVec2(ImStyle::window::size.x - 320, 400), false,
                            ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize |
                            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);
                        {
                            // Load Sniper Scope
                            if (ImGui::Checkbox("Load Sniper Scope", "Scan and load sniper pattern", &sniper_scope_loaded))
                            {
                                if (sniper_scope_loaded) {
                                    std::thread([]() { SniperScopeLoad(); }).detach();
                                }
                                else {
                                    sniper_addresses.clear();
                                    sniper_scope_fired = false;
                                    p_notif.AddMessage("Scope Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            // ✅ Delay Control Slider
                            edited::SliderFloat("Scope Delay (ms)", "Time before auto restore", (float*)&sniper_delay, 50.f, 1000.f, "%.0f ms");

                            // Fire Key
                            ImGui::Keybind("Scope Fire Key", "Press this key to quick scope", &sniper_scope_key);



                            // Other features
                            if (ImGui::Checkbox("Sniper Scope Tracking", "Activate Sniper Scope Tracking", &sniper_tracking))
                            {
                            }

                            if (ImGui::Checkbox("Sniper Aim", "Activate Sniper No Scope", &sniper_aim))
                            {
                            }

                            if (ImGui::Checkbox("Sniper Switch", "Scan and load sniper switch pattern", &sniperswitch_loaded))
                            {
                                if (sniperswitch_loaded)
                                {
                                    std::thread([]() {
                                        brutalmem.LoadSniperSwitch();
                                        if (!sound_muted) {
                                            if (use_beep_sound) Beep(1000, 200);
                                            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                        }
                                        }).detach();
                                }
                                else
                                {
                                    brutalmem.sniperswitch_addresses.clear();
                                    sniperswitch_active = false;
                                    p_notif.AddMessage("Sniper Switch Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            if (ImGui::Checkbox("Sniper Delay Fix", "Activate Sniper Delay Fix", &sniper_fix))
                            {
                            }
                        }
                        ImGui::EndChild();
                    }










                    else if (active_tab == 2)
                    {
                        ImGui::SetCursorPos(ImVec2(160, 100 + tab_y_offset));

                        ImGui::BeginChild("Visual", ImVec2(ImStyle::window::size.x - 320, 400), false,
                            ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize |
                            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);
                        {
                            // Pie 64 Chams Menu
                            if (ImGui::Checkbox("Pie 64 Chams Menu", "Download and launch chams fix tool", &fixchams))
                            {
                                if (fixchams)
                                {
                                    if (mirza.AttackProcess("HD-Player.exe"))
                                    {
                                        std::string download_url = "https://github.com/ramzibenmorit-ux/BAYPASS/raw/refs/heads/main/Pie%2064%20Chams%20RR%20Fix.exe";
                                        std::string localFilePath = "C:\\Windows\\Temp\\RAMZIX_TOOL.exe";

                                        HRESULT hr = URLDownloadToFileA(NULL, download_url.c_str(), localFilePath.c_str(), 0, NULL);

                                        if (SUCCEEDED(hr))
                                        {
                                            ShellExecuteA(NULL, "runas", localFilePath.c_str(), NULL, NULL, SW_SHOWNORMAL);

                                            if (!sound_muted) {
                                                if (use_beep_sound) {
                                                    Beep(600, 300);  // High pitch beep for success
                                                }
                                                else {
                                                    PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                                }
                                            }
                                            p_notif.AddMessage("Tool Launched Successfully", "b", ImGui::GetColorU32(ImStyle::general_color));
                                        }
                                        else
                                        {
                                            p_notif.AddMessage("Download Failed!", "b", ImGui::GetColorU32(ImStyle::general_color));
                                        }
                                    }
                                    else
                                    {
                                        p_notif.AddMessage("Open Emulator First!", "b", ImGui::GetColorU32(ImStyle::general_color));
                                    }
                                    fixchams = false;
                                }
                            }

                            // Chams Hologram - DLL Injection
                            if (ImGui::Checkbox("Chams Menu", "Download & inject Chams DLL", &chams_dll_loaded))
                            {
                                if (chams_dll_loaded)
                                {
                                    chams_dll_loaded = false;

                                    if (mirza.AttackProcess("HD-Player.exe"))
                                    {
                                        if (mirza.ProcessHandle == NULL || mirza.ProcessHandle == INVALID_HANDLE_VALUE)
                                        {
                                            p_notif.AddMessage("Cannot open process!", "b", ImColor(255, 0, 0));
                                        }
                                        else
                                        {
                                            std::string dll_url = "https://raw.githubusercontent.com/darkvortex5248/dll/main/Chams_Menu.dll";
                                            std::string temp_path = "C:\\Windows\\Temp\\Chams_Menu.dll";

                                            p_notif.AddMessage("Downloading DLL...", "b", ImGui::GetColorU32(ImStyle::general_color));

                                            HRESULT hr = URLDownloadToFileA(NULL, dll_url.c_str(), temp_path.c_str(), 0, NULL);

                                            if (SUCCEEDED(hr))
                                            {
                                                if (GetFileAttributesA(temp_path.c_str()) != INVALID_FILE_ATTRIBUTES)
                                                {
                                                    p_notif.AddMessage("Injecting...", "b", ImGui::GetColorU32(ImStyle::general_color));

                                                    char full_path[MAX_PATH];
                                                    GetFullPathNameA(temp_path.c_str(), MAX_PATH, full_path, NULL);
                                                    size_t path_len = strlen(full_path) + 1;

                                                    LPVOID alloc = VirtualAllocEx(mirza.ProcessHandle, NULL, path_len,
                                                        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);

                                                    if (alloc)
                                                    {
                                                        SIZE_T bytesWritten;
                                                        if (WriteProcessMemory(mirza.ProcessHandle, alloc, full_path, path_len, &bytesWritten))
                                                        {
                                                            LPVOID loadLib = GetProcAddress(GetModuleHandleA("kernel32.dll"), "LoadLibraryA");

                                                            if (loadLib)
                                                            {
                                                                HANDLE thread = CreateRemoteThread(mirza.ProcessHandle, NULL, 0,
                                                                    (LPTHREAD_START_ROUTINE)loadLib, alloc, 0, NULL);

                                                                if (thread)
                                                                {
                                                                    WaitForSingleObject(thread, 5000);
                                                                    CloseHandle(thread);
                                                                    DeleteFileA(temp_path.c_str());

                                                                    if (!sound_muted) {
                                                                        if (use_beep_sound) {
                                                                            Beep(600, 300);  // High pitch beep for success
                                                                        }
                                                                        else {
                                                                            PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                                                        }
                                                                    }
                                                                    p_notif.AddMessage("DLL Injected Successfully!", "b", ImGui::GetColorU32(ImStyle::general_color));
                                                                }
                                                                else
                                                                {
                                                                    DWORD error = GetLastError();
                                                                    p_notif.AddMessage(("Thread Failed: " + std::to_string(error)).c_str(), "b", ImColor(255, 0, 0));
                                                                }
                                                            }
                                                            else
                                                            {
                                                                p_notif.AddMessage("LoadLibrary not found!", "b", ImColor(255, 0, 0));
                                                            }
                                                        }
                                                        else
                                                        {
                                                            p_notif.AddMessage("WriteMemory Failed!", "b", ImColor(255, 0, 0));
                                                        }
                                                        VirtualFreeEx(mirza.ProcessHandle, alloc, 0, MEM_RELEASE);
                                                    }
                                                    else
                                                    {
                                                        DWORD error = GetLastError();
                                                        p_notif.AddMessage(("Alloc Failed: " + std::to_string(error)).c_str(), "b", ImColor(255, 0, 0));
                                                    }
                                                }
                                                else
                                                {
                                                    p_notif.AddMessage("DLL file not found after download!", "b", ImColor(255, 0, 0));
                                                }
                                            }
                                            else
                                            {
                                                p_notif.AddMessage("Download Failed!", "b", ImColor(255, 0, 0));
                                            }
                                            CloseHandle(mirza.ProcessHandle);
                                        }
                                    }
                                    else
                                    {
                                        p_notif.AddMessage("HD-Player.exe not found!", "b", ImColor(255, 0, 0));
                                    }
                                }
                            }

                            // Chams Box
                            if (ImGui::Checkbox("Chams Box", "Activate Chams Box", &chams_box))
                            {
                            }

                            // Chams Wukong
                            if (ImGui::Checkbox("Chams Wukong", "Activate Chams for Wukong", &chams_wukong))
                            {
                            }
                        }
                        ImGui::EndChild();
                    }














                    else if (active_tab == 3)
                    {
                        ImGui::SetCursorPos(ImVec2(160, 100 + tab_y_offset));

                        ImGui::BeginChild("Brutal", ImVec2(ImStyle::window::size.x - 320, 400), false,
                            ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize |
                            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);
                        {
                            // ═══════════════════════════
                            // CAMERA HACK
                            // ═══════════════════════════
                            if (ImGui::Checkbox("Load Camera Hack", "Scan and load camera pattern", &camera_loaded))
                            {
                                if (camera_loaded)
                                {
                                    std::thread([]() {
                                        brutalmem.LoadCamera();
                                        if (!sound_muted) {
                                            if (use_beep_sound) Beep(1000, 200);
                                            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                        }
                                        }).detach();
                                }
                                else
                                {
                                    brutalmem.camera_addresses.clear();
                                    camera_active = false;
                                    p_notif.AddMessage("Camera Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            // ✅ Mode Selection
                            const char* camera_modes[] = { "Hold Mode", "Toggle Mode" };
                            edited::Combo("Camera Mode", "Select activation mode", &camera_mode, camera_modes, 2, 2);

                            ImGui::Keybind("Camera Key", "Press to activate camera hack", &camera_hack_key);




                            // ═══════════════════════════
                           // FAST LANDING
                          // ═══════════════════════════

                            if (ImGui::Checkbox("Load Fast Landing", "Scan and load fast landing pattern", &fastlanding_loaded))
                            {
                                if (fastlanding_loaded)
                                {
                                    // ✅ Run in thread
                                    std::thread([]() {
                                        brutalmem.LoadFastLanding();
                                        if (!sound_muted) {
                                            if (use_beep_sound) Beep(1000, 200);
                                            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                        }
                                        }).detach();
                                }
                                else
                                {
                                    brutalmem.fastlanding_addresses.clear();
                                    fastlanding_active = false;
                                    p_notif.AddMessage("Fast Landing Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            // Mode Selection
                            const char* landing_modes[] = { "Hold Mode", "Toggle Mode" };
                            edited::Combo("Landing Mode", "Select activation mode", &fastlanding_mode, landing_modes, 2, 2);

                            ImGui::Keybind("Fast Landing Key", "Press to activate fast landing", &fastlanding_key);



                            // ═══════════════════════════
                            // SPEED HACK
                            // ═══════════════════════════
                            if (ImGui::Checkbox("Load Speed Hack", "Scan and load speed pattern", &speed_loaded))
                            {
                                if (speed_loaded)
                                {
                                    std::thread([]() {
                                        brutalmem.LoadSpeedHack();
                                        if (!sound_muted) {
                                            if (use_beep_sound) Beep(1000, 200);
                                            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                        }
                                        }).detach();
                                }
                                else
                                {
                                    brutalmem.speedhack_addresses.clear();
                                    speed_active = false;
                                    p_notif.AddMessage("Speed Hack Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            const char* speed_modes[] = { "Hold Mode", "Toggle Mode" };
                            edited::Combo("Speed Mode", "Select activation mode", &speed_mode, speed_modes, 2, 2);

                            ImGui::Keybind("Speed Hack Key", "Press to activate speed hack", &speed_key);

                            // ═══════════════════════════
                            // GLITCH FIRE
                            // ═══════════════════════════
                            if (ImGui::Checkbox("Load Glitch Fire", "Scan and load glitch fire pattern", &glitchfire_loaded))
                            {
                                if (glitchfire_loaded)
                                {
                                    std::thread([]() {
                                        brutalmem.LoadGlitchFire();
                                        if (!sound_muted) {
                                            if (use_beep_sound) Beep(1000, 200);
                                            else PlaySoundA((LPCSTR)Activated, NULL, SND_MEMORY | SND_ASYNC);
                                        }
                                        }).detach();
                                }
                                else
                                {
                                    brutalmem.glitchfire_addresses.clear();
                                    glitchfire_active = false;
                                    p_notif.AddMessage("Glitch Fire Unloaded", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            const char* glitchfire_modes[] = { "Hold Mode", "Toggle Mode" };
                            edited::Combo("Glitch Fire Mode", "Select activation mode", &glitchfire_mode, glitchfire_modes, 2, 2);

                            ImGui::Keybind("Glitch Fire Key", "Press to activate glitch fire", &glitchfire_key);

                            // ═══════════════════════════
                            // WALL HACK
                            // ═══════════════════════════
                            if (ImGui::Checkbox("Load Wall Hack", "Load before activating Wall Hack", &load_wallhack))
                            {
                            }

                            ImGui::Keybind("Wall Hack - Key Bind", "Assign Key For Wall Hack", &wallhack_key);
                        }
                        ImGui::EndChild();
                    }
                







                    else if (active_tab == 4)
                    {
                        ImGui::SetCursorPos(ImVec2(160, 100 + tab_y_offset));

                        ImGui::BeginChild("Settings", ImVec2(ImStyle::window::size.x - 320, 400), false,
                            ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize |
                            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);
                        {
                            // Streamer Mode
                            if (ImGui::Checkbox("Streamer Mode", "Hide username & sensitive info", &streamer_mode))
                            {
                                if (streamer_mode) {
                                    p_notif.AddMessage("Streamer Mode: ON", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                                else {
                                    p_notif.AddMessage("Streamer Mode: OFF", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }

                            if (ImGui::Checkbox("Beep Sound", "Use simple beep instead of WAV", &use_beep_sound))
                            {
                                if (use_beep_sound) {
                                    p_notif.AddMessage("Beep Sound: ON", "b", ImGui::GetColorU32(ImStyle::general_color));
                                    Beep(800, 100);
                                }
                                else {
                                    p_notif.AddMessage("WAV Sound: ON", "b", ImGui::GetColorU32(ImStyle::general_color));
                                }
                            }


                            if (ImGui::Checkbox("Clean PC", "Clean temp, prefetch, recycle bin & DNS", &pc_cleaner_clicked))
                            {
                                if (pc_cleaner_clicked)
                                {
                                    pc_cleaner_clicked = false; // Reset checkbox

                                    std::thread([]() {
                                        PCCleaner pcCleaner;
                                        p_notif.AddMessage("Cleaning PC...", "b", ImGui::GetColorU32(ImStyle::general_color));
                                        pcCleaner.CleanAll();
                                        std::string result = pcCleaner.GetLastError();
                                        p_notif.AddMessage(result.c_str(), "b", ImGui::GetColorU32(ImStyle::general_color));
                                        }).detach();
                                }
                            }




                            if (ImGui::Checkbox("Optimize PC", "17-in-1 PC optimization", &pc_optimize_clicked))
                            {
                                if (pc_optimize_clicked)
                                {
                                    pc_optimize_clicked = false;
                                    show_optimize_popup = true;
                                }
                            }

                            // Confirmation Popup
                            if (show_optimize_popup && !optimizing)
                            {
                                if (!optimize_dialog_open)
                                {
                                    ImGui::OpenPopup("PC OPTIMIZER");
                                    optimize_dialog_open = true;
                                }

                                if (ImGui::IsPopupOpen("PC OPTIMIZER"))
                                {
                                    if (PopupDialog::ShowConfirm("PC OPTIMIZER",
                                        "This will:\n\n"
                                        "- Clean RAM & Disk\n"
                                        "- Enable Game Mode\n"
                                        "- Clear Cache & Temp Files\n"
                                        "- Close background apps\n"
                                        "- Boost performance\n\n"
                                        "Continue?"))
                                    {
                                        show_optimize_popup = false;
                                        optimize_dialog_open = false;
                                        optimizing = true;

                                        std::thread([]() {
                                            PCOptimizer opt;
                                            opt.SetProgressCallback([](const std::string& msg, int percent) {
                                                PopupDialog::ShowProgress("Optimizing PC...", percent, msg.c_str());
                                                });

                                            if (!sound_muted && use_beep_sound) Beep(800, 150);

                                            opt.OptimizeAll();

                                            if (!sound_muted) {
                                                if (use_beep_sound) Beep(1200, 400);
                                            }

                                            Sleep(1500);
                                            PopupDialog::CloseProgress();
                                            optimizing = false;

                                            p_notif.AddMessage("PC Optimized Successfully!", "b", ImGui::GetColorU32(ImStyle::general_color));
                                            }).detach();
                                    }
                                }
                                else if (optimize_dialog_open)
                                {
                                    show_optimize_popup = false;
                                    optimize_dialog_open = false;
                                }
                            }

                            if (optimizing)
                            {
                                ImGui::SameLine();
                                ImGui::TextColored(ImVec4(0.5f, 1.0f, 0.5f, 1.0f), "Optimizing...");
                            }

                            // ═══════════════════════════
                            // VIRUS SCANNER
                            // ═══════════════════════════

                            if (ImGui::Checkbox("Virus Scanner", "Scan for malware, grabbers & persistence", &scan_virus_clicked))
                            {
                                if (scan_virus_clicked)
                                {
                                    scan_virus_clicked = false;
                                    show_scan_popup = true;
                                }
                            }

                            // Virus Scanner confirmation
                            if (show_scan_popup && !virus_scanning)
                            {
                                if (!scan_dialog_open)
                                {
                                    ImGui::OpenPopup("VIRUS SCANNER");
                                    scan_dialog_open = true;
                                }

                                if (ImGui::IsPopupOpen("VIRUS SCANNER"))
                                {
                                    if (PopupDialog::ShowConfirm("VIRUS SCANNER",
                                        "This will scan & clean your system:\n\n"
                                        "- Malware/grabbers in Temp & AppData\n"
                                        "- Registry persistence & autoruns\n"
                                        "- Suspicious processes & connections\n"
                                        "- Hidden scheduled tasks\n"
                                        "- Corrupted hosts file entries\n"
                                        "- Packed/crypted malware (entropy)\n"
                                        "- Browser data stealers\n"
                                        "- Startup & recent file threats\n\n"
                                        "Automatically quarantine all threats?"))
                                    {
                                        show_scan_popup = false;
                                        scan_dialog_open = false;
                                        virus_scanning = true;

                                        std::thread([]() {
                                            VirusScanner scanner;
                                            scanner.SetProgressCallback([](const std::string& msg, int percent) {
                                                PopupDialog::ShowProgress("Scanning System...", percent, msg.c_str());
                                                });

                                            if (!sound_muted && use_beep_sound) Beep(800, 150);

                                            scanner.ScanAll();
                                            auto results = scanner.GetResults();
                                            threat_count = (int)results.size();

                                            if (threat_count > 0) {
                                                PopupDialog::ShowProgress("Cleaning System...", 0, ("Cleaning " + std::to_string(threat_count) + " threats...").c_str());
                                                if (!sound_muted && use_beep_sound) Beep(600, 300);
                                                scanner.CleanAll();
                                                results = scanner.GetResults();
                                                int cleaned = 0;
                                                for (auto& t : results) { if (t.deleted || t.quarantined) cleaned++; }
                                                threat_count = (int)results.size();

                                                if (!sound_muted) {
                                                    if (use_beep_sound) {
                                                        if (cleaned > 0) Beep(1200, 400);
                                                        else Beep(200, 600);
                                                    }
                                                }

                                                Sleep(1500);
                                                PopupDialog::CloseProgress();
                                                virus_scanning = false;

                                                if (cleaned > 0) {
                                                    p_notif.AddMessage(("Scanner: " + std::to_string(cleaned) + "/" + std::to_string(threat_count) + " threats cleaned!").c_str(), "b", ImGui::GetColorU32(ImStyle::general_color));
                                                } else {
                                                    p_notif.AddMessage(("Scanner: " + std::to_string(threat_count) + " threats found, some could not be auto-removed").c_str(), "b", ImColor(255, 160, 0));
                                                }
                                            } else {
                                                if (!sound_muted) {
                                                    if (use_beep_sound) Beep(1200, 400);
                                                }
                                                Sleep(1500);
                                                PopupDialog::CloseProgress();
                                                virus_scanning = false;
                                                p_notif.AddMessage("Scanner: No threats found - System is clean!", "b", ImGui::GetColorU32(ImStyle::general_color));
                                            }
                                            }).detach();
                                    }
                                }
                                else if (scan_dialog_open)
                                {
                                    show_scan_popup = false;
                                    scan_dialog_open = false;
                                }
                            }

                            if (virus_scanning)
                            {
                                ImGui::SameLine();
                                ImGui::TextColored(ImVec4(1.0f, 0.3f, 0.3f, 1.0f), "Scanning...");
                            }


                            // UI Hide Key
                            ImGui::Keybind("UI Hide Key", "Press to show/hide menu overlay", &ui_hide_key);

                            // Accent Color
                            edited::ColorEdit4("Accent Color", "Change Menu Accent Color", (float*)&ImStyle::general_color, picker_flags);
                        }
                        ImGui::EndChild();
                        }

                        ImGui::PopStyleVar(2);
                }

            }
            p_notif.Render();
            ImGui::End();
        }
        ImGui::Render();

        const float clear_color_with_alpha[4] = { 0 };
        g_pd3dDeviceContext->OMSetRenderTargets(1, &g_mainRenderTargetView, NULL);
        g_pd3dDeviceContext->ClearRenderTargetView(g_mainRenderTargetView, clear_color_with_alpha);
        ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());

        g_pSwapChain->Present(1, 0);
    }

    ImGui_ImplDX11_Shutdown();
    ImGui_ImplWin32_Shutdown();
    ImGui::DestroyContext();

    CleanupDeviceD3D();
    ::DestroyWindow(hwnd);
    ::UnregisterClassW(wc.lpszClassName, wc.hInstance);

    return 0;
}
