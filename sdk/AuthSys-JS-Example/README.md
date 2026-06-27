# AuthSys JavaScript SDK

## Installation (Node.js)
```bash
npm install axios
```

## Usage (Node.js)
```javascript
const AuthSys = require('./index');

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
main();
```

## Browser Usage (ES Module)
```javascript
import AuthSys from './authsys.js';
const auth = new AuthSys("app_secret", "owner_id", "1.0.0");
```

## API
- `init()`
- `login(username, password, sessionLength?)`
- `register(username, password, licenseKey, email?)`
- `licenseLogin(licenseKey, sessionLength?)`
- `licenseCheck(licenseKey)`
- `verify()`
- `chatSend(roomId, message)`
- `var(name)`
- `logout()`
- `startHeartbeat(intervalMs?)`

## Error Handling
```javascript
if (auth.lastError) console.log("Error:", auth.lastError);
console.log("Raw response:", auth.lastResponse);
```
