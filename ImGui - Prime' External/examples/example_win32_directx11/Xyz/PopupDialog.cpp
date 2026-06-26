#define IMGUI_DEFINE_MATH_OPERATORS
#include "PopupDialog.h"
#include "CircularLoader.h"

std::atomic<bool> PopupDialog::progressActive{false};
std::atomic<int> PopupDialog::progressValue{0};
std::string PopupDialog::progressTitle;
std::string PopupDialog::progressStatus;
std::mutex PopupDialog::progressMutex;
float PopupDialog::progressAnim = 0.0f;

bool PopupDialog::ShowConfirm(const char* title, const char* message, const char* yesText, const char* noText) {
    static float animTimer = 1.0f;
    static std::string lastTitle;

    bool result = false;

    if (!ImGui::IsPopupOpen(title))
        ImGui::OpenPopup(title);

    ImVec2 center = ImGui::GetMainViewport()->GetCenter();
    ImGui::SetNextWindowPos(center, ImGuiCond_Appearing, ImVec2(0.5f, 0.5f));
    ImGui::SetNextWindowSize(ImVec2(420, 0));

    ImGui::PushStyleColor(ImGuiCol_WindowBg, ImVec4(0, 0, 0, 0));
    ImGui::PushStyleVar(ImGuiStyleVar_WindowBorderSize, 0.f);
    ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2(0, 0));

    if (ImGui::BeginPopupModal(title, NULL,
        ImGuiWindowFlags_AlwaysAutoResize | ImGuiWindowFlags_NoMove |
        ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoDecoration |
        ImGuiWindowFlags_NoSavedSettings))
    {
        if (lastTitle != title) {
            lastTitle = title;
            animTimer = 0.0f;
        }

        float dt = ImGui::GetIO().DeltaTime;
        animTimer = ImMin(animTimer + dt * 3.5f, 1.0f);

        float alpha = animTimer;
        float easeBtn = ImClamp((animTimer - 0.25f) * 2.5f, 0.0f, 1.0f);

        ImDrawList* draw = ImGui::GetWindowDrawList();
        ImVec2 winPos = ImGui::GetWindowPos();
        ImVec2 winSize = ImGui::GetWindowSize();
        float r = 8.f;

        ImU32 bgCol = ImGui::ColorConvertFloat4ToU32(ImVec4(0.06f, 0.06f, 0.09f, alpha));
        draw->AddRectFilled(winPos, ImVec2(winPos.x + winSize.x, winPos.y + winSize.y), bgCol, r);

        float pulse = (sinf(ImGui::GetTime() * 2.5f) + 1.0f) * 0.5f;
        ImVec4 ac = ImStyle::general_color;
        ImU32 borderCol = ImGui::ColorConvertFloat4ToU32(ImVec4(
            ac.x * (0.5f + 0.5f * pulse),
            ac.y * (0.5f + 0.5f * pulse),
            ac.z * (0.5f + 0.5f * pulse),
            alpha));
        draw->AddRect(ImVec2(winPos.x + 1, winPos.y + 1),
            ImVec2(winPos.x + winSize.x - 1, winPos.y + winSize.y - 1),
            borderCol, r, ImDrawCornerFlags_All, 2.f);

        ImVec2 glowCenter(winPos.x + winSize.x * 0.5f, winPos.y + winSize.y * 0.5f);
        draw->AddShadowCircle(glowCenter, winSize.x * 0.5f,
            ImGui::ColorConvertFloat4ToU32(ImVec4(ac.x, ac.y, ac.z, 0.05f * pulse)),
            50.f, ImVec2(0, 0), 0, 32);

        ImGui::SetCursorPos(ImVec2(20, 12));

        ImU32 titleCol = ImGui::ColorConvertFloat4ToU32(ImVec4(ac.x, ac.y, ac.z, alpha));
        ImGui::PushFont(lexend_b);
        ImGui::TextColored(ImGui::ColorConvertU32ToFloat4(titleCol), "%s", title);
        ImGui::PopFont();

        ImGui::Spacing();

        ImVec2 sepStart(winPos.x + 20, ImGui::GetCursorScreenPos().y);
        ImVec2 sepEnd(winPos.x + winSize.x - 20, sepStart.y);
        float sepProg = ImMin(animTimer * 2.0f, 1.0f);
        draw->AddLine(sepStart, ImVec2(sepStart.x + (sepEnd.x - sepStart.x) * sepProg, sepStart.y),
            ImGui::ColorConvertFloat4ToU32(ImVec4(0.3f, 0.3f, 0.4f, alpha)), 1.f);

        ImGui::Spacing();
        ImGui::SetCursorPosX(20);
        ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(0.75f, 0.75f, 0.85f, alpha));
        ImGui::TextWrapped("%s", message);
        ImGui::PopStyleColor();

        ImGui::Spacing();

        ImVec2 sep2Start(winPos.x + 20, ImGui::GetCursorScreenPos().y);
        ImVec2 sep2End(winPos.x + winSize.x - 20, sep2Start.y);
        float sep2Prog = ImClamp((animTimer - 0.15f) * 2.5f, 0.0f, 1.0f);
        draw->AddLine(sep2Start, ImVec2(sep2Start.x + (sep2End.x - sep2Start.x) * sep2Prog, sep2Start.y),
            ImGui::ColorConvertFloat4ToU32(ImVec4(0.25f, 0.25f, 0.35f, alpha)), 1.f);

        ImGui::Spacing();

        float btnWidth = 130.f;
        float totalWidth = btnWidth * 2 + ImGui::GetStyle().ItemSpacing.x;
        float offsetX = (ImGui::GetWindowWidth() - totalWidth) / 2;

        ImGui::SetCursorPosX(offsetX);

        float btnAlpha = easeBtn;
        ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 10.f);
        ImGui::PushStyleVar(ImGuiStyleVar_FrameBorderSize, 1.f);

        // YES
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.12f, 0.55f, 0.28f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.18f, 0.65f, 0.35f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.08f, 0.40f, 0.20f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_Border, ImVec4(0.2f, 0.8f, 0.4f, btnAlpha * 0.5f));
        if (ImGui::Button(yesText, ImVec2(btnWidth, 40))) {
            result = true;
            ImGui::CloseCurrentPopup();
        }
        ImGui::PopStyleColor(4);

        ImGui::SameLine();

        // NO
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.55f, 0.12f, 0.12f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.65f, 0.18f, 0.18f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(0.40f, 0.08f, 0.08f, btnAlpha));
        ImGui::PushStyleColor(ImGuiCol_Border, ImVec4(0.8f, 0.2f, 0.2f, btnAlpha * 0.5f));
        if (ImGui::Button(noText, ImVec2(btnWidth, 40))) {
            result = false;
            ImGui::CloseCurrentPopup();
        }
        ImGui::PopStyleColor(4);

        ImGui::PopStyleVar(2);

        ImGui::Spacing();
        ImGui::EndPopup();
    }

    ImGui::PopStyleVar(2);
    ImGui::PopStyleColor();

    return result;
}

