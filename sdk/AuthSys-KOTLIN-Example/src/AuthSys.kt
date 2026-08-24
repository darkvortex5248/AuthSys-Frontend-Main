package com.authsys

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors
import java.util.concurrent.Future
import kotlin.math.pow

class AuthSysException(
    message: String,
    val statusCode: Int = 0,
    val errorCode: String = ""
) : Exception(message)

data class AuthSysOptions(
    val appSecret: String,
    val appName: String = "",
    val version: String = "",
    val apiUrl: String = "https://api.authsys.dpdns.org/api/v1",
    val timeout: Int = 30000,
    val maxRetries: Int = 3,
    val skipCertificateValidation: Boolean = false,
    val enableLogging: Boolean = false
)

class AuthSys(private val options: AuthSysOptions) {
    private var sessionToken: String = ""
    private var initialized: Boolean = false
    private val appVariables: MutableMap<String, Any> = mutableMapOf()
    private var username: String = ""
    private val executor = Executors.newSingleThreadExecutor()

    private fun log(message: String) {
        if (options.enableLogging) {
            println("[AuthSys] $message")
        }
    }

    private fun sendRequest(endpoint: String, jsonPayload: String?, headers: Map<String, String>?): String {
        val url = "${options.apiUrl}/client/$endpoint"
        var lastError: String? = null

        for (attempt in 0..options.maxRetries) {
            log("POST $url (attempt ${attempt + 1})")
            try {
                val urlObj = URL(url)
                val conn = urlObj.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Accept", "application/json")
                conn.connectTimeout = options.timeout
                conn.readTimeout = options.timeout

                headers?.forEach { (key, value) ->
                    conn.setRequestProperty(key, value)
                }

                if (jsonPayload != null && jsonPayload.isNotEmpty()) {
                    conn.doOutput = true
                    val os = conn.outputStream
                    val input = jsonPayload.toByteArray(StandardCharsets.UTF_8)
                    os.write(input, 0, input.size)
                    os.flush()
                    os.close()
                }

                val code = conn.responseCode
                val reader = BufferedReader(InputStreamReader(
                    if (code >= 200 && code < 300) conn.inputStream else conn.errorStream, "utf-8"
                ))
                val response = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    response.append(line?.trim())
                }
                val responseBody = response.toString()
                log("Response: $code - $responseBody")

                if (code < 200 || code >= 300) {
                    val errorCode = when (code) {
                        401 -> "unauthorized"
                        403 -> "forbidden"
                        404 -> "not_found"
                        429 -> "rate_limited"
                        503 -> "maintenance"
                        else -> "api_error"
                    }
                    throw AuthSysException(responseBody, code, errorCode)
                }

                return responseBody
            } catch (e: AuthSysException) {
                throw e
            } catch (e: Exception) {
                lastError = e.message
                log("Request error (attempt ${attempt + 1}): $lastError")
                if (attempt < options.maxRetries) {
                    Thread.sleep((2.0.pow(attempt.toDouble()) * 1000).toLong())
                }
            }
        }

