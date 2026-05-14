# ✈️ AuthSys Telegram Bot Orchestration Guide

This guide details how to set up and manage your authentication infrastructure using the AuthSys Telegram Bot.

## 🚀 Initial Configuration

1.  **Create Bot with BotFather**:
    *   Open Telegram and search for [@BotFather](https://t.me/botfather).
    *   Send `/newbot` and follow the instructions to get your **Bot API Token**.
2.  **Configure Bot Settings**:
    *   Send `/setprivacy` to BotFather and disable it (if you want the bot to read commands in groups).
    *   Send `/setcommands` to define the command list for better UI (see command list below).
3.  **Link to AuthSys**:
    *   Go to your AuthSys Dashboard -> **Telegram Bot** section.
    *   Paste your **Bot Token**.
    *   AuthSys will automatically set up the Webhook for your bot.

---

## 🎮 Command Reference

Telegram commands start with `/` and support inline arguments.

### 📱 Application Infrastructure
*   `/apps` - List all your applications and their current status.
*   `/appinfo [id]` - Detailed security and metrics overview for an app.
*   `/appcreate [name] [version]` - Deploy a new app from your phone.
*   `/appdelete [id]` - Remove an application (requires confirmation code).
*   `/maintenance [id] [on|off]` - Toggle maintenance mode for an app.

### 🔑 License Operations
*   `/genkey [app_id] [type] [days]` - Generate a new security key.
    *   *Example*: `/genkey 1 time 30`
*   `/keyinfo [key]` - Check a key's validity, bind status, and expiry.
*   `/pausekey [key]` - Instantly suspend a key.
*   `/resumekey [key]` - Lift suspension from a key.
*   `/delkey [key]` - Permanently delete a license key.

### 👥 User Control
*   `/userinfo [app_id] [username]` - Check user IP, HWID, and subscription data.
*   `/banuser [app_id] [username] [reason]` - Ban a user across all endpoints.
*   `/unbanuser [app_id] [username]` - Restore user access.
*   `/hwidreset [app_id] [username]` - Reset the hardware binding for a specific user.

---

## 🛠️ BotFather Command Setup

Copy and paste this list to [@BotFather](https://t.me/botfather) using the `/setcommands` command to enable the autocomplete menu:

```text
apps - List all applications
appinfo - Get detailed app status
appcreate - Deploy a new app
genkey - Generate a new license key
keyinfo - Check key status
pausekey - Suspend a key
resumekey - Reactivate a key
userinfo - View user profile
banuser - Ban a user
hwidreset - Reset user HWID
```

---

## ⚠️ Security Enforcement
Ensure you use the `/auth` command (if implemented) or link your Telegram ID in the AuthSys dashboard to prevent unauthorized access. The bot will only respond to Telegram IDs registered in your **Developer Profile**.
