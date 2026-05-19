# AuthSys SDK

## C# (WinForms / WPF)

### Setup

1. Copy `sdk/csharp/AuthSys.cs` into your project.
2. Add NuGet: `System.Management` (for HWID on Windows).
3. Use credentials from **Dashboard → Applications → your app**:
   - **App Secret** = short key (use this in SDK)
   - **Owner ID** = long hash (reference only, NOT for login)

```csharp
var auth = new AuthSys(
    appSecret: "AFhX9W2AFsmj",  // Secret Key from dashboard
    version: "1.0.0",
    baseUrl: "https://authsys-vtdu.onrender.com/api/v1"
);

// License login OR username login (not both at once)
var result = await auth.LicenseLoginAsync("AUTHSYS-xxxx-xxxx");
// var result = await auth.LoginAsync("user", "pass");

if (result.TryGetProperty("success", out var ok) && ok.GetBoolean())
    MessageBox.Show("OK");
else if (result.TryGetProperty("message", out var msg))
    MessageBox.Show(msg.GetString());
```

### Common error: "Application not found or invalid secret"

- You used **Owner ID** instead of **App Secret** — swap them.
- App is **inactive** in dashboard — toggle to active.
- Wrong API URL — must end with `/api/v1` (SDK adds `/client/login` automatically).

## Python / JavaScript

See `sdk/python/authsys.py` and `sdk/javascript/authsys.js`.
