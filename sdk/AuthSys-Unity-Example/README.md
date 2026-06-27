# AuthSys Unity Example

## Requirements
- Unity 2020.3+
- `Newtonsoft.Json` or use built-in `JSONObject`

## Setup
1. Copy `AuthSys.cs` into `Assets/Scripts/`
2. Add `AuthSysLogin.cs` to a Canvas GameObject
3. Assign UI elements in the Inspector

## Usage (Script)
```csharp
var auth = new AuthSysClient("your_app_secret", "1.0.0");
StartCoroutine(auth.LoginAsync("user", "pass", (success) => {
    if (success) Debug.Log("Welcome!");
    else Debug.LogError(auth.LastError);
}));
```

## Methods (all return IEnumerator)
- `InitAsync(appName, callback)`
- `LoginAsync(username, password, callback, sessionLength?)`
- `RegisterAsync(username, password, licenseKey, callback, email?)`
- `LicenseLoginAsync(licenseKey, callback, sessionLength?)`
- `LicenseCheckAsync(licenseKey, callback)`
- `VerifyAsync(callback)`
- `ChatSendAsync(roomId, message, callback)`
- `Var(name)`
- `Logout()`
