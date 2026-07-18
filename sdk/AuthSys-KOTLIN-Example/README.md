# AuthSys Kotlin SDK

## Requirements
- Kotlin 1.5+ (JVM or Android)
- `org.json:json` dependency

## Usage
```kotlin
val auth = AuthSysClient("your_secret", "1.0.0")

auth.initApp("MyApp")
if (!auth.initialized) {
    println("Init failed: " + auth.lastError)
    return
}

auth.login("user", "pass")
if (auth.sessionToken.isNotEmpty()) {
    println("Welcome!")
} else {
    println("Login failed: " + auth.lastError)
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
- `initialized: Boolean`
