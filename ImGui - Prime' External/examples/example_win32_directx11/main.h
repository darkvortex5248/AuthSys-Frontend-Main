#define IMGUI_DEFINE_MATH_OPERATORS
#define WIN32_LEAN_AND_MEAN
#pragma execution_character_set("utf-8")
#include <windows.h>
#include <d3d11.h>
#include "imgui_internal.h"
#include "imgui.h"
#include "imgui_impl_win32.h"
#include "imgui_impl_dx11.h"
#include <tchar.h>
#include <dwmapi.h>
#include <shellapi.h>
#pragma comment(lib, "shell32.lib")
#include "imgui_settings.h"
#include "imgui_edited.hpp"
#include "Auth/auth.hpp"
#include "Auth/json.hpp"
#include "Auth/skStr.h"
#include "Auth/utils.hpp"
#include "font_defines.h"
#include "icon_font.h"
#include "poppins_font.h"
#include "roboto_font.h"
#include "jupiter_mission.h"
#include "Auth/Header.h"
#include <TlHelp32.h> 
#include "imgui_freetype.h"

#include <iostream>
#include "DiscordSDK/src/discord_register.h"
#include "DiscordSDK/src/discord_rpc.h"
#include "Notifications.h"
#include <string>
#include <cmath>

//#include "PicoMem.h"
#include "snow.hpp"

// Fix for macro redefinitions between modern Windows SDK and legacy D3DX
#ifdef D3D10_ERROR_TOO_MANY_UNIQUE_STATE_OBJECTS
#undef D3D10_ERROR_TOO_MANY_UNIQUE_STATE_OBJECTS
#endif
#ifdef DXGI_STATUS_OCCLUDED
#undef DXGI_STATUS_OCCLUDED
#endif
#ifdef DXGI_STATUS_CLIPPED
#undef DXGI_STATUS_CLIPPED
#endif
#ifdef DXGI_STATUS_NO_REDIRECTION
#undef DXGI_STATUS_NO_REDIRECTION
#endif
#ifdef DXGI_STATUS_NO_DESKTOP_ACCESS
#undef DXGI_STATUS_NO_DESKTOP_ACCESS
#endif
#ifdef DXGI_STATUS_GRAPHICS_VIDPN_SOURCE_IN_USE
#undef DXGI_STATUS_GRAPHICS_VIDPN_SOURCE_IN_USE
#endif
#ifdef DXGI_STATUS_MODE_CHANGED
#undef DXGI_STATUS_MODE_CHANGED
#endif
#ifdef DXGI_STATUS_MODE_CHANGE_IN_PROGRESS
#undef DXGI_STATUS_MODE_CHANGE_IN_PROGRESS
#endif
#ifdef DXGI_ERROR_INVALID_CALL
#undef DXGI_ERROR_INVALID_CALL
#endif
#ifdef DXGI_ERROR_NOT_FOUND
#undef DXGI_ERROR_NOT_FOUND
#endif
#ifdef DXGI_ERROR_MORE_DATA
#undef DXGI_ERROR_MORE_DATA
#endif
#ifdef DXGI_ERROR_UNSUPPORTED
#undef DXGI_ERROR_UNSUPPORTED
#endif
#ifdef DXGI_ERROR_DEVICE_REMOVED
#undef DXGI_ERROR_DEVICE_REMOVED
#endif
#ifdef DXGI_ERROR_DEVICE_HUNG
#undef DXGI_ERROR_DEVICE_HUNG
#endif
#ifdef DXGI_ERROR_DEVICE_RESET
#undef DXGI_ERROR_DEVICE_RESET
#endif
#ifdef DXGI_ERROR_WAS_STILL_DRAWING
#undef DXGI_ERROR_WAS_STILL_DRAWING
#endif
#ifdef DXGI_ERROR_FRAME_STATISTICS_DISJOINT
#undef DXGI_ERROR_FRAME_STATISTICS_DISJOINT
#endif
#ifdef DXGI_ERROR_GRAPHICS_VIDPN_SOURCE_IN_USE
#undef DXGI_ERROR_GRAPHICS_VIDPN_SOURCE_IN_USE
#endif
#ifdef DXGI_ERROR_DRIVER_INTERNAL_ERROR
#undef DXGI_ERROR_DRIVER_INTERNAL_ERROR
#endif
#ifdef DXGI_ERROR_NONEXCLUSIVE
#undef DXGI_ERROR_NONEXCLUSIVE
#endif
#ifdef DXGI_ERROR_NOT_CURRENTLY_AVAILABLE
#undef DXGI_ERROR_NOT_CURRENTLY_AVAILABLE
#endif
#ifdef DXGI_ERROR_REMOTE_CLIENT_DISCONNECTED
#undef DXGI_ERROR_REMOTE_CLIENT_DISCONNECTED
#endif
#ifdef DXGI_ERROR_REMOTE_OUTOFMEMORY
#undef DXGI_ERROR_REMOTE_OUTOFMEMORY
#endif
#ifdef D3D11_ERROR_TOO_MANY_UNIQUE_STATE_OBJECTS
#undef D3D11_ERROR_TOO_MANY_UNIQUE_STATE_OBJECTS
#endif
#ifdef D3D11_ERROR_FILE_NOT_FOUND
#undef D3D11_ERROR_FILE_NOT_FOUND
#endif
#ifdef D3D11_ERROR_TOO_MANY_UNIQUE_VIEW_OBJECTS
#undef D3D11_ERROR_TOO_MANY_UNIQUE_VIEW_OBJECTS
#endif
#ifdef D3D11_ERROR_DEFERRED_CONTEXT_MAP_WITHOUT_INITIAL_DISCARD
#undef D3D11_ERROR_DEFERRED_CONTEXT_MAP_WITHOUT_INITIAL_DISCARD
#endif
#ifdef D3D10_ERROR_FILE_NOT_FOUND
#undef D3D10_ERROR_FILE_NOT_FOUND
#endif

