#pragma once
#include "imgui.h"
#include "imgui_internal.h"
#include "imgui_settings.h"
#include <vector>
#include <string>
#include <functional>

// Style Types
enum SelectorStyle {
    STYLE_SEGMENTED_BUTTON = 0,
    STYLE_CARD_RADIO = 1,
    STYLE_DOTS_SLIDER = 2,
    STYLE_UNDERLINE_TABS = 3,
    STYLE_HIGHLIGHT_BAR = 4,
    STYLE_ARROW_SLIDER = 5,
    STYLE_MODERN_DROPDOWN = 6,
    STYLE_GLOW_CARDS = 7
};

// Item structure
struct SelectorItem {
    std::string name;
    std::string description;
    std::string icon;
    ImVec4 customColor; // Optional custom color
};

// Main selector config
struct SelectorConfig {
    const char* label;
    std::vector<SelectorItem> items;
    int* selectedIndex;
    int style = STYLE_SEGMENTED_BUTTON;
    float animationSpeed = 8.0f;
    bool showDescription = true;
    bool showIcon = false;
    ImVec2 customSize = ImVec2(0, 0); // 0 = auto
    std::function<void(int)> onSelectCallback; // Callback when selected
};

// Render function
void RenderDynamicSelector(const SelectorConfig& config);
float GetSelectorHeight(const SelectorConfig& config);