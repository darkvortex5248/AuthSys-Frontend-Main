import Foundation

public class AuthSysException: Error {
    public let message: String
    public let statusCode: Int
    public let errorCode: String

    public init(message: String, statusCode: Int = 0, errorCode: String = "") {
        self.message = message
        self.statusCode = statusCode
        self.errorCode = errorCode
    }

    public var localizedDescription: String {
        return "[\(errorCode)] \(message)"
    }
}

public struct AuthSysOptions {
    public var appSecret: String
    public var appName: String
    public var version: String
    public var apiUrl: String
    public var timeout: TimeInterval
    public var maxRetries: Int
    public var skipCertificateValidation: Bool
    public var enableLogging: Bool

    public init(appSecret: String) {
        self.appSecret = appSecret
        self.appName = ""
        self.version = ""
        self.apiUrl = "https://api.authsys.dpdns.org/api/v1"
        self.timeout = 30
        self.maxRetries = 3
        self.skipCertificateValidation = false
        self.enableLogging = false
    }
}

public class AuthSys {
    private let _options: AuthSysOptions
    private var _sessionToken: String = ""
    private var _initialized: Bool = false
    private var _appVariables: [String: Any] = [:]
    private var _username: String = ""

    public init(options: AuthSysOptions) {
        self._options = options
    }

    public convenience init(appSecret: String) {
        self.init(options: AuthSysOptions(appSecret: appSecret))
    }

    private func log(_ message: String) {
        if _options.enableLogging {
            print("[AuthSys] \(message)")
        }
    }