#include <D3DX11tex.h>
#pragma comment(lib, "D3DX11.lib")

#include "circle_load.h"
#include "minecraft_bg.h"
#include "logo.h"


bool show_particles = false;
bool hide_login = false;

namespace fonts {
    ImFont* roboto = nullptr;
    ImFont* icon = nullptr;
    ImFont* jupiter = nullptr;
}

std::string FormatExpiryDate(const std::string& timestampStr) {

    if (timestampStr.empty() || !std::all_of(timestampStr.begin(), timestampStr.end(), ::isdigit)) {
        return "Invalid timestamp";
    }

    std::time_t expiryTime = std::stoll(timestampStr);
    std::tm* tm = std::localtime(&expiryTime);

    if (!tm) {
        return "Invalid time";
    }

    char buffer[64];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%d", tm);
    return std::string(buffer);
}

namespace ImGui
{
    int rotation_start_index;
    void ImRotateStart()
    {
        rotation_start_index = ImGui::GetWindowDrawList()->VtxBuffer.Size;
    }

    ImVec2 ImRotationCenter()
    {
        ImVec2 l(FLT_MAX, FLT_MAX), u(-FLT_MAX, -FLT_MAX);

        const auto& buf = ImGui::GetWindowDrawList()->VtxBuffer;
        for (int i = rotation_start_index; i < buf.Size; i++)
            l = ImMin(l, buf[i].pos), u = ImMax(u, buf[i].pos);

        return ImVec2((l.x + u.x) / 2, (l.y + u.y) / 2);
    }


    void ImRotateEnd(float rad, ImVec2 center = ImRotationCenter())
    {
        float s = sin(rad), c = cos(rad);
        center = ImRotate(center, s, c) - center;

        auto& buf = ImGui::GetWindowDrawList()->VtxBuffer;
        for (int i = rotation_start_index; i < buf.Size; i++)
            buf[i].pos = ImRotate(buf[i].pos, s, c) - center;
    }
}


