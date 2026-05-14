# 🛡️ AuthSys Discord Bot Orchestration Guide

This guide details how to configure and utilize the AuthSys Discord Bot to manage your authentication infrastructure directly from your Discord server.

## 🚀 Initial Configuration

1.  **Create Discord Application**:
    *   Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    *   Create a new application named `AuthSys Manager`.
    *   Navigate to **Bot** and reset the token. Copy this token.
2.  **Enable Slash Commands**:
    *   Under **OAuth2** -> **URL Generator**, select `applications.commands` and `bot`.
    *   Invite the bot to your server.
3.  **Link to AuthSys**:
    *   Go to your AuthSys Dashboard -> **Discord Bot** section.
    *   Paste your **Bot Token**.
    *   Set the **Interactions Endpoint URL** to: `https://your-api.com/api/v1/bots/discord/interactions`.

---

## 🎮 Slash Command Reference

The AuthSys bot supports a full suite of administrative commands. Ensure your bot has the `Manage Server` permission to restrict these to administrators.

### 📱 Application Management
*   `/app_list` - List all your registered applications and their IDs.
*   `/app_details [app_id]` - Show detailed security status, version, and metrics for an app.
*   `/app_create [name] [version]` - Deploy a new application infrastructure.
*   `/app_delete [app_id]` - Decommission an application (requires confirmation).
*   `/app_maintenance [app_id] [on/off]` - Toggle global maintenance mode.

### 🔑 License Key Operations
*   `/key_gen [app_id] [type] [days/uses] [note]` - Generate a new license key.
    *   *Types*: `time`, `lifetime`, `uses_based`
*   `/key_info [key]` - Check status, expiry, and hardware bind for a specific key.
*   `/key_pause [key]` - Temporarily suspend a license key.
*   `/key_resume [key]` - Reactivate a suspended license key.
*   `/key_delete [key]` - Permanently revoke a license key.

### 👥 User & HWID Management
*   `/user_info [app_id] [username]` - View user profile, IP history, and ban status.
*   `/user_ban [app_id] [username] [reason]` - Ban a user from a specific application.
*   `/user_unban [app_id] [username]` - Lift a user's ban.
*   `/hwid_reset [app_id] [username]` - Clear the hardware binding for a user (Standard for support).

---

## 🛠️ Developer Setup (Slash Command JSON)

To register these commands with Discord, you can use the following bulk registration template in the Developer Portal or via a `curl` request:

```json
[
  {
    "name": "app_details",
    "description": "View application infrastructure details",
    "options": [
      {
        "name": "app_id",
        "description": "The ID of your application",
        "type": 4,
        "required": true
      }
    ]
  },
  {
    "name": "key_gen",
    "description": "Generate a new license key",
    "options": [
      {
        "name": "app_id",
        "description": "Application ID",
        "type": 4,
        "required": true
      },
      {
        "name": "type",
        "description": "Key type",
        "type": 3,
        "required": true,
        "choices": [
          {"name": "Time Based", "value": "time"},
          {"name": "Lifetime", "value": "lifetime"},
          {"name": "Uses Based", "value": "uses_based"}
        ]
      }
    ]
  }
]
```

---

## ⚠️ Security Warning
The **Bot Token** provides full administrative access to your AuthSys account via Discord. Never share this token or commit it to public repositories. Ensure that only authorized roles in your Discord server have access to these slash commands.
