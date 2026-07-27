import Foundation
import AuthSys

@main
struct Main {
    static func main() async {
        let options = AuthSysOptions(appSecret: "YOUR_APP_SECRET")
        options.appName = "MyApplication"
        options.version = "1.0.0"
        options.enableLogging = true

        let auth = AuthSys(options: options)

        do {
            print("=== Initializing ===")
            try await auth.initApp()
            print("Is Initialized: \(auth.isInitialized)")

            print("\n=== Registering ===")
            let registerResult = try await auth.register(username: "testuser", password: "Password123!", licenseKey: "AUTHSYS-KEY-123456")
            print("Result: \(registerResult)")

            print("\n=== Logging in ===")
            let loginResult = try await auth.login(username: "testuser", password: "Password123!")
            print("Result: \(loginResult)")
            print("Is Authenticated: \(auth.isAuthenticated)")

            print("\n=== Verifying ===")
            let verifyResult = try await auth.verify()
            print("Result: \(verifyResult)")

            print("\n=== License Login ===")
            let licenseLoginResult = try await auth.licenseLogin(licenseKey: "AUTHSYS-KEY-123456")
            print("Result: \(licenseLoginResult)")

            print("\n=== License Check ===")
            let licenseCheckResult = try await auth.licenseCheck(licenseKey: "AUTHSYS-KEY-123456")
            print("Result: \(licenseCheckResult)")

            print("\n=== Variables ===")
            let variables = auth.getAllVariables()
            for (key, value) in variables {
                print("  \(key): \(value)")
            }

            print("\n=== Sending chat message ===")
            let chatResult = try await auth.sendChatMessage(roomId: 1, message: "Hello World!")
            print("Result: \(chatResult)")

            print("\n=== Device Registration ===")
            let deviceResult = try await auth.registerDevice(hwid: "HWID123", deviceName: "My Device")
            print("Result: \(deviceResult)")

            print("\n=== Logging out ===")
            auth.logout()
            print("Is Authenticated: \(auth.isAuthenticated)")

        } catch {
            if let e = error as? AuthSysException {
                print("Auth Error [\(e.errorCode)]: \(e.message)")
            } else {
                print("Error: \(error.localizedDescription)")
            }
        }
    }
}
