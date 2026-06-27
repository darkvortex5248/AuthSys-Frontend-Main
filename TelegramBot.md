# AuthSys Telegram Bot Orchestration Guide

This guide details how to set up and manage your authentication infrastructure using the AuthSys Telegram Bot. The bot runs **client-side** on your own machine/VPS and communicates with the AuthSys Seller API.

## Architecture Overview

```
You (Telegram)
   |  /genkey, /createuser, /stats, etc.
   v
Your Bot (your PC / VPS)   ← runs on YOUR infrastructure
   |  POST /api/v1/developer/sellers/*  with seller-key header
   v
AuthSys API
   |
   v
Database
```

The bot does NOT run on AuthSys servers. You run it yourself.

---

## Setup Guide

### 1. Create Bot on Telegram
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts
3. Save the **API Token** you receive

### 2. Get a Seller Key
1. Go to your AuthSys Dashboard → Developer Settings
2. Create a Seller Account
3. Copy the `sk_...` key

### 3. Configure in AuthSys Dashboard
1. Go to **Telegram Bot** page in your dashboard
2. Paste your bot token
3. Save

### 4. Run the Bot
```bash
cd sdk/AuthSys-Telegram-Bot-Example
bun i                # install dependencies
# Edit .env file:
#   TOKEN=your_telegram_bot_token
#   API_URL=https://your-api.com/api/v1/developer/sellers
bun run .            # start the bot
```

### 5. Authorize
Send `/setseller` to your bot and select/create an application with your seller key.

---

## Available Commands

### Licenses
- `/create` — Generate a new license key
- `/getinfo` — Get key details (status, expiry, note)
- `/delkey` — Delete a license key
- `/bankey` — Ban/suspend a license key
- `/unbankey` — Reactivate a banned key
- `/getkeys` — Export all keys as JSON

### Users
- `/createuser` — Create a new end user
- `/userinfo` — View user profile (IP, HWID, subscription)
- `/ban` — Ban a user
- `/unban` — Unban a user
- `/extend` — Extend user subscription

### Applications
- `/setseller` — Select or add a seller key
- `/appdetails` — View app info (name, ID, secret)
- `/stats` — View app analytics

### Configuration
- `/addblacklist` — Add HWID/IP to blacklist
- `/addvar` — Add an app variable
- `/addwebhook` — Create a webhook
- `/addchannel` — Create a chat room

And many more — use `/` to see all available commands.

---

## BotFather Command Setup

Copy and paste this to [@BotFather](https://t.me/botfather) using `/setcommands`:

```text
create - Generate a new license
getinfo - Check key details
delkey - Delete a license
bankey - Ban a license
unbankey - Unban a license
getkeys - Export all keys
createuser - Create new user
userinfo - View user profile
ban - Ban a user
unban - Unban a user
extend - Extend subscription
stats - View app analytics
appdetails - View app info
setseller - Select seller key
```

---

## Security

- Your seller key is stored in the bot's local database
- Never share your bot token or seller key publicly
- The bot only responds to users who have linked a seller key via `/setseller`
