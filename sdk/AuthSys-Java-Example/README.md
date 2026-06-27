# AuthSys Java SDK

## Requirements
- Java 8+

## Usage
```java
AuthSys auth = new AuthSys("AppName", "owner_id", "app_secret", "1.0.0");
auth.init();

if (!auth.initialized) {
    System.out.println("Init failed: " + auth.lastError);
    return;
}

auth.login("username", "password");
if (auth.sessionToken != null) {
    System.out.println("Welcome!");
} else {
    System.out.println("Login failed: " + auth.lastError);
}
```

## Methods
- `init()`
- `login(username, password)`
- `login(username, password, sessionLength)`
- `register(username, password, licenseKey)`
- `register(username, password, licenseKey, email)`
- `licenseLogin(licenseKey)`
- `licenseLogin(licenseKey, sessionLength)`
- `licenseCheck(licenseKey)`
- `verify()`
- `chatSend(roomId, message)`
- `logout()`

## Error Handling
```java
if (!auth.lastError.isEmpty()) {
    System.out.println("Error: " + auth.lastError);
}
```
