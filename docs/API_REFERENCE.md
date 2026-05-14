# API Reference

The AuthSys API uses standard REST conventions, returns JSON, and relies on standard HTTP codes.

## Authentication
Developer endpoints require a JWT bearer token. Client SDK endpoints use `app_secret`.

## Rate Limits
Public SDK endpoints are rate-limited to 60 requests/minute by default via SlowAPI. Nginx also provides a 10 req/sec limit.

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
