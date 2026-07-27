# AuthSys PHP SDK

Professional authentication SDK for PHP applications.

## Installation

Add `AuthSys.php` and `Helpers.php` to your project.

## Quick Start

```php
require_once 'AuthSys.php';
require_once 'Helpers.php';

$auth = new AuthSys('YOUR_APP_SECRET', [
    'appName' => 'MyApplication',
    'version' => '1.0.0'
]);

// Initialize
$auth->init();

// Register
$auth->register('username', 'password', 'LICENSE_KEY');

// Login
$auth->login('username', 'password');

// Verify session
$auth->verify();

// License login
$auth->licenseLogin('LICENSE_KEY');

// License check
$auth->licenseCheck('LICENSE_KEY');

// Send chat message
$auth->sendChatMessage(1, 'Hello World!');

// Device registration
$auth->registerDevice('HWID123', 'My Device');

// Logout
$auth->logout();
```

## API Reference

### Options
- `appSecret` - Your application secret
- `appName` - Application name
- `version` - Application version
- `apiUrl` - API endpoint (default: `https://api.authsys.dpdns.org/api/v1`)
- `timeout` - Request timeout in seconds
- `maxRetries` - Maximum retry attempts
- `skipCertificateValidation` - Skip SSL certificate validation
- `enableLogging` - Enable debug logging

### Methods
- `init()` - Initialize the SDK
- `register(username, password, licenseKey, email)` - Register a new user
- `login(username, password, sessionLength)` - Login with credentials
- `licenseLogin(licenseKey, sessionLength)` - Login with license key only
- `licenseCheck(licenseKey)` - Check license validity
- `verify()` - Verify current session
- `sendChatMessage(roomId, message)` - Send a chat message
- `registerDevice(hwid, deviceName)` - Register a device
- `checkDevice(hwid)` - Check device status
- `getVariable(key)` - Get an application variable
- `getAllVariables()` - Get all application variables
- `logout()` - Clear session

### Properties
- `isAuthenticated()` - Whether a valid session exists
- `isInitialized()` - Whether the SDK is initialized
- `getUsername()` - Current username

## Examples

- **Console**: `example/index.php`

## License

MIT License
