# AuthSys SDK Documentation

We provide official SDKs to easily integrate AuthSys into your software, plus ready-to-run bot examples.

---

## Client SDKs

### 1. Python SDK

**Installation:**
```bash
pip install -e sdks/python
```

**Usage Example:**
```python
from rinoxauth import RinoxAuth, AuthException

auth = RinoxAuth(
    app_name="TestApp",
    app_secret="APP_SECRET_HERE",
    api_url="http://localhost:8000/api/v1"
)

try:
    auth.init("1.0")
    print("Init successful. Global Vars:", auth.get_variables())

    auth.login("testuser", "password123")
    print("Logged in!")

except AuthException as e:
    print(f"Error: {e}")
```

### 2. C# SDK (.NET)

**Usage Example:**
```csharp
using RinoxAuthSDK;
using System;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var auth = new RinoxAuth("TestApp", "APP_SECRET_HERE", "http://localhost:8000/api/v1");
        try {
            await auth.Init("1.0");
            await auth.Login("testuser", "password123");
            Console.WriteLine("Login successful!");
        } catch(Exception e) {
            Console.WriteLine("Error: " + e.Message);
        }
    }
}
```

### 3. Node.js / Browser (JS)

**Usage Example:**
```javascript
const RinoxAuth = require('rinoxauth');

const auth = new RinoxAuth('TestApp', 'APP_SECRET', 'http://localhost:8000/api/v1');

auth.init('1.0').then(() => {
  return auth.login('testuser', 'password123');
}).then(res => {
  console.log("Logged in:", res);
}).catch(console.error);
```

### 4. C++ SDK (libcurl required)

Header-only `rinoxauth.hpp`. See file for method stubs.

---

## Bot SDKs

AuthSys provides ready-to-run bot examples in the `sdk/` directory. These bots run **client-side** on your own machine or server and communicate with the AuthSys Seller API.

### Architecture

```
User (Discord/Telegram)
     |  /genkey, /add-user, /stats, etc.
     v
Your Bot (your PC / VPS)   ← runs independently, NOT on AuthSys servers
     |  POST /api/v1/developer/sellers/*  with seller-key header
     v
AuthSys Backend
     |
     v
Database (PostgreSQL)
```

### Discord Bot

**Location:** `sdk/AuthSys-Discord-Bot-Example/`

A Discord.js v14 bot with 50+ slash commands for managing licenses, users, blacklists, variables, sessions, webhooks, chat channels, and more.

**Quick Start:**
```bash
cd sdk/AuthSys-Discord-Bot-Example
npm install
# Edit .env with your bot token and seller key
node .
```

**Setup Steps:**
1. Create a Discord Application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Copy the Bot Token, Application ID, and Public Key
3. Paste these in your AuthSys Dashboard → Discord Bot page
4. Also configure the Interactions Endpoint URL in Discord Developer Portal
5. Run the bot on your machine

**Available Commands:**
- `/genkey`, `/keyinfo`, `/ban-key`, `/unban-key`, `/delete-key` — License management
- `/add-user`, `/user-info`, `/ban-user`, `/unban-user`, `/extend-user` — User management
- `/add-blacklist`, `/add-variable`, `/create-webhook`, `/add-channel` — App configuration
- `/stats`, `/app-details` — Analytics
- And 40+ more commands across all categories

### Telegram Bot

**Location:** `sdk/AuthSys-Telegram-Bot-Example/`

A TypeScript Telegram bot using the Grammy framework, with 80+ commands and interactive button menus.

**Quick Start:**
```bash
cd sdk/AuthSys-Telegram-Bot-Example
bun i
# Edit .env with your bot token and seller key
bun run .
```

**Setup Steps:**
1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Copy the API Token
3. Paste in your AuthSys Dashboard → Telegram Bot page
4. Run the bot on your machine
5. Use `/setseller` to link your seller key

**Available Commands:**
- `/create`, `/getinfo`, `/delkey`, `/bankey`, `/unbankey`, `/getkeys` — License management
- `/createuser`, `/userinfo`, `/ban`, `/unban`, `/extend` — User management
- `/addblacklist`, `/addvar`, `/addwebhook` — App configuration
- `/stats`, `/appdetails` — Analytics
- And 40+ more commands

### Seller API

Both bots use the AuthSys Seller API. Your seller key (`sk_...`) authenticates all requests. Create a seller account in your AuthSys Dashboard → Developer Settings → Seller Accounts.