void ParticlesV()
{

    ImVec2 screen_size = { (float)GetSystemMetrics(SM_CXSCREEN), (float)GetSystemMetrics(SM_CYSCREEN) };

    static ImVec2 partile_pos[100];
    static ImVec2 partile_target_pos[100];
    static float partile_speed[100];
    static float partile_size[100];
    static float partile_radius[100];
    static float partile_rotate[100];

    for (int i = 1; i < 30; i++)
    {
        if (partile_pos[i].x == 0 || partile_pos[i].y == 0)
        {
            partile_pos[i].x = (float)(rand() % (int)screen_size.x + 1);
            partile_pos[i].y = -15.f;
            partile_speed[i] = (float)(1 + rand() % 25);
            partile_radius[i] = (float)(rand() % 3);
            partile_size[i] = (float)(rand() % 3);

            partile_target_pos[i].x = (float)(rand() % (int)screen_size.x);
            partile_target_pos[i].y = screen_size.y * 2.f;
        }

        partile_pos[i] = ImLerp(partile_pos[i], partile_target_pos[i], ImGui::GetIO().DeltaTime * (partile_speed[i] / 60));
        partile_rotate[i] += ImGui::GetIO().DeltaTime;

        if (partile_pos[i].y > screen_size.y)
        {
            partile_pos[i].x = 0;
            partile_pos[i].y = 0;
            partile_rotate[i] = 0;
        }

        ImGui::GetWindowDrawList()->AddCircleFilled(partile_pos[i], partile_size[i], ImGui::GetColorU32(ImStyle::general_color), 20);
        ImGui::GetWindowDrawList()->AddShadowCircle(partile_pos[i], 2.5f, ImGui::GetColorU32(ImStyle::general_color), 40.f + partile_size[i], ImVec2(0, 0), 0, 20);
    }
}

void ParticlesWhite()
{

    ImVec2 screen_size = { (float)GetSystemMetrics(SM_CXSCREEN), (float)GetSystemMetrics(SM_CYSCREEN) };

    static ImVec2 partile_pos[100];
    static ImVec2 partile_target_pos[100];
    static float partile_speed[100];
    static float partile_size[100];
    static float partile_radius[100];
    static float partile_rotate[100];

    for (int i = 1; i < 30; i++)
    {
        if (partile_pos[i].x == 0 || partile_pos[i].y == 0)
        {
            partile_pos[i].x = (float)(rand() % (int)screen_size.x + 1);
            partile_pos[i].y = -15.f;
            partile_speed[i] = (float)(1 + rand() % 25);
            partile_radius[i] = (float)(rand() % 3);
            partile_size[i] = (float)(rand() % 3);

            partile_target_pos[i].x = (float)(rand() % (int)screen_size.x);
            partile_target_pos[i].y = screen_size.y * 2.f;
        }

        partile_pos[i] = ImLerp(partile_pos[i], partile_target_pos[i], ImGui::GetIO().DeltaTime * (partile_speed[i] / 60));
        partile_rotate[i] += ImGui::GetIO().DeltaTime;

        if (partile_pos[i].y > screen_size.y)
        {
            partile_pos[i].x = 0;
            partile_pos[i].y = 0;
            partile_rotate[i] = 0;
        }

        ImGui::GetWindowDrawList()->AddCircleFilled(partile_pos[i], partile_size[i], ImColor(1.f,1.f,1.f,1.f), 20);
        ImGui::GetWindowDrawList()->AddShadowCircle(partile_pos[i], 2.5f, ImColor(1.f, 1.f, 1.f, 1.f), 40.f + partile_size[i], ImVec2(0, 0), 0, 20);
    }
}


void Hexagons()
{
    ImVec2 screen_size = { (float)GetSystemMetrics(SM_CXSCREEN), (float)GetSystemMetrics(SM_CYSCREEN) };

    static ImVec2 partile_pos[100];
    static ImVec2 partile_target_pos[100];
    static float partile_speed[100];
    static float partile_size[100];
    static float partile_radius[100];
    static float partile_rotate[100];

    for (int i = 1; i < 30; i++)
    {
        if (partile_pos[i].x == 0 || partile_pos[i].y == 0)
        {
            partile_pos[i].x = (float)(rand() % (int)screen_size.x + 1);
            partile_pos[i].y = -15.f;
            partile_speed[i] = (float)(1 + rand() % 25);
            partile_radius[i] = (float)(rand() % 4);
            partile_size[i] = (float)(rand() % 8);

            partile_target_pos[i].x = (float)(rand() % (int)screen_size.x);
            partile_target_pos[i].y = screen_size.y * 2.f;
        }

        partile_pos[i] = ImLerp(partile_pos[i], partile_target_pos[i], ImGui::GetIO().DeltaTime * (partile_speed[i] / 60));
        partile_rotate[i] += ImGui::GetIO().DeltaTime;

        if (partile_pos[i].y > screen_size.y)
        {
            partile_pos[i].x = 0;
            partile_pos[i].y = 0;
            partile_rotate[i] = 0;
        }

        ImDrawList* draw_list = ImGui::GetWindowDrawList();
        float angle_offset = partile_rotate[i];
        float radius = partile_size[i];

        ImVec2 hex[6];
        for (int j = 0; j < 6; j++)
        {
            float angle = angle_offset + j * IM_PI / 3.0f;
            hex[j] = ImVec2(partile_pos[i].x + cosf(angle) * radius * 0.7f,
                partile_pos[i].y + sinf(angle) * radius * 0.7f);
        }

        draw_list->AddConvexPolyFilled(hex, 6, ImGui::GetColorU32(ImStyle::general_color));
        draw_list->AddShadowCircle(partile_pos[i], 6.f, ImGui::GetColorU32(ImStyle::general_color), 30.f + partile_size[i], ImVec2(0, 0), 0, 12);
    }
}


