# API Reference

The AuthSys API uses standard REST conventions, returns JSON, and relies on standard HTTP codes.

## Authentication
- **Developer endpoints:** JWT bearer token (`Authorization: Bearer <token>`)
- **Client SDK endpoints:** App secret in request body
- **Seller API endpoints:** `seller-key` header (value: `sk_<key>`)

## Rate Limits
Public SDK endpoints are rate-limited to 60 requests/minute by default via SlowAPI. Nginx also provides a 10 req/sec limit.

---

## Client API (SDKs)

### `POST /api/v1/client/init`
Initialize application session.
**Body:** `{ "app_name": "string", "app_secret": "string", "version": "string", "hwid": "string" }`
**Response:** `200 OK` + `variables` dict. Or `403` if update required.

### `POST /api/v1/client/register`
Register new user with license key.
**Body:** `{ "app_secret": "string", "username": "string", "password": "string", "license_key": "string", "email": "string", "hwid": "string" }`

### `POST /api/v1/client/login`
Authenticate end user.
**Body:** `{ "app_secret": "string", "username": "string", "password": "string", "hwid": "string" }`

### `POST /api/v1/client/license/check`
Verify if a key is valid without logging in a user.

### `POST /api/v1/client/verify`
(Requires JWT) Validate session is still active and user is not banned.

---

## Seller API (for Bots)

Base URL: `/api/v1/developer/sellers`
Auth: `seller-key` header

### License Operations
| Endpoint | Parameters | Description |
|---|---|---|
| `/generate-key` | `app_id`, `duration` (days) | Generate a time-based license key |
| `/delete-key` | `key_value` | Delete a license key |
| `/key-info` | `key_value` | Get key details (status, expiry, note, etc.) |
| `/ban-key` | `key_value`, `reason` | Pause/ban a license key |
| `/unban-key` | `key_value` | Resume a paused key |
| `/list-keys` | `app_id`, `limit` (default 10) | List all keys for an app |
| `/verify-key` | `key_value` | Check if a key is valid |

### User Operations
| Endpoint | Parameters | Description |
|---|---|---|
| `/add-user` | `app_id`, `username`, `password`, `subscription`, `expiry` (days) | Create end user |
| `/delete-user` | `app_id`, `username` | Delete end user |
| `/user-info` | `app_id`, `username` | Get user profile |
| `/ban-user` | `app_id`, `username`, `reason` | Ban end user |
| `/unban-user` | `app_id`, `username` | Unban end user |
| `/reset-hwid` | `app_id`, `username` | Reset user HWID |
| `/extend-user` | `app_id`, `username`, `days` | Extend subscription |
| `/list-users` | `app_id`, `limit` | List all users |
| `/pause-user` | `app_id`, `username` | Pause user |
| `/unpause-user` | `app_id`, `username` | Resume user |
| `/subtract` | `app_id`, `username`, `days` | Reduce subscription time |
| `/delete-all-users` | `app_id` | Wipe all users |
| `/delete-expired-users` | `app_id` | Remove expired users |
| `/edit-username` | `app_id`, `username`, `new_username` | Rename user |
| `/edit-email` | `app_id`, `username`, `email` | Change email |
| `/reset-password` | `app_id`, `username`, `new_password` | Reset password |
| `/user-data` | `app_id`, `username` | Extended user data |
| `/set-user-variable` | `app_id`, `username`, `key`, `value` | Set custom user var |
| `/delete-user-variable` | `app_id`, `username`, `key` | Remove custom user var |

### App Operations
| Endpoint | Parameters | Description |
|---|---|---|
| `/app-details` | `app_id` | Get app name, owner ID, secret, version |
| `/app-stats` | `app_id` | Get usage stats (keys, users, etc.) |

### Blacklist
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-blacklists` | `app_id` | List blacklist entries |
| `/add-blacklist` | `app_id`, `value`, `type` (hwid/ip), `reason` | Add blacklist entry |
| `/delete-blacklist` | `id` | Remove blacklist entry |
| `/delete-all-blacklists` | `app_id` | Clear blacklist |

### Variables
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-variables` | `app_id` | List app variables |
| `/add-variable` | `app_id`, `key_name`, `key_value`, `is_global` | Create variable |
| `/delete-variable` | `id` | Delete variable |
| `/delete-all-variables` | `app_id` | Clear all variables |

### Webhooks
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-webhooks` | `app_id` | List webhook endpoints |
| `/delete-webhook` | `id` | Delete webhook |
| `/delete-all-webhooks` | `app_id` | Clear all webhooks |

### Sessions
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-sessions` | `app_id` | List active user sessions |
| `/kill-session` | `session_id` | Force logout a session |
| `/kill-all-sessions` | `app_id` | Force logout all users |

### Chat Channels
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-chats` | `app_id` | List chat rooms |
| `/add-channel` | `app_id`, `name` | Create chat room |
| `/delete-channel` | `room_id` | Delete chat room |

### IP Whitelist
| Endpoint | Parameters | Description |
|---|---|---|
| `/list-whitelists` | `app_id` | List IP whitelist rules |
| `/add-whitelist` | `app_id`, `value`, `rule_type`, `note` | Add whitelist rule |
| `/delete-whitelist` | `id` | Remove whitelist rule |

### Seller Verification
| Endpoint | Parameters | Description |
|---|---|---|
| `/verify-seller-key` | (header only) | Validate seller key is active |
| `/verify-seller` | (header only) | Alias for above |
