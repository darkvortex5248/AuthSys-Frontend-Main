#pragma once

#include <iostream>
#define IMGUI_DEFINE_MATH_OPERATORS
#include <imgui.h>
#include <imgui_internal.h>
#include "../imgui_settings.h"
#include <Windows.h>
#include <vector>
#include <string>

enum notif_state
{
    enabling,
    waiting,
    disabling
};

static std::vector<std::string> general_text;
static std::vector<std::string> icons;
static std::vector<ImColor> notification_colors;
static std::vector<ImVec2> position;
static std::vector<notif_state> state;
static std::vector<DWORD> start_times;

const float ui_width = 900.0f;   // ✅ Match with ImStyle::window::size.x (900)
const float ui_height = 560.0f;  // ✅ Match with ImStyle::window::size.y (560)
const float animation_speed = 0.2f;

class CNotifications
{
public:
    void AddMessage(const char* notif_name, const char* icon, ImColor icon_color)
    {
        general_text.push_back(notif_name);
        notification_colors.push_back(icon_color);
        icons.push_back(icon);
        state.push_back(notif_state::enabling);
        // ✅ Start from RIGHT side (offscreen)
        position.push_back(ImVec2(ui_width + 200, ui_height + 100));
        start_times.push_back(GetTickCount());
    }

    void Render()
    {
        for (int i = 0; i < general_text.size(); )
        {
            // ============================================
            // POSITION CALCULATION - BOTTOM RIGHT
            // ============================================

            // X Position: Right side-e slide hobe
            float target_x = (state[i] == notif_state::enabling || state[i] == notif_state::waiting)
                ? ui_width - ImGui::CalcTextSize(general_text[i].c_str()).x - 90  // Right side margin
                : ui_width + 300;  // Disable hole right diye ber hobe

            // Y Position: NICHE stack hobe (bottom-to-top)
            // Last notification sobar niche, first notification sobar upore
            float target_y = ui_height - (general_text.size() - i) * 55 - 5; // 75 = spacing, 30 = bottom margin

            // Smooth animation
            position[i].x = ImLerp(position[i].x, target_x, animation_speed);
            position[i].y = ImLerp(position[i].y, target_y, animation_speed);

            // State management (1.5 sec per state)
            if (GetTickCount() - start_times[i] > 1500)
            {
                if (state[i] == notif_state::enabling)
                    state[i] = notif_state::waiting;
                else if (state[i] == notif_state::waiting)
                    state[i] = notif_state::disabling;

                start_times[i] = GetTickCount();
            }

            // Remove when fully disabled (offscreen)
            if (state[i] == notif_state::disabling && position[i].x > ui_width + 250)
            {
                state.erase(state.begin() + i);
                position.erase(position.begin() + i);
                notification_colors.erase(notification_colors.begin() + i);
                general_text.erase(general_text.begin() + i);
                icons.erase(icons.begin() + i);
                start_times.erase(start_times.begin() + i);
                continue;
            }

            // Calculate sizes
            ImGui::PushFont(icon_moon);
            ImVec2 icon_size = ImGui::CalcTextSize(icons[i].c_str());
            ImGui::PopFont();

            ImGui::PushFont(inter);
            ImVec2 text_size = ImGui::CalcTextSize(general_text[i].c_str());
            ImGui::PopFont();

            ImVec2 notif_size = ImVec2(60, 30) + text_size + ImVec2(icon_size.x, 0);

            ImVec2 rect_min = position[i] + ImVec2(20, 0);
            ImVec2 rect_max = rect_min + notif_size;

            // Draw notification background
            auto* draw = ImGui::GetForegroundDrawList();
            draw->AddRectFilled(rect_min, rect_max, ImColor(11, 11, 11, 225), 4.0f);
            draw->AddRect(rect_min, rect_max, ImColor(25, 25, 25), 4.0f);

            // Draw icon
            ImGui::PushFont(icon_moon);
            draw->AddText(position[i] + ImVec2(30, 15.5f), notification_colors[i], icons[i].c_str());
            ImGui::PopFont();

            // Draw text
            ImGui::PushFont(inter);
            draw->AddText(position[i] + ImVec2(40.0f + icon_size.x, 15.5f), ImColor(255, 255, 255, 255), general_text[i].c_str());
            ImGui::PopFont();

            ++i;
        }
    }
};