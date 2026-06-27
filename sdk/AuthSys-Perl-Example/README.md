# AuthSys Perl Example

## Requirements
- Perl 5.10+
- `LWP::UserAgent`, `JSON`, `URI::Escape`

## Install Dependencies
```bash
cpan LWP::UserAgent JSON URI::Escape
```

## Usage
```bash
perl example.pl
```

## Files
- `authsys.pm` — SDK module
- `example.pl` — CLI demo

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
