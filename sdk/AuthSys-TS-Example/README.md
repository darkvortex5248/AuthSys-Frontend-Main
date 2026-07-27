# AuthSys TypeScript SDK

Professional authentication SDK for TypeScript/Node.js applications.

## Installation

```bash
npm install authsys
# or
npm install axios
npm install -D typescript @types/node
```

Add `authsys.ts` and `helpers.ts` to your project.

## Quick Start

```typescript
import { AuthSys, AuthSysOptions } from './authsys';

const auth = new AuthSys({
    appSecret: 'YOUR_APP_SECRET',
    appName: 'MyApplication',
    version: '1.0.0'
});

// Initialize
await auth.init();

// Register
await auth.register('username', 'password', 'LICENSE_KEY');

// Login
await auth.login('username', 'password');

// Verify session
await auth.verify();

// License login
await auth.licenseLogin('LICENSE_KEY');

// License check
await auth.licenseCheck('LICENSE_KEY');

// Send chat message
await auth.sendChatMessage(1, 'Hello World!');

// Device registration
await auth.registerDevice('HWID123', 'My Device');

// Logout
auth.logout();
```

## API Reference

### Options
- `appSecret` - Your application secret
- `appName` - Application name
- `version` - Application version
- `apiUrl` - API endpoint (default: `https://api.authsys.dpdns.org/api/v1`)
- `timeout` - Request timeout in milliseconds
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
- `startHeartbeat(intervalMs)` - Start automatic session verification

### Properties
- `isAuthenticated` - Whether a valid session exists
- `isInitialized` - Whether the SDK is initialized
- `username` - Current username

## Examples

- **Console**: `example/main.ts`

## License

MIT License
