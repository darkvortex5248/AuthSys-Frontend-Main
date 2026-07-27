package com.authsys.example

import com.authsys.AuthSys
import com.authsys.AuthSysException
import com.authsys.AuthSysOptions

fun main() {
    val options = AuthSysOptions(
        appSecret = "YOUR_APP_SECRET",
        appName = "MyApplication",
        version = "1.0.0",
        enableLogging = true
    )

    val auth = AuthSys(options)

    try {
        println("=== Initializing ===")
        val initResult = auth.init()
        println("Result: $initResult")
        println("Is Initialized: ${auth.isInitialized()}")

        println("\n=== Registering ===")
        val registerResult = auth.register("testuser", "Password123!", "AUTHSYS-KEY-123456")
        println("Result: $registerResult")

        println("\n=== Logging in ===")
        val loginResult = auth.login("testuser", "Password123!")
        println("Result: $loginResult")
        println("Is Authenticated: ${auth.isAuthenticated()}")

        println("\n=== Verifying ===")
        val verifyResult = auth.verify()
        println("Result: $verifyResult")

        println("\n=== License Login ===")
        val licenseLoginResult = auth.licenseLogin("AUTHSYS-KEY-123456")
        println("Result: $licenseLoginResult")

        println("\n=== License Check ===")
        val licenseCheckResult = auth.licenseCheck("AUTHSYS-KEY-123456")
        println("Result: $licenseCheckResult")

        println("\n=== Variables ===")
        val variables = auth.getAllVariables()
        for ((key, value) in variables) {
            println("  $key: $value")
        }

        println("\n=== Sending chat message ===")
        val chatResult = auth.sendChatMessage(1, "Hello World!")
        println("Result: $chatResult")

        println("\n=== Device Registration ===")
        val deviceResult = auth.registerDevice("HWID123", "My Device")
        println("Result: $deviceResult")

        println("\n=== Logging out ===")
        auth.logout()
        println("Is Authenticated: ${auth.isAuthenticated()}")

    } catch (e: AuthSysException) {
        println("Auth Error [${e.errorCode}]: ${e.message}")
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }
}
