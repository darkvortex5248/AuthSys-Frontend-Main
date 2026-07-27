import Foundation

public func getHwid() -> String {
    #if os(macOS)
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/sbin/ioreg")
    task.arguments = ["-rd1", "-c", "IOPlatformExpertDevice"]

    let pipe = Pipe()
    task.standardOutput = pipe

    do {
        try task.run()
        task.waitUntilExit()

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            for line in output.split(separator: "\n") {
                if line.contains("IOPlatformUUID") {
                    let parts = line.split(separator: "\"")
                    if parts.count >= 4 {
                        return String(parts[3])
                    }
                }
            }
        }
    } catch {
        // Fall through to default
    }
    #elseif os(Linux)
    if let content = try? String(contentsOfFile: "/etc/machine-id") {
        return content.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    #endif

    return "UNKNOWN_HWID"
}

public func hashString(_ input: String) -> String {
    return SHA256.hash(data: Data(input.utf8)).compactMap { String(format: "%02x", $0) }.joined()
}

public func generateGuid() -> String {
    return UUID().uuidString
}