void HexagonsW()
{
    ImVec2 screen_size = { (float)GetSystemMetrics(SM_CXSCREEN), (float)GetSystemMetrics(SM_CYSCREEN) };

    static ImVec2 partile_pos[100];
    static ImVec2 partile_target_pos[100];
    static float partile_speed[100];
    static float partile_size[100];
    static float partile_radius[100];
    static float partile_rotate[100];

    for (int i = 1; i < 30; i++)
    {
        if (partile_pos[i].x == 0 || partile_pos[i].y == 0)
        {
            partile_pos[i].x = (float)(rand() % (int)screen_size.x + 1);
            partile_pos[i].y = -15.f;
            partile_speed[i] = (float)(1 + rand() % 25);
            partile_radius[i] = (float)(rand() % 4);
            partile_size[i] = (float)(rand() % 8);

            partile_target_pos[i].x = (float)(rand() % (int)screen_size.x);
            partile_target_pos[i].y = screen_size.y * 2.f;
        }

        partile_pos[i] = ImLerp(partile_pos[i], partile_target_pos[i], ImGui::GetIO().DeltaTime * (partile_speed[i] / 60));
        partile_rotate[i] += ImGui::GetIO().DeltaTime;

        if (partile_pos[i].y > screen_size.y)
        {
            partile_pos[i].x = 0;
            partile_pos[i].y = 0;
            partile_rotate[i] = 0;
        }

        ImDrawList* draw_list = ImGui::GetWindowDrawList();
        float angle_offset = partile_rotate[i];
        float radius = partile_size[i];

        ImVec2 hex[6];
        for (int j = 0; j < 6; j++)
        {
            float angle = angle_offset + j * IM_PI / 3.0f;
            hex[j] = ImVec2(partile_pos[i].x + cosf(angle) * radius * 0.7f,
                partile_pos[i].y + sinf(angle) * radius * 0.7f);
        }

        draw_list->AddConvexPolyFilled(hex, 6, ImGui::GetColorU32(ImStyle::white));
        draw_list->AddShadowCircle(partile_pos[i], 6.f, ImGui::GetColorU32(ImStyle::white), 30.f + partile_size[i], ImVec2(0, 0), 0, 12);
    }
}

float EaseOutExpo(float t) {
    return (t >= 1.0f) ? 1.0f : 1.0f - powf(2.0f, -10.0f * t);
}

// ── Shimmer color per-character ─────────────────────────────
static ImU32 ShimmerColor(float shimmer_pos, float t, ImVec4 base)
{
    // white shimmer band — Gaussian centered on shimmer_pos
    float diff = t - (shimmer_pos - 1.f);      // band travels left → right
    float band = expf(-diff * diff * 18.f);    // 18 = sharpness (matches CSS)

    float r  = base.x + (1.f - base.x) * band;
    float g  = base.y + (1.f - base.y) * band;
    float b  = base.z + (1.f - base.z) * band;

    return IM_COL32((int)(r*255), (int)(g*255), (int)(b*255), 255);
}

