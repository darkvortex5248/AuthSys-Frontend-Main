package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	auth := NewAuthSysClient("your_app_secret", "1.0.0", "")
	auth.Init("Go-App")

	if !auth.Initialized {
		fmt.Printf("Init failed: %s\n", auth.LastError)
		return
	}

	reader := bufio.NewReader(os.Stdin)
	fmt.Println("1. Login\n2. Register\n3. License Login")
	fmt.Print("Choose: ")
	opt, _ := reader.ReadString('\n')
	opt = strings.TrimSpace(opt)

	switch opt {
	case "1":
		fmt.Print("Username: ")
		user, _ := reader.ReadString('\n')
		user = strings.TrimSpace(user)
		fmt.Print("Password: ")
		pass, _ := reader.ReadString('\n')
		pass = strings.TrimSpace(pass)
		auth.Login(user, pass, 0)
		if auth.SessionToken != "" {
			fmt.Printf("Welcome %s!\n", auth.Username)
		} else {
			fmt.Printf("Login failed: %s\n", auth.LastError)
		}

	case "2":
		fmt.Print("Username: ")
		user, _ := reader.ReadString('\n')
		user = strings.TrimSpace(user)
		fmt.Print("Password: ")
		pass, _ := reader.ReadString('\n')
		pass = strings.TrimSpace(pass)
		fmt.Print("License Key: ")
		key, _ := reader.ReadString('\n')
		key = strings.TrimSpace(key)
		auth.Register(user, pass, key, "")
		if auth.LastError == "" {
			fmt.Println("Registered!")
		} else {
			fmt.Printf("Failed: %s\n", auth.LastError)
		}

	case "3":
		fmt.Print("License Key: ")
		key, _ := reader.ReadString('\n')
		key = strings.TrimSpace(key)
		auth.LicenseLogin(key, 0)
		if auth.SessionToken != "" {
			fmt.Printf("Welcome %s!\n", auth.Username)
		} else {
			fmt.Printf("License login failed: %s\n", auth.LastError)
		}
	}
}