        throw AuthSysException(
            lastError ?: "Request failed after all retries",
            0,
            "network_error"
        )
    }

    private fun escape(s: String): String {
        return (s ?: "").replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }

    fun init(): String {
        log("Initializing...")
        val json = """{"app_secret":"${escape(options.appSecret)}","version":"${escape(options.version)}","app_name":"${escape(options.appName)}","hwid":"${getHwid()}"}"""
        val res = sendRequest("init", json, null)

        if (res.contains("\"update_required\"")) {
            throw AuthSysException("Update required", 0, "version_mismatch")
        }

        initialized = res.contains("\"success\"") || res.contains("\"update_available\"")
        return res
    }

    fun register(username: String, password: String, licenseKey: String, email: String? = null): String {
        if (!initialized) {
            throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized")
        }

        var json = """{"app_secret":"${escape(options.appSecret)}","username":"${escape(username)}","password":"${escape(password)}","license_key":"${escape(licenseKey)}","hwid":"${getHwid()}"}"""
        if (email != null && email.isNotEmpty()) {
            json = json.removeSuffix("}") + ",\"email\":\"${escape(email)}\"}"
        }
        return sendRequest("register", json, null)
    }

    fun login(username: String, password: String, sessionLength: Int = 86400): String {
        if (!initialized) {
            throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized")
        }

        sessionToken = ""
        val json = """{"app_secret":"${escape(options.appSecret)}","username":"${escape(username)}","password":"${escape(password)}","hwid":"${getHwid()}","session_length":$sessionLength}"""
        val res = sendRequest("login", json, null)

        val tokenMatch = Regex("\"token\":\"([^\"]+)\"").find(res)
        if (tokenMatch != null) {
            sessionToken = tokenMatch.groupValues[1]
        }
        val usernameMatch = Regex("\"username\":\"([^\"]+)\"").find(res)
        if (usernameMatch != null) {
            this.username = usernameMatch.groupValues[1]
        }
        return res
    }

    fun licenseLogin(licenseKey: String, sessionLength: Int = 86400): String {
        if (!initialized) {
            throw AuthSysException("Not initialized. Call init() first.", 0, "not_initialized")
        }

        sessionToken = ""
        val json = """{"app_secret":"${escape(options.appSecret)}","license_key":"${escape(licenseKey)}","hwid":"${getHwid()}","session_length":$sessionLength}"""
        val res = sendRequest("license-login", json, null)

        val tokenMatch = Regex("\"token\":\"([^\"]+)\"").find(res)
        if (tokenMatch != null) {
            sessionToken = tokenMatch.groupValues[1]
        }
        return res
    }

    fun licenseCheck(licenseKey: String): String {
        val json = """{"app_secret":"${escape(options.appSecret)}","license_key":"${escape(licenseKey)}"}"""
        return sendRequest("license/check", json, null)
    }

    fun verify(): String {
        if (sessionToken.isEmpty()) {
            throw AuthSysException("No active session. Login first.", 0, "no_session")
        }

        val headers = mapOf(
            "Authorization" to "Bearer $sessionToken",
            "X-HWID" to getHwid()
        )
        return sendRequest("verify", null, headers)
    }

    fun sendChatMessage(roomId: Int, message: String): String {
        if (sessionToken.isEmpty()) {
            throw AuthSysException("No active session. Login first.", 0, "no_session")
        }

        val headers = mapOf(
            "Authorization" to "Bearer $sessionToken",
            "X-HWID" to getHwid()
        )
        val encoded = URLEncoder.encode(message, "UTF-8")
        return sendRequest("chat/send?room_id=$roomId&message=$encoded", null, headers)
    }

    fun registerDevice(hwid: String, deviceName: String? = null): String {
        var json = """{"app_secret":"${escape(options.appSecret)}","hwid":"${escape(hwid)}"}"""
        if (deviceName != null && deviceName.isNotEmpty()) {
            json = json.removeSuffix("}") + ",\"device_name\":\"${escape(deviceName)}\"}"
        }
        return sendRequest("device/register", json, null)
    }

    fun checkDevice(hwid: String): String {
        val json = """{"app_secret":"${escape(options.appSecret)}","hwid":"${escape(hwid)}"}"""
        return sendRequest("device/check", json, null)
    }

    fun getVariable(key: String): Any? {
        return appVariables[key]
    }

    fun getAllVariables(): Map<String, Any> {
        return appVariables
    }

    fun logout() {
        sessionToken = ""
    }

    fun isAuthenticated(): Boolean {
        return sessionToken.isNotEmpty()
    }

    fun isInitialized(): Boolean {
        return initialized
    }

    fun getUsername(): String {
        return username
    }
}

fun getHwid(): String {
    try {
        val os = System.getProperty("os.name").lowercase()
        if (os.contains("win")) {
            val process = Runtime.getRuntime().exec(arrayOf("wmic", "csproduct", "get", "uuid"))
            process.outputStream.close()
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line)
            }
            val result = output.toString().replace("UUID", "").trim()
            return if (result.isEmpty()) "UNKNOWN_HWID" else result
        } else if (os.contains("linux")) {
            val process = Runtime.getRuntime().exec(arrayOf("cat", "/etc/machine-id"))
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val line = reader.readLine()
            return line?.trim() ?: "UNKNOWN_HWID"
        } else if (os.contains("mac")) {
            val process = Runtime.getRuntime().exec(arrayOf("ioreg", "-rd1", "-c", "IOPlatformExpertDevice"))
            process.outputStream.close()
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                if (line?.contains("IOPlatformUUID") == true) {
                    val parts = line!!.split("\"")
                    if (parts.size >= 4) return parts[3]
                }
            }
        }
    } catch (e: Exception) {}
    return "UNKNOWN_KOTLIN_HWID"
}

fun hashString(input: String): String {
    val md = java.security.MessageDigest.getInstance("SHA-256")
    val hash = md.digest(input.toByteArray(StandardCharsets.UTF_8))
    return hash.joinToString("") { "%02x".format(it) }
}

fun generateGuid(): String {
    return java.util.UUID.randomUUID().toString()
}
