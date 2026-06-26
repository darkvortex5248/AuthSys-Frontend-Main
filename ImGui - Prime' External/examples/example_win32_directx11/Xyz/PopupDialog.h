#pragma once
#include "imgui.h"
#include "imgui_internal.h"
#include "imgui_settings.h"
#include <string>
#include <atomic>
#include <mutex>

class PopupDialog {
public:
    static std::atomic<bool> progressActive;
    static std::atomic<int> progressValue;
    static std::string progressTitle;
    static std::string progressStatus;
    static std::mutex progressMutex;
    static float progressAnim;

    static bool ShowConfirm(const char* title, const char* message, const char* yesText = "YES", const char* noText = "NO");
    static void ShowProgress(const char* title, int progress, const char* status);
    static void CloseProgress();
    static bool IsProgressActive();
};

void RenderPopupProgress();