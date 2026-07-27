# AuthSys C# SDK

Professional authentication SDK for .NET applications.

## Installation

Add `AuthSys.cs` to your project, or reference the NuGet package.

## Quick Start

```csharp
using AuthSys;

var options = new AuthSysOptions
{
    AppSecret = "YOUR_APP_SECRET",
    AppName = "MyApplication",
    Version = "1.0.0"
};

var auth = new AuthSys.AuthSys(options);

// Initialize
var init = await auth.InitAsync();

// Register
var reg = await auth.RegisterAsync("username", "password", "LICENSE_KEY");

// Login
var login = await auth.LoginAsync("username", "password");

// Verify session
var verify = await auth.VerifyAsync();

// License login
var licenseLogin = await auth.LicenseLoginAsync("LICENSE_KEY");

// License check
var licenseCheck = await auth.LicenseCheckAsync("LICENSE_KEY");

// Send chat message
var chat = await auth.SendChatMessageAsync(1, "Hello World!");

// Device registration
var device = await auth.RegisterDeviceAsync("HWID123", "My Device");

// Logout
auth.Logout();
```

## API Reference

### AuthSysOptions
- `AppSecret` - Your application secret
- `AppName` - Application name
- `Version` - Application version
- `ApiUrl` - API endpoint (default: `https://api.authsys.dpdns.org/api/v1`)
- `TimeoutSeconds` - Request timeout
- `MaxRetries` - Maximum retry attempts
- `SkipCertificateValidation` - Skip SSL certificate validation
- `EnableLogging` - Enable debug logging

### Methods
- `InitAsync()` - Initialize the SDK
- `RegisterAsync(username, password, licenseKey, email)` - Register a new user
- `LoginAsync(username, password, sessionLength)` - Login with credentials
- `LicenseLoginAsync(licenseKey, sessionLength)` - Login with license key only
- `LicenseCheckAsync(licenseKey)` - Check license validity
- `VerifyAsync()` - Verify current session
- `SendChatMessageAsync(roomId, message)` - Send a chat message
- `RegisterDeviceAsync(hwid, deviceName)` - Register a device
- `CheckDeviceAsync(hwid)` - Check device status
- `GetVariable(key)` - Get an application variable
- `GetAllVariables()` - Get all application variables
- `Logout()` - Clear session

### Properties
- `IsAuthenticated` - Whether a valid session exists
- `IsInitialized` - Whether the SDK is initialized

## Examples

- **Console**: `Example.Console/Program.cs`
- **WinForms**: `Example.WinForms/`

## License

MIT License