// ── Main function ────────────────────────────────────────────
void DrawShimmerText(const char* label, ImFont* font = nullptr, float font_size = 0.0f, ImU32 base_col = 0)
{
    ImGuiWindow* window = ImGui::GetCurrentWindow();
    if (window->SkipItems) return;

    if (font == nullptr) font = ImGui::GetFont();
    float fsize = font_size > 0.0f ? font_size : ImGui::GetFontSize();
    
    ImVec2 tsize = font->CalcTextSizeA(fsize, FLT_MAX, 0.f, label);
    ImVec2 pos = ImGui::GetCursorScreenPos();

    // advance cursor so layout works normally
    ImGui::Dummy(tsize);

    ImDrawList* dl = ImGui::GetWindowDrawList();
    ImVec4 base = base_col == 0 ? ImStyle::general_color : ImGui::ColorConvertU32ToFloat4(base_col);

    // shimmer position: 0 → 2, loops every 2 seconds
    float shimmer_pos = fmodf((float)ImGui::GetTime() * 1.0f, 2.f);

    // walk each character, colorise by X position
    float x = pos.x;
    const char* p = label;
    while (*p)
    {
        const ImFontGlyph* glyph = font->FindGlyph((ImWchar)(unsigned char)*p);
        if (!glyph) { p++; continue; }

        float glyph_w = glyph->AdvanceX * (fsize / font->FontSize);
        float t = ImClamp((x - pos.x) / (tsize.x > 0 ? tsize.x : 1.f), 0.f, 1.f);
        ImU32 col = ShimmerColor(shimmer_pos, t, base);

        char buf[2] = { *p, '\0' };
        dl->AddText(font, fsize, ImVec2(x, pos.y), col, buf);

        x += glyph_w;
        p++;
    }
}

void RenderAnimatedText(const char* finalText, float startX, float startY, ImFont* font, float revealSpeed = 0.0035f, int scrambleFrames = 6) {
    static int currentChar = 0;
    static float timer = 0.0f;
    static int scrambleCounter = 0;
    static char currentScramble = ' ';
    static std::string displayed = "";

    static float shadowFadeTimer = 0.0f;
    static float shadowAlpha = 0.0f;

    static const float shadowDelay = 0.4f;
    static const float shadowFadeDuration = 0.6f;

    static const float slideDelay = 0.4f;
    static const float slideDuration = 0.6f;
    static float textMoveTimer = 0.0f;
    static float textMoveAlpha = 0.0f;

    static const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=<>?";

    ImGuiIO& io = ImGui::GetIO();
    timer += io.DeltaTime;

    const size_t len = strlen(finalText);

    if ((size_t)currentChar < len) {
        if (timer >= revealSpeed) {
            timer = 0.0f;
            scrambleCounter++;

            if (scrambleCounter >= scrambleFrames) {
                displayed += finalText[currentChar];
                currentChar++;
                scrambleCounter = 0;
            }
            else {
                currentScramble = charset[rand() % (int)(sizeof(charset) - 1)];
            }
        }
    }

    if ((size_t)currentChar >= len) {
        shadowFadeTimer += io.DeltaTime;
        if (shadowFadeTimer > shadowDelay) {
            float fadeProgress = (shadowFadeTimer - shadowDelay) / shadowFadeDuration;
            shadowAlpha = ImClamp(fadeProgress, 0.0f, 1.0f);
        }

        if (shadowAlpha >= 1.0f) {
            textMoveTimer += io.DeltaTime;
            if (textMoveTimer >= slideDelay) {
                float slideProgress = (textMoveTimer - slideDelay) / slideDuration;
                textMoveAlpha = ImClamp(slideProgress, 0.0f, 1.0f);
            }
        }
    }

    std::string renderText = displayed;
    if (currentChar < len && scrambleCounter > 0) {
        renderText += currentScramble;
    }

    ImGui::PushFont(font);

    ImVec2 fullTextSize = ImGui::CalcTextSize(finalText);
    ImVec2 renderTextSize = ImGui::CalcTextSize(renderText.c_str());
    float baseY = startY;
    float targetY = 10.0f;

    float easedAlpha = EaseOutExpo(textMoveAlpha);
    float animatedY = ImLerp(baseY, targetY, easedAlpha);
    float startScale = 1.0f;
    float targetScale = 0.6f;
    float currentScale = ImLerp(startScale, targetScale, easedAlpha);

    ImVec2 scaledFullTextSize = ImVec2(fullTextSize.x * currentScale, fullTextSize.y * currentScale);
    ImVec2 pos = ImVec2((ImGui::GetWindowSize().x - scaledFullTextSize.x) * 0.5f + startX, animatedY);
    ImU32 textColor = ImGui::GetColorU32(ImStyle::text::text_active);

    ImVec4 baseShadowColor = ImGui::ColorConvertU32ToFloat4(textColor);
    baseShadowColor.w *= shadowAlpha;
    ImU32 shadowColor = ImGui::ColorConvertFloat4ToU32(baseShadowColor);

    ImDrawList* drawList = ImGui::GetWindowDrawList();
    ImVec2 winPos = ImGui::GetWindowPos();
    ImVec2 winSize = ImGui::GetWindowSize();
    ImVec2 circleCenter = ImVec2(winPos.x + winSize.x * 0.5f, winPos.y + winSize.y + 180.f);

    float revealProgress = (float)currentChar / (float)len;
    float fadeInAlpha = ImClamp(revealProgress * 2.f, 0.0f, 1.0f);

    ImVec4 circleColor = ImGui::ColorConvertU32ToFloat4(ImGui::GetColorU32(ImStyle::general_color));
    circleColor.w = fadeInAlpha * 0.35f;
    ImU32 circleColU32 = ImGui::ColorConvertFloat4ToU32(circleColor);
    drawList->AddShadowCircle(circleCenter, 200.f, circleColU32, 400.f, ImVec2(0, 0), 0, 64);

    font->Scale = currentScale;
    ImGui::PushFont(font);
    
    // Draw shimmer text instead of shadow text
    ImGui::SetCursorPos(pos);
    DrawShimmerText(renderText.c_str(), font, font->FontSize * currentScale, textColor);

    ImGui::PopFont();
    font->Scale = 1.0f;
    ImGui::PopFont();

    if (fabsf(animatedY - targetY) < 0.5f) {
        show_particles = true;
    }
}



