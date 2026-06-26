//#include "FakeLagMonitor.h"
//#include "FakeLag.h"
//#include <windows.h>
//
//void FakeLagKeyMonitor() {
//    static bool lastAimLagKey = false;
//    static bool lastLMB = false;
//
//    while (fake_lag_running || fake_lag_enabled) {
//        if (!fake_lag_enabled || !fake_lag_driver_loaded) {
//            Sleep(100);
//            continue;
//        }
//
//        extern int fake_lag_aim_key;
//
//       
//        if (fake_lag_aim_key != 0) {
//            bool pressed = (GetAsyncKeyState(fake_lag_aim_key) & 0x8000) != 0;
//            if (pressed && !lastAimLagKey) {
//                FakeLagToggleAimLag();
//                Beep(fake_lag_aim_lag_active ? 800 : 400, 100);
//            }
//            lastAimLagKey = pressed;
//        }
//
//        
//        if (fake_lag_aim_lag_active) {
//            bool lmb = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
//            if (lmb != lastLMB) {
//                
//                FakeLagSetFreeze(lmb);
//            }
//            lastLMB = lmb;
//        }
//        else {
//            
//            lastLMB = false;
//        }
//
//        Sleep(1);
//    }
//}