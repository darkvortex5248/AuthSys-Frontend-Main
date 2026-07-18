# AuthSys Swift SDK

## Requirements
- Swift 5.5+ (async/await)
- macOS, iOS, or Linux

## Usage
```swift
let auth = AuthSysClient(appSecret: "your_secret", version: "1.0.0")

await auth.initApp(appName: "MyApp")
if !auth.initialized {
    print("Init failed:", auth.lastError)
    return
}

await auth.login(username: "user", password: "pass")
if !auth.sessionToken.isEmpty {
    print("Welcome!")
} else {
    print("Login failed:", auth.lastError)
}
```

## Methods
- `initApp(appName)`
- `login(username, password, sessionLength?)`
- `register(username, password, licenseKey, email?)`
- `licenseLogin(licenseKey, sessionLength?)`
- `licenseCheck(licenseKey)`
- `verify()`
- `chatSend(roomId, message)`
- `var(name)`
- `logout()`

## Properties
- `sessionToken: String`
- `lastError: String`
- `initialized: Bool`
