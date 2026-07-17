# AuthSys Device Activation SDK

A **standalone** Device Activation system for apps that want a **no-login kill-switch**.  
No user authentication required — just `app_secret` + HWID.

## Architecture

- The EXE calls `device/check` on startup (with `app_secret` + HWID)  
- Server auto-creates a device record if it doesn't exist  
- Developer toggles Active/Inactive from the Dashboard → next check fails  
- If inactive, the EXE receives `{"active": false}` and should exit

> **No duplicate data.** Device-only users are stored in the `end_users` table with `is_device_only=true`. No separate `device_activations` table.

## API Reference

### `POST /device/check`

```json
{"app_secret": "...", "hwid": "..."}
```

Response:
```json
{"active": true, "message": "Device active"}
{"active": false, "message": "Device deactivated by admin"}
```

Auto-creates a device record if it doesn't already exist.

### `POST /device/register`

```json
{"app_secret": "...", "hwid": "...", "device_name": "PC-1"}
```

Optional `device_name`. Returns `{"active": true, "device_id": 1}`.  
Enforces `max_devices` limit from the developer's subscription plan (Free=3, Developer=10, Seller=50, Enterprise=unlimited).

## Quick Start — C++

```cpp
#include "AuthSys-Device.hpp"

AuthSysDevice::Device device("YOUR_APP_SECRET");

if (!device.check()) {
    // Device is deactivated — exit immediately
    printf("Device blocked: %s\n", device.getLastError().c_str());
    return 1;
}
// Device is active — proceed with app logic
```

## Quick Start — C#

```csharp
using AuthSysDevice;

var device = new Device("YOUR_APP_SECRET");
if (!device.Check())
{
    Console.WriteLine("Device blocked: " + device.LastError);
    return;
}
```

## Quick Start — Python

```python
from AuthSys_Device import Device

device = Device("YOUR_APP_SECRET")
if not device.check():
    print(f"Device blocked: {device.last_error}")
    exit(1)
```

## Quick Start — JavaScript (Node.js)

```js
const { Device } = require("./AuthSys-Device");

const device = new Device("YOUR_APP_SECRET");
if (!(await device.check())) {
    console.log("Device blocked:", device.lastError);
    process.exit(1);
}
```

## Plan Limits

| Plan | Max Devices |
|------|-------------|
| Free | 3 |
| Developer | 10 |
| Seller | 50 |
| Enterprise | Unlimited |

The endpoint returns `403` if the device limit is exceeded.

## Files

| Language | File |
|----------|------|
| C++ | `cpp/AuthSys-Device.hpp` |
| C# / .NET | `csharp/AuthSys-Device.cs` |
| Python | `python/AuthSys-Device.py` |
| JavaScript | `javascript/AuthSys-Device.js` |
| TypeScript | `typescript/AuthSys-Device.ts` |
| React | `react/AuthSys-Device.jsx` |
| Vue | `vue/AuthSys-Device.js` |
| Go | `go/AuthSys-Device.go` |
| Java | `java/AuthSys-Device.java` |
| Ruby | `ruby/AuthSys-Device.rb` |
| PHP | `php/AuthSys-Device.php` |
| Rust | `rust/AuthSys-Device.rs` |
| Perl | `perl/AuthSys-Device.pl` |
| Lua | `lua/AuthSys-Device.lua` |
| VB.NET | `vb/AuthSys-Device.vb` |
| Unity | `unity/AuthSys-Device.cs` |
| WPF | `wpf/AuthSys-Device.cs` |