ID3D11ShaderResourceView* circle_loading = nullptr;
ID3D11ShaderResourceView* minecraft_pic = nullptr;
ID3D11ShaderResourceView* lg = nullptr;

static ID3D11Device* g_pd3dDevice = NULL;
static ID3D11DeviceContext* g_pd3dDeviceContext = NULL;
static IDXGISwapChain* g_pSwapChain = NULL;
static ID3D11RenderTargetView* g_mainRenderTargetView = NULL;

bool CreateDeviceD3D(HWND hWnd);
void CleanupDeviceD3D();
void CreateRenderTarget();
void CleanupRenderTarget();
LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

using namespace ImStyle;

#include <thread>
#include <chrono>
#include <random>

inline HWND hwnd;
inline RECT rc;

static DWORD tick_count = GetTickCount();

int ProcId = 0;

static DWORD findMyProc(const char* procname) {
    if (procname == NULL)
        return 0;
    DWORD pid = 0;
    DWORD threadCount = 0;

    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe;

    pe.dwSize = (DWORD)sizeof(PROCESSENTRY32);
    Process32First(hSnap, &pe);
    while (Process32Next(hSnap, &pe)) {
        if (_tcsicmp(pe.szExeFile, procname) == 0) {
            if (pe.cntThreads > threadCount) {
                threadCount = pe.cntThreads;

                pid = pe.th32ProcessID;

            }
        }
    }
    return pid;
}

static DWORD GetPid(const char* procname) {

    if (procname == NULL)
        return 0;
    DWORD pid = 0;
    DWORD threadCount = 0;

    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe;

    pe.dwSize = (DWORD)sizeof(PROCESSENTRY32);
    Process32First(hSnap, &pe);
    while (Process32Next(hSnap, &pe)) {
        if (_tcsicmp(pe.szExeFile, procname) == 0) {
            if (pe.cntThreads > threadCount) {
                threadCount = pe.cntThreads;

                pid = pe.th32ProcessID;

            }
        }
    }
    return pid;
}

const char* GetEmulatorRunning() {
    if (GetPid("HD-Player.exe") != 0)
        return "HD-Player.exe";

    else if (GetPid("MEmuHeadless.exe") != 0)
        return "MEmuHeadless.exe";

    else if (GetPid("LdVBoxHeadless.exe") != 0)
        return "LdVBoxHeadless.exe";

    else if (GetPid("AndroidProcess.exe") != 0)
        return "AndroidProcess.exe";

    else if (GetPid("aow_exe.exe") != 0)
        return "aow_exe.exe";

    else if (GetPid("Nox.exe") != 0)
        return "Nox.exe";
}

DWORD processId = findMyProc(GetEmulatorRunning());


