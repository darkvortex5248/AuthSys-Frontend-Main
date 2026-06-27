# AuthSys Ruby Example

## Requirements
- Ruby 2.7+
- `json` (stdlib)

## Usage
```bash
ruby example.rb
```

## Files
- `authsys.rb` — SDK class
- `example.rb` — CLI demo

## Methods
- `init(appName?)`
- `login(username, password, sessionLength?)`
- `register(username, password, licenseKey, email?)`
- `license_login(licenseKey, sessionLength?)`
- `license_check(licenseKey)`
- `verify()`
- `chat_send(roomId, message)`
- `var(name)`
- `logout()`

## Properties
- `session_token`, `last_error`, `username`, `email`
