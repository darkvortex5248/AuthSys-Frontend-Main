# AuthSys Node.js SDK

This is the official JavaScript/Node.js SDK for RinoxAuth (AuthSys).

## Installation

```bash
npm install axios
```

## Usage

```javascript
const AuthSys = require('./index');

async function run() {
    const auth = new AuthSys("YourAppName", "YourOwnerID", "YourAppSecret", "1.0", "https://api.yourdomain.com");
    await auth.init();

    if (await auth.login("username", "password")) {
        console.log("Logged in!");
    }
}

run();
```
