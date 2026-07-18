import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class AuthSysClient(
    private val appSecret: String,
    private val version: String,
    private val apiURL: String = "https://authsys-main-production.up.railway.app/api/v1"
) {
    var sessionToken = ""
        private set
    var lastError = ""
        private set
    var lastResponse = ""
        private set
    var initialized = false
        private set
    var username = ""
        private set
    var email = ""
        private set
    private var variables: MutableMap<String, Any> = mutableMapOf()

    private val baseUrl: String = apiURL.trimEnd('/')

    private fun getHWID(): String {
        try {
            val os = System.getProperty("os.name").lowercase()
            val process = when {
                os.contains("win") -> Runtime.getRuntime().exec(
                    arrayOf("wmic", "csproduct", "get", "uuid"))
                os.contains("mac") -> Runtime.getRuntime().exec(
                    arrayOf("/usr/sbin/ioreg", "-rd1", "-c", "IOPlatformExpertDevice"))
                else -> Runtime.getRuntime().exec(
                    arrayOf("cat", "/etc/machine-id"))
            }
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = reader.readText().trim()
            reader.close()
            process.waitFor()

            return when {
                os.contains("win") -> {
                    val lines = output.split("\n")
                    if (lines.size >= 2) lines[1].trim() else output
                }
                os.contains("mac") -> {
                    for (line in output.split("\n")) {
                        if (line.contains("IOPlatformUUID")) {
                            val parts = line.split("\"")
                            if (parts.size >= 4) return parts[3]
                        }
                    }
                    output
                }
                else -> output
            }
        } catch (_: Exception) {}
        return java.net.InetAddress.getLocalHost().hostName
    }

    private fun getJSON(key: String, json: String): String {
        return try {
            val obj = org.json.JSONObject(json)
            if (obj.has(key)) obj.get(key).toString() else ""
        } catch (_: Exception) { "" }
    }

    private fun post(endpoint: String, body: Map<String, Any>, token: String = ""): String {
        return try {
            val url = URL("$baseUrl/client/$endpoint")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 30000
            conn.readTimeout = 30000

            if (token.isNotEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.setRequestProperty("X-HWID", getHWID())
            }

            val jsonBody = org.json.JSONObject(body).toString()
            OutputStreamWriter(conn.outputStream).use { it.write(jsonBody) }

            val status = conn.responseCode
            val reader = BufferedReader(InputStreamReader(
                if (status in 200..299) conn.inputStream else conn.errorStream
            ))
            val resp = reader.readText()
            reader.close()
            conn.disconnect()
            resp
        } catch (e: Exception) {
            """{"success":false,"detail":"${e.message}"}"""
        }
    }

    fun initApp(appName: String) {
        lastError = ""
        lastResponse = ""
        initialized = false

        val body = mapOf<String, Any>(
            "app_secret" to appSecret,
            "version" to version,
            "app_name" to appName,
            "hwid" to getHWID()
        )
        lastResponse = post("init", body)

        val status = getJSON("status", lastResponse)
        if (status == "success" || status == "update_available") {
            initialized = true
            val varsStr = getJSON("variables", lastResponse)
            if (varsStr.isNotEmpty()) {
                try {
                    val jsonObj = org.json.JSONObject(varsStr)
                    for (key in jsonObj.keySet()) {
                        variables[key] = jsonObj.get(key)
                    }
                } catch (_: Exception) {}
            }
        } else {
            lastError = getJSON("detail", lastResponse)
            if (lastError.isEmpty()) lastError = "Init failed"
        }
    }

    fun login(username: String, password: String, sessionLength: Int = 86400) {
        sessionToken = ""
        lastError = ""
        lastResponse = ""

        val body = mapOf<String, Any>(
            "app_secret" to appSecret,
            "username" to username,
            "password" to password,
            "hwid" to getHWID(),
            "session_length" to sessionLength
        )
        lastResponse = post("login", body)

        val detail = getJSON("detail", lastResponse)
        if (detail.isNotEmpty()) { lastError = detail; return }

        val success = getJSON("success", lastResponse)
        if (success == "true") {
            sessionToken = getJSON("token", lastResponse)
            this.username = username
            email = getJSON("email", lastResponse)
        } else {
            lastError = "Login failed"
        }
    }

    fun register(username: String, password: String, licenseKey: String, email: String = "") {
        lastError = ""
        lastResponse = ""

        val body = mutableMapOf<String, Any>(
            "app_secret" to appSecret,
            "username" to username,
            "password" to password,
            "license_key" to licenseKey,
            "hwid" to getHWID()
        )
        if (email.isNotEmpty()) body["email"] = email
        lastResponse = post("register", body)

        val detail = getJSON("detail", lastResponse)
        if (detail.isNotEmpty()) { lastError = detail; return }

        val success = getJSON("success", lastResponse)
        if (success != "true") lastError = "Registration failed"
    }

    fun licenseLogin(licenseKey: String, sessionLength: Int = 86400) {
        sessionToken = ""
        lastError = ""
        lastResponse = ""

        val body = mapOf<String, Any>(
            "app_secret" to appSecret,
            "license_key" to licenseKey,
            "hwid" to getHWID(),
            "session_length" to sessionLength
        )
        lastResponse = post("license-login", body)

        val detail = getJSON("detail", lastResponse)
        if (detail.isNotEmpty()) { lastError = detail; return }

        val success = getJSON("success", lastResponse)
        if (success == "true") {
            sessionToken = getJSON("token", lastResponse)
            username = getJSON("username", lastResponse)
        } else {
            lastError = "License login failed"
        }
    }

    fun licenseCheck(licenseKey: String) {
        lastError = ""
        lastResponse = ""
        val body = mapOf<String, Any>(
            "app_secret" to appSecret,
            "license_key" to licenseKey
        )
        lastResponse = post("license/check", body)
    }

    fun verify() {
        lastError = ""
        lastResponse = ""
        if (sessionToken.isEmpty()) {
            lastError = "No active session"
            return
        }
        lastResponse = post("verify", emptyMap(), sessionToken)
    }

    fun chatSend(roomId: Int, message: String) {
        lastError = ""
        lastResponse = ""
        if (sessionToken.isEmpty()) {
            lastError = "No active session"
            return
        }
        val encMsg = URLEncoder.encode(message, "UTF-8")
        lastResponse = post("chat/send?room_id=$roomId&message=$encMsg", emptyMap(), sessionToken)
    }

    fun `var`(name: String): String {
        return variables[name]?.toString() ?: ""
    }

    fun logout() {
        sessionToken = ""
        username = ""
        email = ""
        lastError = ""
        lastResponse = ""
    }
}