bool InjectDLL(const char* targetProcessName, const char* dllPath) {

    PROCESSENTRY32 processEntry;
    processEntry.dwSize = (DWORD)sizeof(PROCESSENTRY32);

    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        std::cerr << "Erro ao criar o snapshot do processo\n";
        return false;
    }

    HANDLE hProcess = nullptr;
    if (Process32First(hSnapshot, &processEntry)) {
        do {
            if (_stricmp(processEntry.szExeFile, targetProcessName) == 0) {
                hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processEntry.th32ProcessID);
                break;
            }
        } while (Process32Next(hSnapshot, &processEntry));
    }

    CloseHandle(hSnapshot);

    if (hProcess == nullptr) {
        std::cerr << "Processo alvo n�o encontrado\n";
        return false;
    }


    LPVOID pRemoteMemory = VirtualAllocEx(hProcess, nullptr, MAX_PATH, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (pRemoteMemory == nullptr) {
        std::cerr << "Erro ao alocar mem�ria remota\n";
        CloseHandle(hProcess);
        return false;
    }


    WriteProcessMemory(hProcess, pRemoteMemory, dllPath, strlen(dllPath) + 1, nullptr);


    HANDLE hThread = CreateRemoteThread(hProcess, nullptr, 0, (LPTHREAD_START_ROUTINE)LoadLibraryA, pRemoteMemory, 0, nullptr);
    if (hThread == nullptr) {
        std::cerr << "Erro ao criar a thread remota\n";
        VirtualFreeEx(hProcess, pRemoteMemory, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }


    WaitForSingleObject(hThread, INFINITE);


    CloseHandle(hThread);
    VirtualFreeEx(hProcess, pRemoteMemory, 0, MEM_RELEASE);
    CloseHandle(hProcess);

    std::cout << "DLL injetada com sucesso!\n";
    return true;
}

bool EjectDLL(const char* targetProcessName, const char* dllPath) {

    PROCESSENTRY32 processEntry;
    processEntry.dwSize = (DWORD)sizeof(PROCESSENTRY32);

    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        std::cerr << "Erro ao criar o snapshot do processo\n";
        return false;
    }

    HANDLE hProcess = nullptr;
    if (Process32First(hSnapshot, &processEntry)) {
        do {
            if (_stricmp(processEntry.szExeFile, targetProcessName) == 0) {
                hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processEntry.th32ProcessID);
                break;
            }
        } while (Process32Next(hSnapshot, &processEntry));
    }

    CloseHandle(hSnapshot);

    if (hProcess == nullptr) {
        std::cerr << "Processo alvo n�o encontrado\n";
        return false;
    }


    HMODULE hModule = GetModuleHandleA(dllPath);
    if (hModule == nullptr) {
        std::cerr << "Erro ao obter o identificador do m�dulo da DLL\n";
        CloseHandle(hProcess);
        return false;
    }

    // Obter o endere�o da fun��o FreeLibrary
    FARPROC pFreeLibrary = GetProcAddress(GetModuleHandleA("kernel32.dll"), "FreeLibrary");
    if (pFreeLibrary == nullptr) {
        std::cerr << "Erro ao obter o endere�o de FreeLibrary\n";
        CloseHandle(hProcess);
        return false;
    }


    HANDLE hThread = CreateRemoteThread(hProcess, nullptr, 0, (LPTHREAD_START_ROUTINE)pFreeLibrary, (LPVOID)hModule, 0, nullptr);
    if (hThread == nullptr) {
        std::cerr << "Erro ao criar a thread remota\n";
        CloseHandle(hProcess);
        return false;
    }


    WaitForSingleObject(hThread, INFINITE);

    // Limpar recursos
    CloseHandle(hThread);
    CloseHandle(hProcess);

    std::cout << "DLL removida com sucesso!\n";

    return true;
}



void move_window() {
    static bool isDragging = false;
    static POINT offset;

    if (ImGui::IsWindowHovered(ImGuiHoveredFlags_RootAndChildWindows) && ImGui::IsMouseClicked(ImGuiMouseButton_Left) && !ImGui::IsAnyItemActive())
    {
        POINT mousePos;
        GetCursorPos(&mousePos);
        RECT rect;
        GetWindowRect(hwnd, &rect);
        offset.x = mousePos.x - rect.left;
        offset.y = mousePos.y - rect.top;
        isDragging = true;
    }

    if (isDragging)
    {
        if (ImGui::IsMouseDown(ImGuiMouseButton_Left))
        {
            POINT mousePos;
            GetCursorPos(&mousePos);
            SetWindowPos(hwnd, NULL, mousePos.x - offset.x, mousePos.y - offset.y, 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_ASYNCWINDOWPOS);
        }
        else
        {
            isDragging = false;
        }
    }
}

