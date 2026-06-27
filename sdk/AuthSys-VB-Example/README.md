# AuthSys VB.NET Example

## Setup
1. Add NuGet: `System.Management`
2. Add `AuthSys.vb` to your project
3. Run `Main.vb`

## Usage
```vbnet
Dim auth As New AuthSysClient("your_app_secret", "1.0.0")
Await auth.LoginAsync("username", "password")
If auth.SessionToken IsNot Nothing Then
    Console.WriteLine($"Welcome {auth.Username}!")
Else
    Console.WriteLine(auth.LastError)
End If
```

## Methods
- `InitAsync(appName)`
- `LoginAsync(username, password, sessionLength?)`
- `RegisterAsync(username, password, licenseKey, email?)`
- `LicenseLoginAsync(licenseKey, sessionLength?)`
- `LicenseCheckAsync(licenseKey)`
- `VerifyAsync()`
- `ChatSendAsync(roomId, message)`
- `Var(name)`
- `Logout()`
