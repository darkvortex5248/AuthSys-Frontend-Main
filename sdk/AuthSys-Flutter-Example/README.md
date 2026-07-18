# AuthSys Flutter SDK

## Requirements
- Flutter 3.0+
- Dart 2.17+
- `http` package dependency

## pubspec.yaml
```yaml
dependencies:
  http: ^1.0.0
```

## Usage
```dart
final auth = AuthSysClient(
  appSecret: 'your_secret',
  version: '1.0.0',
);

await auth.init(appName: 'MyApp');
if (!auth.initialized) {
  print('Init failed: ${auth.lastError}');
  return;
}

await auth.login('user', 'pass');
if (auth.sessionToken != null) {
  print('Welcome!');
} else {
  print('Login failed: ${auth.lastError}');
}
```

## Methods
- `init({appName})`
- `login(username, password, {sessionLength})`
- `register(username, password, licenseKey, {email})`
- `licenseLogin(licenseKey, {sessionLength})`
- `licenseCheck(licenseKey)`
- `verify()`
- `chatSend(roomId, message)`
- `var(name)`
- `logout()`

## Properties
- `sessionToken: String?`
- `lastError: String`
- `initialized: bool`
