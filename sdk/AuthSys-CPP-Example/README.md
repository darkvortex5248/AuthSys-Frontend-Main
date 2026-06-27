# AuthSys C++ SDK

## Architecture Support
- **x86 (32-bit)** — Build with Win32 platform target ✅
- **x64 (64-bit)** — Build with x64 platform target ✅
- **ARM64** — Build with ARM64 platform target ✅

No external libraries required. Uses only Windows SDK (WinINet, IP Helper API).

## Project Structure
```
AuthSys-CPP-Example/
├── LICENSE
├── README.md
├── x86/           ← Source for 32-bit builds
│   ├── AuthSys.hpp
│   ├── AuthSys.cpp
│   └── main.cpp
└── x64/           ← Source for 64-bit builds
    ├── AuthSys.hpp
    ├── AuthSys.cpp
    └── main.cpp
```

## Visual Studio Setup

### For x86 (32-bit):
1. Open **x86/AuthSys-x86.sln** (or create new project, add x86/*.cpp + *.hpp)
2. Set platform to **Win32** / **x86**
3. Build → **F7**

### For x64 (64-bit):
1. Open **x64/AuthSys-x64.sln** (or create new project, add x64/*.cpp + *.hpp)
2. Set platform to **x64**
3. Build → **F7**

## Usage
```cpp
#include "AuthSys.hpp"

AuthSys::api AuthSysApp("AppName", "owner_id", "app_secret", "1.0.0");
AuthSysApp.init();

if (!AuthSysApp.initialized) {
    MessageBoxA(NULL, AuthSysApp.last_error.c_str(), "Init Failed", MB_ICONERROR);
    return 1;
}

AuthSysApp.login("username", "password");
if (AuthSysApp.session_token.empty()) {
    MessageBoxA(NULL, AuthSysApp.last_error.c_str(), "Login Failed", MB_ICONERROR);
} else {
    MessageBoxA(NULL, "Welcome!", "Success", MB_OK);
}
```

## Methods
- `init()` — Initialize & fetch app variables
- `login(username, password, session_length=86400)`
- `register_user(username, password, license_key, email="")`
- `license(key, session_length=86400)` — License login
- `license_check(key)`
- `verify()` — Verify current session token
- `chat_send(room_id, message)`
- `var(name)` — Retrieve app variable
- `logout()` — Clear session

## Error Handling
```cpp
if (!AuthSysApp.last_error.empty()) {
    MessageBoxA(NULL, AuthSysApp.last_error.c_str(), "Error", MB_ICONERROR);
}
```

## Properties
- `session_token` / `sessionid` — Current session token
- `initialized` — Bool
- `user_data.username` / `user_data.email`
- `last_error` — Last error message (server's `detail` field)
- `last_response` — Raw server JSON response
- `app_data.variables` — Variables JSON string