void RenderBlur(HWND _hwnd)
{
    struct ACCENT_POLICY
    {
        int AccentState;
        int AccentFlags;
        int GradientColor;
        int AnimationId;
    };
    struct WINDOWCOMPOSITIONATTRIBDATA
    {
        int Attrib;
        void* pvData;
        int cbData;
    };
    ACCENT_POLICY accent = { 3, 0, 0, 0 };
    WINDOWCOMPOSITIONATTRIBDATA data = { 19, &accent, sizeof(accent) };
    typedef BOOL(WINAPI* pSetWindowCompositionAttribute)(HWND, WINDOWCOMPOSITIONATTRIBDATA*);
    static pSetWindowCompositionAttribute SetWindowCompositionAttribute = (pSetWindowCompositionAttribute)GetProcAddress(GetModuleHandleW(L"user32.dll"), "SetWindowCompositionAttribute");
    if (SetWindowCompositionAttribute)
    {
        SetWindowCompositionAttribute(_hwnd, &data);
    }
}


bool CreateDeviceD3D(HWND hWnd)
{
    DXGI_SWAP_CHAIN_DESC sd;
    ZeroMemory(&sd, sizeof(sd));
    sd.BufferCount = 2;
    sd.BufferDesc.Width = 0;
    sd.BufferDesc.Height = 0;
    sd.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    sd.BufferDesc.RefreshRate.Numerator = 60;
    sd.BufferDesc.RefreshRate.Denominator = 1;
    sd.Flags = DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH;
    sd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    sd.OutputWindow = hWnd;
    sd.SampleDesc.Count = 1;
    sd.SampleDesc.Quality = 0;
    sd.Windowed = TRUE;
    sd.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;

    UINT createDeviceFlags = 0;

    D3D_FEATURE_LEVEL featureLevel;
    const D3D_FEATURE_LEVEL featureLevelArray[2] = { D3D_FEATURE_LEVEL_11_0, D3D_FEATURE_LEVEL_10_0, };
    if (D3D11CreateDeviceAndSwapChain(NULL, D3D_DRIVER_TYPE_HARDWARE, NULL, createDeviceFlags, featureLevelArray, 2, D3D11_SDK_VERSION, &sd, &g_pSwapChain, &g_pd3dDevice, &featureLevel, &g_pd3dDeviceContext) != S_OK)
        return false;

    CreateRenderTarget();
    return true;
}

void CleanupDeviceD3D()
{
    CleanupRenderTarget();
    if (g_pSwapChain) { g_pSwapChain->Release(); g_pSwapChain = NULL; }
    if (g_pd3dDeviceContext) { g_pd3dDeviceContext->Release(); g_pd3dDeviceContext = NULL; }
    if (g_pd3dDevice) { g_pd3dDevice->Release(); g_pd3dDevice = NULL; }
}

void CreateRenderTarget()
{
    ID3D11Texture2D* pBackBuffer;
    g_pSwapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBuffer));
    g_pd3dDevice->CreateRenderTargetView(pBackBuffer, NULL, &g_mainRenderTargetView);
    pBackBuffer->Release();
}

void CleanupRenderTarget()
{
    if (g_mainRenderTargetView) { g_mainRenderTargetView->Release(); g_mainRenderTargetView = NULL; }
}

extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam))
        return true;

    switch (msg)
    {
    case WM_SIZE:
        if (g_pd3dDevice != NULL && wParam != SIZE_MINIMIZED)
        {
            CleanupRenderTarget();
            g_pSwapChain->ResizeBuffers(0, (UINT)LOWORD(lParam), (UINT)HIWORD(lParam), DXGI_FORMAT_UNKNOWN, 0);
            CreateRenderTarget();
        }
        return 0;
    case WM_SYSCOMMAND:
        if ((wParam & 0xfff0) == SC_KEYMENU) // Disable ALT application menu
            return 0;
        break;
    case WM_DESTROY:
        ::PostQuitMessage(0);
        return 0;
    }
    return ::DefWindowProc(hWnd, msg, wParam, lParam);
}
