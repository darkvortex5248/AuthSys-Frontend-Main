# AuthSys WPF Example (C# WPF)

## Setup
1. Add NuGet: `System.Management`
2. Copy `AuthSys.cs` into your WPF project
3. Use in `MainWindow.xaml.cs`

## Usage
```csharp
var auth = new AuthSysClient("your_app_secret", "1.0.0");
await auth.LoginAsync("username", "password");
if (auth.SessionToken != null)
    MessageBox.Show($"Welcome {auth.Username}!");
else
    MessageBox.Show(auth.LastError);
```

## Methods
- `InitAsync(appName)`
- `LoginAsync(username, password, sessionLength?)`
- `RegisterAsync(username, password, licenseKey, email?)`
- `LicenseLoginAsync(licenseKey, sessionLength?)`
- `LicenseCheckAsync(licenseKey)`
- `VerifyAsync()`
- `ChatSendAsync(roomId, message)`
- `Var(name)`
- `Logout()`
