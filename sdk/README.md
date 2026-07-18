# AuthSys SDK

> **Authentication & License Management SDKs** — Integrate RinoxAuth into your application in any language. Manage licenses, users, sessions, and more via the AuthSys backend API.

---

## Bot SDKs — Chat Platform Management

| SDK | Platform | Stack | Commands |
|-----|----------|-------|----------|
| [**AuthSys-Discord-Bot-Example**](./AuthSys-Discord-Bot-Example/) | Discord | Node.js 20+ · discord.js v14 · SQLite | 88+ commands — licenses, users, blacklist, variables, webhooks, sessions, chats, whitelist, files, settings, analytics |
| [**AuthSys-Telegram-Bot-Example**](./AuthSys-Telegram-Bot-Example/) | Telegram | TypeScript · grammY · Bun (sqlite) | 9 commands — create, getinfo, delkey, bankey, unbankey, getkeys, appdetails, stats, setseller |

Both bots run **client-side** on your own infrastructure and communicate with the Seller API using your seller key.

---

## Language SDKs — Application Integration

| # | SDK | Language | Structure |
|---|-----|----------|-----------|
| 1 | [AuthSys-CPP-Example](./AuthSys-CPP-Example/) | C++ | `x64/` + `x86/` |
| 2 | [AuthSys-CSHARP-Example](./AuthSys-CSHARP-Example/) | C# | `Console/` + `Form/` |
| 3 | [AuthSys-WPF-Example](./AuthSys-WPF-Example/) | C# WPF | `src/` |
| 4 | [AuthSys-Unity-Example](./AuthSys-Unity-Example/) | C# Unity | `src/` |
| 5 | [AuthSys-VB-Example](./AuthSys-VB-Example/) | VB.NET | `src/` |
| 6 | [AuthSys-Python-Example](./AuthSys-Python-Example/) | Python | `src/` |
| 7 | [AuthSys-Java-Example](./AuthSys-Java-Example/) | Java | `src/` |
| 8 | [AuthSys-JS-Example](./AuthSys-JS-Example/) | JavaScript | `src/` |
| 9 | [AuthSys-TS-Example](./AuthSys-TS-Example/) | TypeScript | `src/` |
| 10 | [AuthSys-React-Example](./AuthSys-React-Example/) | React | `src/` |
| 11 | [AuthSys-Vue-Example](./AuthSys-Vue-Example/) | Vue 3 | `src/` |
| 12 | [AuthSys-PHP-Example](./AuthSys-PHP-Example/) | PHP | `src/` |
| 13 | [AuthSys-Rust-Example](./AuthSys-Rust-Example/) | Rust | `src/` |
| 14 | [AuthSys-Go-Example](./AuthSys-Go-Example/) | Go | `src/` |
| 15 | [AuthSys-Lua-Examples](./AuthSys-Lua-Examples/) | Lua | `src/` |
| 16 | [AuthSys-Ruby-Example](./AuthSys-Ruby-Example/) | Ruby | `src/` |
| 17 | [AuthSys-Perl-Example](./AuthSys-Perl-Example/) | Perl | `src/` |

---

## Directory Structure

```
sdk/
├── AuthSys-Discord-Bot-Example/    # Discord bot (client-side)
├── AuthSys-Telegram-Bot-Example/   # Telegram bot (client-side)
├── AuthSys-CPP-Example/            # C++ client SDK
├── AuthSys-CSHARP-Example/         # C# client SDK
├── AuthSys-Python-Example/         # Python client SDK
├── ...                             # 15+ language SDKs
└── README.md                       # This file
```

Each SDK follows this common pattern:

```
AuthSys-{NAME}/
├── LICENSE          ← MIT (Rinox Deadmoor)
├── README.md        ← Documentation & setup guide
└── src/             ← Source code
    └── (or x64/x86, Console/Form depending on language)
```

---

## Common Features

All language SDKs support these backend endpoints:

| Endpoint | Description |
|----------|-------------|
| `init` | Initialize app session with credentials |
| `login` | Username/password authentication |
| `register` | Create a new user account |
| `license_login` | Login using a license key only |
| `license/check` | Validate a license key |
| `verify` | Verify an active session token |
| `chat/send` | Send a message via chat channel |
| `chat/fetch` | Retrieve chat messages |
| `var/get` | Get an application variable |
| `var/set` | Set an application variable |
| `log` | Send a log event |
| `hwid` | Get or verify HWID |
| `file/*` | Upload, download, and manage files |

---

## Error Handling

Every SDK uses consistent error handling with `last_error` + `last_response` properties:

```csharp
if (!string.IsNullOrEmpty(auth.LastError))
    Console.WriteLine($"Error: {auth.LastError}");
```

```python
if auth.last_error:
    print(f"Error: {auth.last_error}")
```

---

## Backend API

**Default API URL:** `https://authsys-main-production.up.railway.app/api/v1`

All SDKs communicate with the AuthSys backend for authentication, license validation, session management, and more.

---

## Getting Started

1. **Choose your platform** — Pick a Bot SDK (Discord/Telegram) for server management, or a Language SDK for application integration
2. **Configure credentials** — Each SDK requires API credentials from your RinoxAuth dashboard
3. **Integrate** — Follow the SDK's README for setup and usage examples

---

## License

MIT — feel free to use, modify, and distribute. See individual SDK folders for license details.
