package com.authsys

import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.UUID

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
            if (java.io.File("/etc/machine-id").exists()) {
                return java.io.File("/etc/machine-id").readText().trim()
            }
            if (java.io.File("/proc/sys/kernel/random/boot_id").exists()) {
                return java.io.File("/proc/sys/kernel/random/boot_id").readText().trim()
            }
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
    val md = MessageDigest.getInstance("SHA-256")
    val hash = md.digest(input.toByteArray(StandardCharsets.UTF_8))
    return hash.joinToString("") { "%02x".format(it) }
}

fun generateGuid(): String {
    return UUID.randomUUID().toString()
}

fun isWindows(): Boolean {
    return System.getProperty("os.name").lowercase().contains("win")
}

fun isLinux(): Boolean {
    return System.getProperty("os.name").lowercase().contains("linux")
}

fun isMacOS(): Boolean {
    return System.getProperty("os.name").lowercase().contains("mac")
}
