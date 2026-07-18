import Foundation

class AuthSysClient {
    private let appSecret: String
    private let version: String
    private let apiURL: String
    private let session: URLSession

    var sessionToken = ""
    var lastError = ""
    var lastResponse = ""
    var initialized = false
    var username = ""
    var email = ""
    private var variables: [String: Any] = [:]

    init(appSecret: String, version: String,
         apiURL: String = "https://authsys-main-production.up.railway.app/api/v1") {
        self.appSecret = appSecret
        self.version = version
        var url = apiURL
        while url.hasSuffix("/") { url = String(url.dropLast()) }
        self.apiURL = url
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    private func getHWID() -> String {
        var raw = ""

        #if os(Windows)
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "wmic")
        task.arguments = ["csproduct", "get", "uuid"]
        #elseif os(macOS)
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/sbin/ioreg")
        task.arguments = ["-rd1", "-c", "IOPlatformExpertDevice"]
        #else
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/bin/cat")
        task.arguments = ["/etc/machine-id"]
        #endif

        let pipe = Pipe()
        task.standardOutput = pipe
        do {
            try task.run()
            task.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                raw = output.trimmingCharacters(in: .whitespacesAndNewlines)

                #if os(Windows)
                let lines = raw.components(separatedBy: "\n")
                if lines.count >= 2 { raw = lines[1].trimmingCharacters(in: .whitespacesAndNewlines) }
                #elseif os(macOS)
                for line in raw.components(separatedBy: "\n") {
                    if line.contains("IOPlatformUUID") {
                        let parts = line.components(separatedBy: "\"")
                        if parts.count >= 4 { raw = parts[3]; break }
                    }
                }
                #endif
            }
        } catch {}

        if raw.isEmpty { raw = Host.current().name ?? "unknown" }
        return raw
    }

    private func getJSON(_ key: String, from jsonString: String) -> String {
        guard let data = jsonString.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let val = json[key] else { return "" }
        if let s = val as? String { return s }
        if let n = val as? NSNumber { return n.stringValue }
        if let d = try? JSONSerialization.data(withJSONObject: val) {
            return String(data: d, encoding: .utf8) ?? ""
        }
        return ""
    }

    private func post(endpoint: String, body: [String: Any], token: String = "") async -> String {
        guard let url = URL(string: "\(apiURL)/client/\(endpoint)") else {
            return "{\"success\":false,\"detail\":\"Invalid URL\"}"
        }
        var req = URLRequest(url: url, timeoutInterval: 30)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.setValue(getHWID(), forHTTPHeaderField: "X-HWID")
        }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, _) = try await session.data(for: req)
            return String(data: data, encoding: .utf8) ?? ""
        } catch {
            return "{\"success\":false,\"detail\":\"\(error.localizedDescription)\"}"
        }
    }

    func initApp(appName: String) async {
        lastError = ""
        lastResponse = ""
        initialized = false

        let body: [String: Any] = [
            "app_secret": appSecret,
            "version": version,
            "app_name": appName,
            "hwid": getHWID()
        ]
        lastResponse = await post(endpoint: "init", body: body)

        let status = getJSON("status", from: lastResponse)
        if status == "success" || status == "update_available" {
            initialized = true
            let varsStr = getJSON("variables", from: lastResponse)
            if !varsStr.isEmpty, let data = varsStr.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                variables = json
            }
        } else {
            lastError = getJSON("detail", from: lastResponse)
            if lastError.isEmpty { lastError = "Init failed" }
        }
    }

    func login(username: String, password: String, sessionLength: Int = 86400) async {
        sessionToken = ""
        lastError = ""
        lastResponse = ""

        let body: [String: Any] = [
            "app_secret": appSecret,
            "username": username,
            "password": password,
            "hwid": getHWID(),
            "session_length": sessionLength
        ]
        lastResponse = await post(endpoint: "login", body: body)

        let detail = getJSON("detail", from: lastResponse)
        if !detail.isEmpty { lastError = detail; return }

        let success = getJSON("success", from: lastResponse)
        if success == "true" {
            sessionToken = getJSON("token", from: lastResponse)
            self.username = username
            email = getJSON("email", from: lastResponse)
        } else {
            lastError = "Login failed"
        }
    }

    func register(username: String, password: String, licenseKey: String, email: String = "") async {
        lastError = ""
        lastResponse = ""

        var body: [String: Any] = [
            "app_secret": appSecret,
            "username": username,
            "password": password,
            "license_key": licenseKey,
            "hwid": getHWID()
        ]
        if !email.isEmpty { body["email"] = email }
        lastResponse = await post(endpoint: "register", body: body)

        let detail = getJSON("detail", from: lastResponse)
        if !detail.isEmpty { lastError = detail; return }

        let success = getJSON("success", from: lastResponse)
        if success != "true" { lastError = "Registration failed" }
    }

    func licenseLogin(licenseKey: String, sessionLength: Int = 86400) async {
        sessionToken = ""
        lastError = ""
        lastResponse = ""

        let body: [String: Any] = [
            "app_secret": appSecret,
            "license_key": licenseKey,
            "hwid": getHWID(),
            "session_length": sessionLength
        ]
        lastResponse = await post(endpoint: "license-login", body: body)

        let detail = getJSON("detail", from: lastResponse)
        if !detail.isEmpty { lastError = detail; return }

        let success = getJSON("success", from: lastResponse)
        if success == "true" {
            sessionToken = getJSON("token", from: lastResponse)
            username = getJSON("username", from: lastResponse)
        } else {
            lastError = "License login failed"
        }
    }

    func licenseCheck(licenseKey: String) async {
        lastError = ""
        lastResponse = ""
        let body: [String: Any] = [
            "app_secret": appSecret,
            "license_key": licenseKey
        ]
        lastResponse = await post(endpoint: "license/check", body: body)
    }

    func verify() async {
        lastError = ""
        lastResponse = ""
        if sessionToken.isEmpty {
            lastError = "No active session"
            return
        }
        lastResponse = await post(endpoint: "verify", body: [:], token: sessionToken)
    }

    func chatSend(roomId: Int, message: String) async {
        lastError = ""
        lastResponse = ""
        if sessionToken.isEmpty {
            lastError = "No active session"
            return
        }
        let encMsg = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? message
        lastResponse = await post(endpoint: "chat/send?room_id=\(roomId)&message=\(encMsg)", body: [:], token: sessionToken)
    }

    func var(_ name: String) -> String {
        if let val = variables[name] {
            if let s = val as? String { return s }
            if let d = try? JSONSerialization.data(withJSONObject: val) {
                return String(data: d, encoding: .utf8) ?? ""
            }
        }
        return ""
    }

    func logout() {
        sessionToken = ""
        username = ""
        email = ""
        lastError = ""
        lastResponse = ""
    }
}
