package main

import (
	"fmt"
	"strings"

	"authsys"
)

func main() {
	opts := &authsys.Options{
		AppSecret:       "YOUR_APP_SECRET",
		AppName:         "MyApplication",
		Version:         "1.0.0",
		EnableLogging:   true,
	}

	client := authsys.NewAuthSysWithOptions(opts)

	// Initialize
	fmt.Println("=== Initializing ===")
	initResult, err := client.Init()
	if err != nil {
		if e, ok := err.(*authsys.AuthSysException); ok {
			fmt.Printf("Auth Error [%s]: %s\n", e.ErrorCode, e.Message)
		} else {
			fmt.Printf("Error: %v\n", err)
		}
		return
	}
	fmt.Printf("Status: %v\n", initResult["status"])
	fmt.Printf("Message: %v\n", initResult["message"])
	fmt.Printf("Version: %v\n", initResult["current_version"])

	// Register
	fmt.Println("\n=== Registering ===")
	registerResult, err := client.Register("testuser", "Password123!", "AUTHSYS-KEY-123456", "")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", registerResult)
	}

	// Login
	fmt.Println("\n=== Logging in ===")
	loginResult, err := client.Login("testuser", "Password123!", 86400)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", loginResult)
		fmt.Printf("Is Authenticated: %v\n", client.IsAuthenticated())
	}

	// Verify
	fmt.Println("\n=== Verifying ===")
	verifyResult, err := client.Verify()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", verifyResult)
	}

	// License Login
	fmt.Println("\n=== License Login ===")
	licenseLoginResult, err := client.LicenseLogin("AUTHSYS-KEY-123456", 86400)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", licenseLoginResult)
	}

	// License Check
	fmt.Println("\n=== License Check ===")
	licenseCheckResult, err := client.LicenseCheck("AUTHSYS-KEY-123456")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", licenseCheckResult)
	}

	// Variables
	fmt.Println("\n=== Variables ===")
	variables := client.GetAllVariables()
	for k, v := range variables {
		fmt.Printf("  %s: %v\n", k, v)
	}

	// Send chat message
	fmt.Println("\n=== Sending chat message ===")
	chatResult, err := client.SendChatMessage(1, "Hello World!")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", chatResult)
	}

	// Device registration
	fmt.Println("\n=== Device Registration ===")
	deviceResult, err := client.RegisterDevice("HWID123", "My Device")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Result: %v\n", deviceResult)
	}

	// Logout
	fmt.Println("\n=== Logging out ===")
	client.Logout()
	fmt.Printf("Is Authenticated: %v\n", client.IsAuthenticated())

	_ = strings.TrimSpace
}
