#include "DynamicSelector.h"
#include <map>
#include <algorithm>

// Animation states
struct SelectorAnimState {
    float hoverProgress[32] = { 0 };
    float activeProgress[32] = { 0 };
    float dotScale[32] = { 0 };
    float glowAlpha[32] = { 0 };
    ImVec2 particlePos[32][15];
    ImVec2 particleVel[32][15];
    float particleAlpha[32][15] = { 0 };
    float shimmerOffset = 0;
    float shimmerTimer = 0;
    bool initialized = false;
};

static std::map<int, SelectorAnimState> animStates;

static float RandomFloat(float min, float max) {
    return min + (float)rand() / (float)RAND_MAX * (max - min);
}

// Helper function to get content area width
static float GetContentWidth() {
    return ImStyle::window::size.x - 320;
}

// Helper function to get centered X position
static float GetCenterX() {
    return GetContentWidth() / 2 + 160;
}

// Helper: Smooth step function
static float SmoothStep(float edge0, float edge1, float x) {
    float t = ImClamp((x - edge0) / (edge1 - edge0), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
}

void RenderDynamicSelector(const SelectorConfig& config) {
    ImGuiContext& g = *GImGui;
    ImGuiWindow* window = ImGui::GetCurrentWindow();
    ImDrawList* draw = ImGui::GetWindowDrawList();

    int id = (int)(config.label[0]) * 1000 + config.style;
    auto& anim = animStates[id];

    // Initialize particles
    if (!anim.initialized) {
        for (int i = 0; i < 32; i++) {
            for (int j = 0; j < 15; j++) {
                anim.particlePos[i][j] = ImVec2(0, 0);
                anim.particleVel[i][j] = ImVec2(RandomFloat(-8, 8), RandomFloat(-6, 6));
                anim.particleAlpha[i][j] = RandomFloat(0.05f, 0.6f);
            }
        }
        anim.initialized = true;
    }

    // Label
    ImGui::PushFont(lexend_b);
    ImGui::TextColored(ImGui::ColorConvertU32ToFloat4(ImGui::GetColorU32(ImStyle::general_color)), config.label);
    ImGui::PopFont();
    ImGui::Spacing();

    ImU32 activeColor = ImGui::GetColorU32(ImStyle::general_color);
    ImColor activeColorIm = ImColor(ImStyle::general_color);
    ImVec2 winPos = ImGui::GetWindowPos();
    float speed = config.animationSpeed * ImGui::GetIO().DeltaTime;
    float contentWidth = GetContentWidth();
    int itemCount = (int)config.items.size();

    switch (config.style) {
        // ═══════════════════════════════════════
    case STYLE_SEGMENTED_BUTTON: {
        float btnWidth = (contentWidth - (itemCount - 1) * 5) / itemCount;
        btnWidth = ImClamp(btnWidth, 80.f, 150.f);

        for (int i = 0; i < itemCount; i++) {
            if (i > 0) ImGui::SameLine(0, 5);

            bool isActive = (*config.selectedIndex == i);
            anim.activeProgress[i] = ImLerp(anim.activeProgress[i], isActive ? 1.0f : 0.0f, speed);

            ImVec4 bgCol = ImLerp(ImVec4(0.15f, 0.15f, 0.15f, 1.0f), ImStyle::general_color, anim.activeProgress[i]);
            ImVec4 textCol = ImVec4(ImLerp(0.5f, 1.0f, anim.activeProgress[i]), ImLerp(0.5f, 1.0f, anim.activeProgress[i]), ImLerp(0.5f, 1.0f, anim.activeProgress[i]), 1.0f);

            ImGui::PushStyleColor(ImGuiCol_Button, bgCol);
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, 0.3f));
            ImGui::PushStyleColor(ImGuiCol_Text, textCol);

            std::string btnText = config.showIcon ? config.items[i].icon + " " + config.items[i].name : config.items[i].name;
            if (ImGui::Button(btnText.c_str(), ImVec2(btnWidth, 32))) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }
            ImGui::PopStyleColor(3);
        }
        break;
    }

                               // ═══════════════════════════════════════
    case STYLE_CARD_RADIO: {
        ImVec2 cardSize = ImVec2(contentWidth, 42);

        for (int i = 0; i < itemCount; i++) {
            ImVec2 cardPos = ImGui::GetCursorPos();
            bool isActive = (*config.selectedIndex == i);

            anim.activeProgress[i] = ImLerp(anim.activeProgress[i], isActive ? 1.0f : 0.0f, speed);
            anim.hoverProgress[i] = ImLerp(anim.hoverProgress[i], ImGui::IsMouseHoveringRect(ImVec2(winPos.x + cardPos.x + 160, winPos.y + cardPos.y), ImVec2(winPos.x + cardPos.x + 160 + cardSize.x, winPos.y + cardPos.y + cardSize.y)) ? 1.0f : 0.0f, speed * 2);

            float alpha = anim.activeProgress[i] * 0.25f + anim.hoverProgress[i] * 0.05f;
            ImColor bgCol = ImColor(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, alpha);
            ImColor borderCol = ImColor(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, anim.activeProgress[i] * 0.8f + anim.hoverProgress[i] * 0.2f);

            // Card background
            draw->AddRectFilled(ImVec2(winPos.x + cardPos.x + 160, winPos.y + cardPos.y), ImVec2(winPos.x + cardPos.x + 160 + cardSize.x, winPos.y + cardPos.y + cardSize.y), bgCol, 6.f);
            if (isActive || anim.hoverProgress[i] > 0.1f) {
                draw->AddRect(ImVec2(winPos.x + cardPos.x + 160, winPos.y + cardPos.y), ImVec2(winPos.x + cardPos.x + 160 + cardSize.x, winPos.y + cardPos.y + cardSize.y), borderCol, 6.f, 0, 1.5f);
            }

            // Radio button
            ImGui::SetCursorPos(ImVec2(cardPos.x + 15, cardPos.y + 9));
            if (ImGui::RadioButton(("##card" + std::to_string(i)).c_str(), *config.selectedIndex == i)) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }

            // Icon + Text
            float textX = cardPos.x + 45;
            if (config.showIcon && !config.items[i].icon.empty()) {
                ImGui::SetCursorPos(ImVec2(textX, cardPos.y + 5));
                ImGui::PushFont(icon_moon);
                ImGui::TextColored(isActive ? ImGui::ColorConvertU32ToFloat4(activeColor) : ImVec4(0.5f, 0.5f, 0.5f, 1.0f), "%s", config.items[i].icon.c_str());
                ImGui::PopFont();
                textX += 25;
            }

            ImGui::SetCursorPos(ImVec2(textX, cardPos.y + 4));
            ImGui::PushFont(lexend_b);
            ImU32 textCol = isActive ? activeColor : ImGui::ColorConvertFloat4ToU32(ImVec4(1, 1, 1, 0.78f));
            ImGui::TextColored(ImGui::ColorConvertU32ToFloat4(textCol), "%s", config.items[i].name.c_str());
            ImGui::PopFont();

            if (config.showDescription && !config.items[i].description.empty()) {
                ImGui::SetCursorPos(ImVec2(textX, cardPos.y + 24));
                ImGui::TextColored(ImVec4(0.5f, 0.5f, 0.5f, 1.0f), "%s", config.items[i].description.c_str());
            }

            ImGui::SetCursorPosY(cardPos.y + cardSize.y + 6);
        }
        break;
    }

                         // ═══════════════════════════════════════
    case STYLE_DOTS_SLIDER: {
        float centerX = GetCenterX();

        // Title with smooth fade
        float titleWidth = ImGui::CalcTextSize(config.items[*config.selectedIndex].name.c_str()).x;
        ImGui::SetCursorPosX(centerX - titleWidth / 2 - 160);
        ImGui::TextColored(ImGui::ColorConvertU32ToFloat4(activeColor), "%s", config.items[*config.selectedIndex].name.c_str());
        ImGui::Spacing();

        float dotSpacing = 35.f;
        float totalDotsWidth = itemCount * dotSpacing;
        float startX = centerX - totalDotsWidth / 2 + 10;

        for (int i = 0; i < itemCount; i++) {
            ImGui::SetCursorPos(ImVec2(startX + i * dotSpacing - 160, ImGui::GetCursorPosY()));
            ImVec2 dotPos = ImGui::GetCursorScreenPos();
            bool isActive = (*config.selectedIndex == i);

            anim.dotScale[i] = ImLerp(anim.dotScale[i], isActive ? 1.0f : 0.5f, speed);

            float radius = isActive ? 6.f : 4.f;
            ImU32 dotCol = isActive ? activeColor : ImGui::ColorConvertFloat4ToU32(ImVec4(0.31f, 0.31f, 0.31f, 1.0f));

            // Glow effect
            if (isActive) {
                draw->AddCircleFilled(ImVec2(dotPos.x + 8, dotPos.y + 8), radius * 3.f, ImColor(activeColorIm.Value.x, activeColorIm.Value.y, activeColorIm.Value.z, 0.2f), 12);
            }
            draw->AddCircleFilled(ImVec2(dotPos.x + 8, dotPos.y + 8), radius * anim.dotScale[i], dotCol, 12);

            // Clickable area
            ImGui::SetCursorPos(ImVec2(startX + i * dotSpacing - 160, ImGui::GetCursorPosY() - 8));
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0, 0, 0, 0));
            if (ImGui::Button(("##dot" + std::to_string(i)).c_str(), ImVec2(20, 20))) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }
            ImGui::PopStyleColor();

            if (i < itemCount - 1) ImGui::SameLine(0, dotSpacing - 20);
        }
        break;
    }

                          // ═══════════════════════════════════════
    case STYLE_UNDERLINE_TABS: {
        float tabWidth = (contentWidth - (itemCount - 1) * 10) / itemCount;
        tabWidth = ImMax(tabWidth, 60.f);

        for (int i = 0; i < itemCount; i++) {
            if (i > 0) ImGui::SameLine(0, 10);
            bool isActive = (*config.selectedIndex == i);

            anim.activeProgress[i] = ImLerp(anim.activeProgress[i], isActive ? 1.0f : 0.0f, speed);

            ImVec4 textCol = ImLerp(ImVec4(0.5f, 0.5f, 0.5f, 1.0f), ImStyle::general_color, anim.activeProgress[i]);

            ImGui::PushStyleColor(ImGuiCol_Text, textCol);
            if (ImGui::Button(config.items[i].name.c_str(), ImVec2(tabWidth, 28))) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }
            ImGui::PopStyleColor();
        }

        // Active underline with smooth slide
        float activeX = ImGui::GetCursorPosX() - contentWidth + (*config.selectedIndex) * (tabWidth + 10);
        ImVec2 lineStart = ImVec2(winPos.x + activeX + 160, winPos.y + ImGui::GetCursorPosY() - 2);
        draw->AddLine(lineStart, ImVec2(lineStart.x + tabWidth, lineStart.y), activeColor, 2.5f);
        break;
    }

                             // ═══════════════════════════════════════
    case STYLE_ARROW_SLIDER: {
        float centerX = GetCenterX();

        float arrowWidth = 35.f;
        float textWidth = 200.f;
        float totalWidth = arrowWidth * 2 + textWidth;
        float startX = centerX - totalWidth / 2 - 160;
        float yPos = ImGui::GetCursorPosY();

        // Left Arrow
        ImGui::SetCursorPos(ImVec2(startX + 160, yPos));
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.1f, 0.1f, 0.1f, 1.0f));
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, 0.3f));
        ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(0.8f, 0.8f, 0.8f, 1.0f));
        if (ImGui::Button("<", ImVec2(arrowWidth, 32))) {
            (*config.selectedIndex)--;
            if (*config.selectedIndex < 0) *config.selectedIndex = itemCount - 1;
            if (config.onSelectCallback) config.onSelectCallback(*config.selectedIndex);
        }
        ImGui::PopStyleColor(3);

        ImGui::SameLine(0, 0);

        // Center Text Area
        ImGui::SetCursorPos(ImVec2(startX + 160 + arrowWidth, yPos));
        ImVec2 textAreaPos = ImGui::GetCursorScreenPos();

        draw->AddRectFilled(ImVec2(textAreaPos.x, textAreaPos.y), ImVec2(textAreaPos.x + textWidth, textAreaPos.y + 32), ImColor(12, 12, 12, 255), 4.f);
        draw->AddRect(ImVec2(textAreaPos.x, textAreaPos.y), ImVec2(textAreaPos.x + textWidth, textAreaPos.y + 32), ImColor(30, 30, 30, 255), 4.f);

        ImVec2 textSize = ImGui::CalcTextSize(config.items[*config.selectedIndex].name.c_str());
        float textX = textAreaPos.x + (textWidth - textSize.x) / 2;
        float textY = textAreaPos.y + (32 - textSize.y) / 2;
        draw->AddText(ImVec2(textX, textY), activeColor, config.items[*config.selectedIndex].name.c_str());

        // Subtle arrows inside
        draw->AddText(ImVec2(textAreaPos.x + 8, textY), ImColor(60, 60, 60, 150), "<");
        draw->AddText(ImVec2(textAreaPos.x + textWidth - 18, textY), ImColor(60, 60, 60, 150), ">");

        // Page indicator dots
        float dotY = textAreaPos.y + 32 + 5;
        for (int i = 0; i < itemCount; i++) {
            float dotX = textAreaPos.x + textWidth / 2 - (itemCount * 10) / 2 + i * 10;
            bool isActive = (*config.selectedIndex == i);
            ImU32 dotColor = isActive ? activeColor : ImGui::ColorConvertFloat4ToU32(ImVec4(0.31f, 0.31f, 0.31f, 1.0f));
            draw->AddCircleFilled(ImVec2(dotX + 5, dotY), isActive ? 3.f : 2.f, dotColor, 8);
        }

        ImGui::SameLine(0, 0);

        // Right Arrow
        ImGui::SetCursorPos(ImVec2(startX + 160 + arrowWidth + textWidth, yPos));
        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.1f, 0.1f, 0.1f, 1.0f));
        // Fix:
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, 0.3f));
        ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(0.8f, 0.8f, 0.8f, 1.0f));
        if (ImGui::Button(">", ImVec2(arrowWidth, 32))) {
            (*config.selectedIndex)++;
            if (*config.selectedIndex >= itemCount) *config.selectedIndex = 0;
            if (config.onSelectCallback) config.onSelectCallback(*config.selectedIndex);
        }
        ImGui::PopStyleColor(3);

        ImGui::SetCursorPosY(yPos + 50);
        break;
    }

                           // ═══════════════════════════════════════
    case STYLE_HIGHLIGHT_BAR: {
        float btnWidth = contentWidth / itemCount;
        btnWidth = ImClamp(btnWidth, 80.f, 140.f);
        float totalWidth = itemCount * btnWidth;
        float startX = GetCenterX() - totalWidth / 2 - 160;
        float barY = ImGui::GetCursorPosY() + 35;

        for (int i = 0; i < itemCount; i++) {
            ImGui::SetCursorPosX(startX + i * btnWidth + 160);

            bool isActive = (*config.selectedIndex == i);
            ImVec4 textCol = isActive ? ImStyle::general_color : ImVec4(0.5f, 0.5f, 0.5f, 1.0f);

            ImGui::PushStyleColor(ImGuiCol_Text, textCol);
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0, 0, 0, 0));
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.1f, 0.1f, 0.1f, 0.5f));
            if (ImGui::Button(config.items[i].name.c_str(), ImVec2(btnWidth, 30))) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }
            ImGui::PopStyleColor(3);

            if (i < itemCount - 1) ImGui::SameLine(0, 0);
        }

        // Animated highlight barImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(0.1f, 0.1f, 0.1f, 0.5f));
        static float lastBarX[100] = { 0 };
        float targetX = startX + (*config.selectedIndex) * btnWidth;
        lastBarX[id % 100] = ImLerp(lastBarX[id % 100], targetX, speed * 2);

        draw->AddRectFilled(ImVec2(winPos.x + lastBarX[id % 100] + 160, winPos.y + 100 + barY), ImVec2(winPos.x + lastBarX[id % 100] + 160 + btnWidth, winPos.y + 100 + barY + 3), activeColor, 1.5f);
        break;
    }

                            // ═══════════════════════════════════════
    case STYLE_GLOW_CARDS: {
        ImVec2 cardSize = ImVec2(contentWidth, 50);

        for (int i = 0; i < itemCount; i++) {
            ImVec2 cardPos = ImGui::GetCursorPos();
            bool isActive = (*config.selectedIndex == i);

            anim.activeProgress[i] = ImLerp(anim.activeProgress[i], isActive ? 1.0f : 0.0f, speed);
            anim.glowAlpha[i] = ImLerp(anim.glowAlpha[i], isActive ? 1.0f : 0.0f, speed * 0.5f);

            // Glow background
            if (anim.glowAlpha[i] > 0.01f) {
                float glowSize = 30.f + anim.glowAlpha[i] * 20.f;
                ImVec2 glowPos = ImVec2(winPos.x + cardPos.x + 160 + cardSize.x - glowSize, winPos.y + cardPos.y + cardSize.y / 2);
                draw->AddCircleFilled(glowPos, glowSize, ImColor(ImStyle::general_color.x, ImStyle::general_color.y, ImStyle::general_color.z, 0.15f * anim.glowAlpha[i]), 32);
            }

            // Card background
            ImColor bgCol = isActive ? ImColor(25, 25, 30, 255) : ImColor(18, 18, 18, 255);
            draw->AddRectFilled(ImVec2(winPos.x + cardPos.x + 160, winPos.y + cardPos.y), ImVec2(winPos.x + cardPos.x + 160 + cardSize.x, winPos.y + cardPos.y + cardSize.y), bgCol, 8.f);

            if (isActive) {
                draw->AddRect(ImVec2(winPos.x + cardPos.x + 160, winPos.y + cardPos.y), ImVec2(winPos.x + cardPos.x + 160 + cardSize.x, winPos.y + cardPos.y + cardSize.y), activeColor, 8.f, 0, 2.f);
            }

            // Content
            ImGui::SetCursorPos(ImVec2(cardPos.x + 20, cardPos.y + 6));
            ImGui::PushFont(lexend_b);
            ImU32 textCol = isActive ? activeColor : ImGui::ColorConvertFloat4ToU32(ImVec4(0.8f, 0.8f, 0.8f, 1.0f));
            ImGui::TextColored(ImGui::ColorConvertU32ToFloat4(textCol), "%s", config.items[i].name.c_str());
            ImGui::PopFont();

            if (config.showDescription && !config.items[i].description.empty()) {
                ImGui::SetCursorPos(ImVec2(cardPos.x + 20, cardPos.y + 28));
                ImGui::TextColored(ImVec4(0.4f, 0.4f, 0.4f, 1.0f), "%s", config.items[i].description.c_str());
            }

            // Click detection
            ImGui::SetCursorPos(ImVec2(cardPos.x + cardSize.x - 30, cardPos.y + 10));
            ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0, 0, 0, 0));
            if (ImGui::Button(("##glow" + std::to_string(i)).c_str(), ImVec2(20, 20))) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }
            ImGui::PopStyleColor();

            // Also clickable on whole card
            ImGui::SetCursorPos(ImVec2(cardPos.x, cardPos.y));
            ImGui::InvisibleButton(("##glowCard" + std::to_string(i)).c_str(), cardSize);
            if (ImGui::IsItemClicked()) {
                *config.selectedIndex = i;
                if (config.onSelectCallback) config.onSelectCallback(i);
            }

            ImGui::SetCursorPosY(cardPos.y + cardSize.y + 8);
        }
        break;
    }

    default: break;
    }
    ImGui::Spacing();
}

float GetSelectorHeight(const SelectorConfig& config) {
    switch (config.style) {
    case STYLE_ARROW_SLIDER: return 85.f;
    case STYLE_GLOW_CARDS: return (config.items.size() * 58.f) + 30.f;
    case STYLE_CARD_RADIO: return (config.items.size() * 48.f) + 30.f;
    default: return 70.f;
    }
}