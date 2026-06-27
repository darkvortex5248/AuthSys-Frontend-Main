# AuthSys Go Example

## Requirements
- Go 1.21+

## Build & Run
```bash
go run .
```

## Files
- `authsys.go` — SDK implementation
- `main.go` — CLI example

## Methods
- `Init(appName)`
- `Login(username, password, sessionLength?)`
- `Register(username, password, licenseKey, email?)`
- `LicenseLogin(licenseKey, sessionLength?)`
- `LicenseCheck(licenseKey)`
- `Verify()`
- `ChatSend(roomId, message)`
- `Var(name)`
- `Logout()`

## Properties
- `SessionToken string`
- `LastError string`
- `Initialized bool`
