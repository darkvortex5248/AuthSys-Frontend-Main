# AuthSys Go SDK

Professional authentication SDK for Go applications.

## Installation

```bash
go mod init your-project
go get authsys
```

Add `authsys.go` and `helper.go` to your project.

## Quick Start

```go
import "authsys"

opts := &authsys.Options{
    AppSecret: "YOUR_APP_SECRET",
    AppName:   "MyApplication",
    Version:   "1.0.0",
}

client := authsys.NewAuthSysWithOptions(opts)

// Initialize
client.Init()

// Register
client.Register("username", "password", "LICENSE_KEY", "")

// Login
client.Login("username", "password", 86400)

// Verify session
client.Verify()

// License login
client.LicenseLogin("LICENSE_KEY", 86400)

// License check
client.LicenseCheck("LICENSE_KEY")

// Send chat message
client.SendChatMessage(1, "Hello World!")

// Device registration
client.RegisterDevice("HWID123", "My Device")

// Logout
client.Logout()
```

## API Reference

### Options
- `AppSecret` - Your application secret
- `AppName` - Application name
- `Version` - Application version
- `ApiUrl` - API endpoint (default: `https://api.authsys.dpdns.org/api/v1`)
- `Timeout` - Request timeout in seconds
- `MaxRetries` - Maximum retry attempts
- `SkipCertificateValidation` - Skip SSL certificate validation
- `EnableLogging` - Enable debug logging

### Methods
- `Init()` - Initialize the SDK
- `Register(username, password, licenseKey, email)` - Register a new user
- `Login(username, password, sessionLength)` - Login with credentials
- `LicenseLogin(licenseKey, sessionLength)` - Login with license key only
- `LicenseCheck(licenseKey)` - Check license validity
- `Verify()` - Verify current session
- `SendChatMessage(roomId, message)` - Send a chat message
- `RegisterDevice(hwid, deviceName)` - Register a device
- `CheckDevice(hwid)` - Check device status
- `GetVariable(key)` - Get an application variable
- `GetAllVariables()` - Get all application variables
- `Logout()` - Clear session

### Properties
- `IsAuthenticated()` - Whether a valid session exists
- `IsInitialized()` - Whether the SDK is initialized
- `GetUsername()` - Current username

## Examples

- **Console**: `example/main.go`

## License

MIT License
