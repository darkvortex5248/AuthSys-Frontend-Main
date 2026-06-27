# AuthSys PHP Example

## Requirements
- PHP 7.4+
- `curl` extension

## Usage
```bash
php example.php
```

## Files
- `authsys.php` — SDK class
- `example.php` — CLI demo

## Methods
- `init(appName)`
- `login(username, password, sessionLength?)`
- `register(username, password, licenseKey, email?)`
- `licenseLogin(licenseKey, sessionLength?)`
- `licenseCheck(licenseKey)`
- `verify()`
- `chatSend(roomId, message)`
- `var(name)`
- `logout()`

## Error Handling
```php
if ($auth->lastError) echo "Error: " . $auth->lastError;
```