    private func sendRequest(endpoint: String, data: [String: Any]? = nil, headers: [String: String]? = nil) async throws -> [String: Any] {
        let url = "\(_options.apiUrl)/client/\(endpoint)"
        var lastError: String? = nil

        for attempt in 0..._options.maxRetries {
            log("POST \(url) (attempt \(attempt + 1))")

            var request = URLRequest(url: URL(string: url)!)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.timeoutInterval = _options.timeout

            if let headers = headers {
                for (key, value) in headers {
                    request.setValue(value, forHTTPHeaderField: key)
                }
            }

            if let data = data {
                request.httpBody = try? JSONSerialization.data(withJSONObject: data)
            }

            do {
                let (responseData, response) = try await URLSession.shared.data(for: request)

                let httpResponse = response as? HTTPURLResponse
                let statusCode = httpResponse?.statusCode ?? 0
                let responseBody = String(data: responseData, encoding: .utf8) ?? ""
                log("Response: \(statusCode) - \(responseBody)")

                if statusCode < 200 || statusCode >= 300 {
                    var detail = responseBody
                    if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any],
                       let d = json["detail"] as? String {
                        detail = d
                    }

                    let errorCode: String
                    switch statusCode {
                    case 401: errorCode = "unauthorized"
                    case 403: errorCode = "forbidden"
                    case 404: errorCode = "not_found"
                    case 429: errorCode = "rate_limited"
                    case 503: errorCode = "maintenance"
                    default: errorCode = "api_error"
                    }
                    throw AuthSysException(message: detail, statusCode: statusCode, errorCode: errorCode)
                }

                if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any] {
                    return json
                }
                return [:]
            } catch {
                lastError = error.localizedDescription
                log("Request error (attempt \(attempt + 1)): \(lastError!)")
                if attempt < _options.maxRetries {
                    try await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempt))) * 1_000_000_000)
                }
            }
        }

        throw AuthSysException(message: lastError ?? "Request failed after all retries", statusCode: 0, errorCode: "network_error")
    }

    public func initApp() async throws {
        log("Initializing...")
        let data: [String: Any] = [
            "app_secret": _options.appSecret,
            "version": _options.version,
            "app_name": _options.appName,
            "hwid": getHwid()
        ]

        let result = try await sendRequest(endpoint: "init", data: data)
        let status = result["status"] as? String ?? ""

        if status == "update_required" {
            let message = result["message"] as? String ?? "Update required"
            throw AuthSysException(message: message, statusCode: 0, errorCode: "version_mismatch")
        }

        _initialized = status == "success" || status == "update_available"
        if let vars = result["variables"] as? [String: Any] {
            _appVariables = vars
        }
    }

    public func register(username: String, password: String, licenseKey: String, email: String = "") async throws -> [String: Any] {
        if !_initialized {
            throw AuthSysException(message: "Not initialized. Call initApp() first.", statusCode: 0, errorCode: "not_initialized")
        }

        var data: [String: Any] = [
            "app_secret": _options.appSecret,
            "username": username,
            "password": password,
            "license_key": licenseKey,
            "hwid": getHwid()
        ]
        if !email.isEmpty {
            data["email"] = email
        }

        return try await sendRequest(endpoint: "register", data: data)
    }

    public func login(username: String, password: String, sessionLength: Int = 86400) async throws -> [String: Any] {
        if !_initialized {
            throw AuthSysException(message: "Not initialized. Call initApp() first.", statusCode: 0, errorCode: "not_initialized")
        }

        _sessionToken = ""
        let data: [String: Any] = [
            "app_secret": _options.appSecret,
            "username": username,
            "password": password,
            "hwid": getHwid(),
            "session_length": sessionLength
        ]

        let result = try await sendRequest(endpoint: "login", data: data)
        if let token = result["token"] as? String, !token.isEmpty {
            _sessionToken = token
        }
        if let username = result["username"] as? String {
            _username = username
        }
        return result
    }

    public func licenseLogin(licenseKey: String, sessionLength: Int = 86400) async throws -> [String: Any] {
        if !_initialized {
            throw AuthSysException(message: "Not initialized. Call initApp() first.", statusCode: 0, errorCode: "not_initialized")
        }

        _sessionToken = ""
        let data: [String: Any] = [
            "app_secret": _options.appSecret,
            "license_key": licenseKey,
            "hwid": getHwid(),
            "session_length": sessionLength
        ]

        let result = try await sendRequest(endpoint: "license-login", data: data)
        if let token = result["token"] as? String, !token.isEmpty {
            _sessionToken = token
        }
        if let username = result["username"] as? String {
            _username = username
        }
        return result
    }

    public func licenseCheck(licenseKey: String) async throws -> [String: Any] {
        let data: [String: Any] = [
            "app_secret": _options.appSecret,
            "license_key": licenseKey
        ]
        return try await sendRequest(endpoint: "license/check", data: data)
    }

    public func verify() async throws -> [String: Any] {
        if _sessionToken.isEmpty {
            throw AuthSysException(message: "No active session. Login first.", statusCode: 0, errorCode: "no_session")
        }

        let headers: [String: String] = [
            "Authorization": "Bearer \(_sessionToken)",
            "X-HWID": getHwid()
        ]
        return try await sendRequest(endpoint: "verify", data: nil, headers: headers)
    }

    public func sendChatMessage(roomId: Int, message: String) async throws -> [String: Any] {
        if _sessionToken.isEmpty {
            throw AuthSysException(message: "No active session. Login first.", statusCode: 0, errorCode: "no_session")
        }

        let headers: [String: String] = [
            "Authorization": "Bearer \(_sessionToken)"
        ]
        let endpoint = "chat/send?room_id=\(roomId)&message=\(message.addingPercentEncoding(with: .urlQueryAllowed) ?? message)"
        return try await sendRequest(endpoint: endpoint, data: nil, headers: headers)
    }

    public func registerDevice(hwid: String, deviceName: String = "") async throws -> [String: Any] {
        var data: [String: Any] = [
            "app_secret": _options.appSecret,
            "hwid": hwid
        ]
        if !deviceName.isEmpty {
            data["device_name"] = deviceName
        }
        return try await sendRequest(endpoint: "device/register", data: data)
    }

    public func checkDevice(hwid: String) async throws -> [String: Any] {
        let data: [String: Any] = [
            "app_secret": _options.appSecret,
            "hwid": hwid
        ]
        return try await sendRequest(endpoint: "device/check", data: data)
    }

    public func getVariable(_ key: String) -> Any? {
        return _appVariables[key]
    }

    public func getAllVariables() -> [String: Any] {
        return _appVariables
    }

    public func logout() {
        _sessionToken = ""
    }

    public var isAuthenticated: Bool {
        return !_sessionToken.isEmpty
    }

    public var isInitialized: Bool {
        return _initialized
    }

    public var username: String {
        return _username
    }
}
