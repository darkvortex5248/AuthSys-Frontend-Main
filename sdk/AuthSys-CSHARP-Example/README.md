# AuthSys C# SDK

Modern, production-ready C# SDK for the AuthSys authentication platform.

## Installation

```xml
<PackageReference Include="AuthSys.SDK" Version="2.0.0" />
```

Or install via CLI:

```bash
dotnet add package AuthSys.SDK
```

## Quick Start

```csharp
using AuthSys;
using AuthSys.Utilities;

var client = new AuthSysClient(new AuthSysOptions
{
    Name = "MyApplication",
    Secret = "your-app-secret",
    Version = "1.0.0",
    ApiUrl = "https://api.authsys.dpdns.org/api/v1",
    Logger = new ConsoleLogger()
});

// Initialize
await client.InitAsync();

// Login
var auth = await client.LoginAsync("username", "password");

// Verify session
var valid = await client.VerifyAsync();

// Get variables
var theme = client.GetVariable("theme");

// Logout
await client.LogoutAsync();
```

## Features

- ✅ Full async/await support
- ✅ Automatic retry with exponential backoff
- ✅ Platform-specific HWID (Windows, Linux, macOS)
- ✅ Token management with automatic expiry
- ✅ Session expiry detection
- ✅ Version mismatch detection
- ✅ Comprehensive exception hierarchy
- ✅ Optional debug logging
- ✅ Strong typing for all responses
- ✅ Certificate validation support

## API Reference

### Authentication

| Method | Description |
|--------|-------------|
| `InitAsync()` | Initialize the client with app credentials |
| `LoginAsync(username, password)` | Login with username/password |
| `LicenseLoginAsync(licenseKey)` | Login with a license key |
| `RegisterAsync(username, password, licenseKey, email)` | Register a new user |
| `VerifyAsync()` | Verify the current session |
| `LogoutAsync()` | Logout and clear session |

### Device Management

| Method | Description |
|--------|-------------|
| `RegisterDeviceAsync(name, type)` | Register a new device |
| `CheckDeviceAsync()` | Check device status |

### Variables

| Method | Description |
|--------|-------------|
| `GetVariable(key)` | Get a string variable |
| `GetVariable<T>(key)` | Get a typed variable |

### License

| Method | Description |
|--------|-------------|
| `LicenseCheckAsync(key)` | Check license validity |

### Chat

| Method | Description |
|--------|-------------|
| `SendChatMessageAsync(roomId, message)` | Send a message to a chat room |

## Exception Hierarchy

```
AuthSysException
├── AuthenticationException
├── LicenseException
├── RateLimitException
├── NetworkException
├── ValidationException
├── SessionExpiredException
├── HWIDException
├── VersionMismatchException
├── CloudflareException
├── MaintenanceException
├── TwoFactorRequiredException
└── ApiException
```

## Events

```csharp
client.SessionExpired += (s, e) => {
    // Handle session expiry
};

client.VersionUpdate += (s, e) => {
    // Handle version update notification
    // e.IsRequired - true if forced update
    // e.RequiredVersion - the required version
};
```

## Configuration

```csharp
var options = new AuthSysOptions
{
    Name = "MyApp",
    Secret = "app-secret",
    Version = "1.0.0",
    ApiUrl = "https://api.authsys.dpdns.org/api/v1",
    TimeoutSeconds = 30,
    RetryAttempts = 3,
    RetryDelayMs = 1000,
    DebugMode = false,
    SkipCertificateValidation = false,
    HWIDMode = HWIDMode.Auto,
    Logger = new ConsoleLogger()
};
```

## Migration from v1

### Breaking Changes

1. **Class renamed**: `api` → `AuthSysClient`
2. **Async methods**: All methods now return `Task<T>`
3. **API URL**: Default changed to `https://api.authsys.dpdns.org/api/v1`
4. **Exceptions**: Now throws typed exceptions instead of setting `lastError`
5. **HWID**: Now uses SHA-256 hashing by default

### Backward Compatibility

For simple cases, you can create a wrapper:

```csharp
public class LegacyAuthSys
{
    private readonly AuthSysClient _client;
    
    public LegacyAuthSys(string name, string secret, string version)
    {
        _client = new AuthSysClient(new AuthSysOptions
        {
            Name = name,
            Secret = secret,
            Version = version
        });
    }
    
    public void init() => _client.InitAsync().Wait();
    public void login(string username, string password) => _client.LoginAsync(username, password).Wait();
    // etc.
}
```

## License

MIT License
