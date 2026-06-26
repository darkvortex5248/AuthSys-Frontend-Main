#pragma once
#include "imgui.h"

struct CircularLoaderStyle {
    float radius = 65.0f;
    float thickness = 10.0f;
    int segments = 64;

    ImU32 trackCol = IM_COL32(25, 25, 32, 255);
    ImU32 glowCol = IM_COL32(255, 20, 147, 40);
    ImU32 fillStart = IM_COL32(255, 20, 147, 255);
    ImU32 fillEnd = IM_COL32(0, 255, 255, 255);
    ImU32 checkMark = IM_COL32(57, 255, 20, 255);

    ImU32 textCol = IM_COL32(255, 255, 255, 255);
    ImU32 subTextCol = IM_COL32(160, 160, 180, 255);
    ImU32 pctCol = IM_COL32(200, 200, 220, 255);

    float animSpeed = 3.0f;
};

class CircularLoader {
public:
    static void RenderRing(ImDrawList* draw, ImVec2 center, float radius, float thickness,
                           float progress, float animAngle, const CircularLoaderStyle& style = CircularLoaderStyle());

    static void RenderProgress(ImDrawList* draw, ImVec2 center, float radius, float thickness,
                               int progress, int maxProgress, float animAngle,
                               const char* status = nullptr,
                               const CircularLoaderStyle& style = CircularLoaderStyle());

    static float UpdateAngle(float currentAngle, float deltaTime, float speed = 3.0f);

    static void RenderSuccess(ImDrawList* draw, ImVec2 center, float radius, float animAngle,
                              const CircularLoaderStyle& style = CircularLoaderStyle());
};
