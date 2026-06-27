# AuthSys Rust Example

## Requirements
- Rust 2021 edition

## Build & Run
```bash
cargo build --release
cargo run
```

## Files
- `src/authsys.rs` — SDK implementation
- `src/main.rs` — CLI example

## Methods
- `init(app_name?)`
- `login(username, password, session_length?)`
- `register(username, password, license_key, email?)`
- `license_login(license_key, session_length?)`
- `license_check(license_key)`
- `verify()`
- `chat_send(room_id, message)`
- `var(name)`
- `logout()`

## Properties
- `session_token: Option<String>`
- `last_error: String`
- `last_response: String`
- `initialized: bool`
