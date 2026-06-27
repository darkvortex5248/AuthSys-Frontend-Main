# AuthSys C# SDK

## Supported Architectures
- **x86 (32-bit)** ✅
- **x64 (64-bit)** ✅
- **AnyCPU** ✅

## Installation
Add reference to `System.Management` and `System.Net.Http`.

## Usage (Console)
```csharp
using AuthSys;

var auth = new api("AppName", "owner_id", "app_secret", "1.0.0");
auth.init();

if (!auth.initialized)
{
    Console.WriteLine($"Init failed: {auth.lastError}");
    return;
}

auth.login("username", "password");
if (!string.IsNullOrEmpty(auth.sessionToken))
{
    Console.WriteLine("Welcome!");
}
else
{
    Console.WriteLine($"Login failed: {auth.lastError}");
}
```

## Usage (WinForms)
```csharp
AuthSysApp.init();
AuthSysApp.login(txtUsername.Text, txtPassword.Text);
MessageBox.Show(AuthSysApp.lastError, "Result");
```

## Methods
- `init()`
- `login(username, password, sessionLength=86400)`
- `register(username, password, license_key, email="")`
- `licenseLogin(key, sessionLength=86400)`
- `licenseCheck(key)`
- `verify()`
- `chatSend(roomId, message)`
- `var(name)`
- `logout()`

## Error Handling
```csharp
if (!string.IsNullOrEmpty(auth.lastError))
    Console.WriteLine($"Error: {auth.lastError}");
```
