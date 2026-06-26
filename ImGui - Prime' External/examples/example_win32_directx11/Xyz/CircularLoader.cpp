#include "CircularLoader.h"
#include "imgui_internal.h"
#include <cmath>

void CircularLoader::RenderRing(ImDrawList* draw, ImVec2 center, float radius, float thickness,
                                 float progress, float animAngle, const CircularLoaderStyle& style) {
    draw->AddShadowCircle(center, radius + 4.f, style.glowCol, 60.f, ImVec2(0,0), 0, style.segments);

    draw->AddCircle(center, radius, style.trackCol, style.segments, thickness);

    if (progress >= 0.001f) {
        float startAngle = -IM_PI * 0.5f + animAngle;
        float arcLen = IM_PI * 2.0f * progress;
        int steps = ImMax(8, (int)(style.segments * progress));
        float r = radius + thickness * 0.35f;
        float halfThick = thickness * 0.35f;
        float outerR = r + halfThick;
        float innerR = r - halfThick;

        for (int i = 0; i < steps; i++) {
            float t0 = (float)i / steps;
            float t1 = (float)(i + 1) / steps;
            float a0 = startAngle + arcLen * t0;
            float a1 = startAngle + arcLen * t1;

            ImU32 col;
            if (progress >= 1.0f) {
                col = style.checkMark;
            } else {
                float blend = t0;
                ImVec4 cA = ImGui::ColorConvertU32ToFloat4(style.fillStart);
                ImVec4 cB = ImGui::ColorConvertU32ToFloat4(style.fillEnd);
                ImVec4 c;
                c.x = cA.x + (cB.x - cA.x) * blend;
                c.y = cA.y + (cB.y - cA.y) * blend;
                c.z = cA.z + (cB.z - cA.z) * blend;
                c.w = cA.w + (cB.w - cA.w) * blend;
                col = ImGui::ColorConvertFloat4ToU32(c);
            }

            ImVec2 p0(center.x + cosf(a0) * innerR, center.y + sinf(a0) * innerR);
            ImVec2 p1(center.x + cosf(a0) * outerR, center.y + sinf(a0) * outerR);
            ImVec2 p2(center.x + cosf(a1) * outerR, center.y + sinf(a1) * outerR);
            ImVec2 p3(center.x + cosf(a1) * innerR, center.y + sinf(a1) * innerR);
            draw->AddQuadFilled(p0, p1, p2, p3, col);
        }
    }

    float pulse = (sinf(animAngle * 3.0f) + 1.0f) * 0.5f;
    draw->AddShadowCircle(center, radius + 2.f,
        ImGui::GetColorU32(ImVec4(1,1,1,0.04f * pulse)), 30.f, ImVec2(0,0), 0, style.segments);
}

void CircularLoader::RenderProgress(ImDrawList* draw, ImVec2 center, float radius, float thickness,
                                     int progress, int maxProgress, float animAngle,
                                     const char* status, const CircularLoaderStyle& style) {
    float pct = maxProgress > 0 ? ImClamp((float)progress / maxProgress, 0.0f, 1.0f) : 0.0f;

    RenderRing(draw, center, radius, thickness, pct, animAngle, style);

    char buf[16];
    if (pct < 1.0f) {
        sprintf_s(buf, sizeof(buf), "%d%%", ImMin(progress * 100 / ImMax(maxProgress, 1), 100));
    } else {
        sprintf_s(buf, sizeof(buf), "%s", "\xe2\x9c\x93");
    }
    ImVec2 ts = ImGui::CalcTextSize(buf);
    float textY = center.y - ts.y * 0.5f - (status ? 8.f : 0.f);

    ImU32 col = (pct >= 1.0f) ? style.checkMark : style.pctCol;
    draw->AddText(ImVec2(center.x - ts.x * 0.5f, textY), col, buf);

    if (status && status[0]) {
        ImVec2 sts = ImGui::CalcTextSize(status);
        draw->AddText(ImVec2(center.x - sts.x * 0.5f, center.y + radius * 1.5f), style.subTextCol, status);
    }
}

float CircularLoader::UpdateAngle(float currentAngle, float deltaTime, float speed) {
    return fmodf(currentAngle + deltaTime * speed, IM_PI * 2.0f);
}

void CircularLoader::RenderSuccess(ImDrawList* draw, ImVec2 center, float radius, float animAngle,
                                    const CircularLoaderStyle& style) {
    float pct = 1.0f;
    RenderRing(draw, center, radius, style.thickness, pct, animAngle, style);

    float s = radius * 0.35f;
    ImVec2 p1(center.x - s * 0.6f, center.y);
    ImVec2 p2(center.x - s * 0.15f, center.y + s * 0.45f);
    ImVec2 p3(center.x + s * 0.7f, center.y - s * 0.4f);
    float pulse = (sinf(animAngle * 2.0f) + 1.0f) * 0.25f + 0.75f;
    int alpha = (int)(255 * pulse);
    ImU32 col = (alpha << 24) | (style.checkMark & 0x00FFFFFF);
    draw->AddLine(p1, p2, col, 4.0f);
    draw->AddLine(p2, p3, col, 4.0f);

    draw->AddShadowCircle(center, radius + 6.f,
        ImGui::GetColorU32(ImVec4(0,1,0,0.06f * pulse)), 80.f, ImVec2(0,0), 0, 64);
}
