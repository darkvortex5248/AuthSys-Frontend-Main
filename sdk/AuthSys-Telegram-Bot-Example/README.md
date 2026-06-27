# AuthSys Telegram Bot Example

A fully-featured Telegram bot for managing your RinoxAuth authentication system. Runs **client-side** on your own machine — communicates with the Seller API via your seller key.

**TypeScript · grammY · Bun runtime (recommended)**

## Features

- **License Management** — Generate, info, ban/unban, delete, list keys
- **Application Management** — View app details and stats
- **Seller Key Management** — Add/switch seller keys at runtime via `/setseller`
- **Persistent Storage** — SQLite-based storage for seller keys and app IDs
- **Endpoint Mapping** — Old KeyAuth-style command names auto-map to RinoxAuth Seller API endpoints

## Prerequisites

- [Bun](https://bun.sh) runtime (recommended) or Node.js with TypeScript
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- A **Seller Key** from your RinoxAuth dashboard (Sellers section)

## Setup

```bash
# 1. Install dependencies
bun i
# or: npm install

# 2. Create .env file with your bot token:
#    TELEGRAM_API_KEY=1234567890:ABCdefGHIjklmNOPqrstUVwxyz

# 3. Start the bot
bun run .
# or: npm start
```

## Adding Your Seller Key

After starting the bot, send `/setseller` in Telegram and follow the prompts to enter your seller key and app ID. You can switch between multiple saved applications at any time.

## Available Commands

| Command | Description |
|---|---|
| `/start` | Welcome message and usage info |
| `/create <type> <expiry>` | Generate a new license key |
| `/getinfo <key>` | Get detailed key information |
| `/delkey <key>` | Delete a license key |
| `/bankey <key>` | Ban/pause a license key |
| `/unbankey <key>` | Unban/resume a license key |
| `/getkeys` | List recent license keys |
| `/appdetails` | View current application details |
| `/stats` | View application statistics |
| `/setseller <key>` | Add or switch seller key |

## Architecture

```
Telegram ──► Your Bot (client-side) ──► Seller API (backend)
                    │                           │
              seller-key header           /api/v1/developer/sellers/*
```

The bot does **not** run on RinoxAuth servers. All operations use the Seller API with your seller key for authentication. Seller keys and app IDs are stored locally in SQLite.

## License

MIT
