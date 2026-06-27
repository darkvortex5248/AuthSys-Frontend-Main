# AuthSys Lua Examples

## Requirements
- Lua 5.1+
- `curl` (used internally for HTTP)

## Usage
```bash
lua example.lua
```

## Files
- `authsys.lua` — SDK class
- `example.lua` — CLI demo

## Methods
- `init(appName?)`
- `login(username, password, sessionLength?)`
- `register(username, password, licenseKey, email?)`
- `license_login(licenseKey, sessionLength?)`
- `license_check(licenseKey)`
- `verify()`
- `chat_send(roomId, message)`
- `var(name)`
- `logout()`
