# AuthSys TypeScript SDK

## Installation
```bash
npm install axios
```

## Usage
```typescript
import { AuthSys } from './index';

const auth = new AuthSys("AppName", "owner_id", "app_secret", "1.0.0");

async function main() {
    await auth.init();
    if (!auth.initialized) {
        console.log("Init failed:", auth.lastError);
        return;
    }

    const res = await auth.login("username", "password");
    if (auth.sessionToken) {
        console.log("Welcome!");
    } else {
        console.log("Login failed:", auth.lastError);
    }
}
```

## API
- `init()` — Returns `AuthSysResponse`
- `login(username, password, sessionLength?)` — Returns `AuthSysResponse`
- `register(username, password, licenseKey, email?)` — Returns `AuthSysResponse`
- `licenseLogin(licenseKey, sessionLength?)` — Returns `AuthSysResponse`
- `licenseCheck(licenseKey)` — Returns `AuthSysResponse`
- `verify()` — Returns `AuthSysResponse`
- `chatSend(roomId, message)` — Returns `AuthSysResponse`
- `var(name)` — Returns `any`
- `logout()` — Clears session
- `startHeartbeat(intervalMs?)` — Auto session verify

## Error Handling
```typescript
if (auth.lastError) console.log("Error:", auth.lastError);
console.log("Raw response:", auth.lastResponse);
```
