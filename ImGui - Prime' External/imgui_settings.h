#define IMGUI_DEFINE_MATH_OPERATORS
#pragma once
#include <windows.h>
#include "imgui_internal.h"
#include "imgui.h"
#include <string>
#include <vector>

inline ImFont* icon_moon = nullptr;
inline ImFont* icon_moon2 = nullptr;
inline ImFont* icomoon_widget2 = nullptr;
inline ImFont* lexend_reg = nullptr;
inline ImFont* poppins_reg = nullptr;
inline ImFont* lexend_b = nullptr;
inline ImFont* icon_widget = nullptr;
inline ImFont* inter = nullptr;
inline ImFont* notif_font = nullptr;



inline char search[64];

inline float anim_speed = 5.f;

namespace ImStyle {


	inline ImVec4 general_color = ImColor(255, 0, 0, 255);
	inline ImVec4 white = ImColor(255, 255, 255, 255);

	namespace window {
		inline ImVec4 background_pic = ImColor(255, 255, 255, 70);
		inline ImVec4 logo_pic = ImColor(255, 255, 255, 170);

		inline ImVec4 background = ImColor(10, 10, 10, 255);
		inline ImVec4 border = ImColor(50, 50, 50, 255);

		inline ImVec4 shadow_text = ImColor(general_color.x, general_color.y, general_color.z);
		inline ImVec4 shadow_panel = ImColor(0, 255, 0, 255);

		inline ImVec2 size = ImVec2(900, 560);
		inline float rounding = 17.f;

		inline ImVec2 frame_size = ImVec2(size.x / 2, 35);
	}

	namespace button {
		inline ImVec4 outline = ImColor(22, 24, 26, 255);
		inline ImVec4 background_active = ImColor(general_color.x, general_color.y, general_color.z, 255 / 255.f);
		inline ImVec4 background_hov = ImColor(general_color.x, general_color.y, general_color.z, 205 / 255.f);
		inline ImVec4 background = ImColor(general_color.x, general_color.y, general_color.z, 205 / 255.f);

		inline ImVec4 background_shadow = ImColor(45, 45, 45, 205);

		inline float rounding = 5.f;
	}

	namespace input {

		inline ImVec4 text_selected = ImColor(56, 56, 56, 70);

		inline ImVec4 background_active = ImColor(255, 255, 255, 255);
		inline ImVec4 shadow_active = ImColor(255, 255, 255, 255);
		inline ImVec4 background_hov = ImColor(general_color.x, general_color.y, general_color.z, 155 / 255.f);
		inline ImVec4 background = ImColor(general_color.x, general_color.y, general_color.z, 205 / 255.f);

		inline float rounding = 5.f;
	}

	namespace text {

		inline ImVec4 hint_text = ImColor(0, 0, 0, 0);
		inline ImVec4 have_account = ImColor(255, 255, 255, 70);

		inline ImVec4 active = ImColor(255, 255, 255, 255);
		inline ImVec4 text_active = ImColor(255, 255, 255, 255);
		inline ImVec4 text_hov = ImColor(200, 200, 200, 255);
		inline ImVec4 text = ImColor(150, 150, 150, 255);
		inline ImVec4 text2 = ImColor(255, 255, 255, 255 / 2);
	}

	namespace selector {

		inline ImVec4 icon = ImColor(47, 50, 53, 230);

		inline ImVec4 background_active = ImColor(47, 50, 53, 150);
		inline ImVec4 background_hov = ImColor(41, 44, 47, 150);
		inline ImVec4 background = ImColor(35, 38, 41, 150);

	}

	namespace elements
	{
		inline ImVec4 accent_primary = ImColor(0, 240, 255, 255);
		inline ImVec4 mark = ImColor(255, 255, 255);

		inline ImVec4 stroke = ImColor(28, 28, 28);
		inline ImVec4 background = ImColor(15, 15, 15);
		inline ImVec4 filled_circle = ImColor(25, 25, 25);
		inline ImVec4 circle = ImColor(35, 35, 35);
		inline ImVec4 background_widget = ImColor(21, 21, 21);


		inline ImVec4 text_active = ImColor(255, 255, 255);
		inline ImVec4 text_hov = ImColor(81, 92, 109);
		inline ImVec4 text = ImColor(255, 255, 255, 255 / 2);
		inline ImVec4 text1 = ImColor(200, 200, 200);

		inline float rounding = 4;


		extern ImVec4 main_color;
	}
}