void PopupDialog::ShowProgress(const char* title, int progress, const char* status) {
    std::lock_guard<std::mutex> lock(progressMutex);
    progressActive.store(true, std::memory_order_release);
    progressTitle = title ? title : "";
    progressValue.store(progress, std::memory_order_release);
    progressStatus = status ? status : "";
}

void PopupDialog::CloseProgress() {
    std::lock_guard<std::mutex> lock(progressMutex);
    progressActive.store(false, std::memory_order_release);
    progressValue.store(0, std::memory_order_release);
    progressTitle.clear();
    progressStatus.clear();
}

bool PopupDialog::IsProgressActive() {
    return progressActive.load(std::memory_order_acquire);
}

void RenderPopupProgress() {
    static float animAngle = 0.0f;
    static float fadeIn = 0.0f;

    if (!PopupDialog::progressActive.load(std::memory_order_acquire)) {
        fadeIn = 0.0f;
        return;
    }

    animAngle = CircularLoader::UpdateAngle(animAngle, ImGui::GetIO().DeltaTime, 2.5f);
    fadeIn = ImMin(fadeIn + ImGui::GetIO().DeltaTime * 3.0f, 1.0f);

    if (!ImGui::IsPopupOpen("##ProgressPopup"))
        ImGui::OpenPopup("##ProgressPopup");

    std::string localTitle, localStatus;
    int localValue;
    {
        std::lock_guard<std::mutex> lock(PopupDialog::progressMutex);
        localTitle = PopupDialog::progressTitle;
        localStatus = PopupDialog::progressStatus;
        localValue = PopupDialog::progressValue.load(std::memory_order_acquire);
    }

    if (!PopupDialog::progressActive.load(std::memory_order_acquire)) return;

    ImVec2 center = ImGui::GetMainViewport()->GetCenter();
    ImGui::SetNextWindowPos(center, ImGuiCond_Always, ImVec2(0.5f, 0.5f));
    ImGui::SetNextWindowSize(ImVec2(320, 330));

    ImGui::PushStyleColor(ImGuiCol_WindowBg, ImVec4(0, 0, 0, 0));
    ImGui::PushStyleVar(ImGuiStyleVar_WindowBorderSize, 0.f);
    ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2(0, 0));

    if (ImGui::BeginPopupModal("##ProgressPopup", NULL,
        ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar |
        ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoSavedSettings))
    {
        ImDrawList* draw = ImGui::GetWindowDrawList();
        ImVec2 winPos = ImGui::GetWindowPos();
        ImVec2 winSize = ImGui::GetWindowSize();
        float r = 8.f;

        ImU32 bgCol = ImColor(18, 18, 22, (int)(255 * fadeIn));
        draw->AddRectFilled(winPos, ImVec2(winPos.x + winSize.x, winPos.y + winSize.y), bgCol, r);

        ImVec4 ac = ImStyle::general_color;
        float pulse = (sinf(ImGui::GetTime() * 2.5f) + 1.0f) * 0.5f;
        ImU32 borderCol = ImGui::ColorConvertFloat4ToU32(ImVec4(
            ac.x * (0.5f + 0.5f * pulse),
            ac.y * (0.5f + 0.5f * pulse),
            ac.z * (0.5f + 0.5f * pulse),
            0.9f * fadeIn));
        draw->AddRect(ImVec2(winPos.x + 1, winPos.y + 1),
            ImVec2(winPos.x + winSize.x - 1, winPos.y + winSize.y - 1),
            borderCol, r, ImDrawCornerFlags_All, 2.f);

        ImVec2 glowCenter(winPos.x + winSize.x * 0.5f, winPos.y + winSize.y * 0.5f);
        draw->AddShadowCircle(glowCenter, winSize.x * 0.45f,
            ImGui::ColorConvertFloat4ToU32(ImVec4(ac.x, ac.y, ac.z, 0.06f * pulse)),
            60.f, ImVec2(0, 0), 0, 32);

        // ── Title ──
        ImU32 titleCol = ImGui::ColorConvertFloat4ToU32(ImVec4(ac.x, ac.y, ac.z, fadeIn));
        draw->AddText(lexend_b, 18.f, ImVec2(winPos.x + 20, winPos.y + 14), titleCol, localTitle.c_str());

        // ── Separator line ──
        float sepY = winPos.y + 42;
        float sepLen = (winSize.x - 40) * fadeIn;
        draw->AddLine(ImVec2(winPos.x + 20, sepY), ImVec2(winPos.x + 20 + sepLen, sepY),
            ImGui::ColorConvertFloat4ToU32(ImVec4(0.3f, 0.3f, 0.4f, fadeIn)), 1.f);

        // ── Ring ──
        float ringRadius = 55.0f;
        float ringThickness = 10.0f;
        ImVec2 ringCenter(winPos.x + winSize.x * 0.5f, winPos.y + winSize.y * 0.5f - 8);

        CircularLoaderStyle style;
        style.radius = ringRadius;
        style.thickness = ringThickness;
        style.fillStart = ImGui::GetColorU32(ImStyle::general_color);
        style.fillEnd = ImGui::GetColorU32(ImStyle::general_color);
        style.glowCol = ImGui::GetColorU32(ImVec4(ac.x, ac.y, ac.z, 0.15f));
        style.checkMark = ImColor(57, 255, 20, (int)(255 * fadeIn));
        style.pctCol = ImGui::ColorConvertFloat4ToU32(ImVec4(0.8f, 0.8f, 0.9f, fadeIn));
        style.subTextCol = ImGui::ColorConvertFloat4ToU32(ImVec4(0.6f, 0.6f, 0.7f, fadeIn));

        if (localValue >= 100) {
            CircularLoader::RenderSuccess(draw, ringCenter, ringRadius, animAngle, style);
            draw->AddText(lexend_b, 16.f,
                ImVec2(ringCenter.x - ImGui::CalcTextSize("Complete!").x * 0.5f,
                       ringCenter.y + ringRadius + 22),
                style.checkMark, "Complete!");
        } else {
            CircularLoader::RenderProgress(draw, ringCenter, ringRadius, ringThickness,
                localValue, 100, animAngle, localStatus.c_str(), style);
        }

        ImGui::EndPopup();
    }

    ImGui::PopStyleVar(2);
    ImGui::PopStyleColor();
}