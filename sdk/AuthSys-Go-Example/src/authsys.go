package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

type AuthSysClient struct {
	appSecret string
	version   string
	apiURL    string
	httpClient *http.Client

	SessionToken string
	LastError    string
	LastResponse string
	Initialized  bool
	Username     string
	Email        string
	variables    string
}

func NewAuthSysClient(appSecret, version string, apiURL string) *AuthSysClient {
	if apiURL == "" {
		apiURL = "https://authsys-main-production.up.railway.app/api/v1"
	}
	return &AuthSysClient{
		appSecret: appSecret,
		version:   version,
		apiURL:    strings.TrimRight(apiURL, "/"),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (a *AuthSysClient) getHWID() string {
	// Windows volume serial
	if runtime.GOOS == "windows" {
		out, err := exec.Command("wmic", "volume", "where", "DriveLetter='C:'", "get", "SerialNumber", "/value").Output()
		if err == nil {
			for _, line := range strings.Split(string(out), "\n") {
				if strings.Contains(line, "SerialNumber") {
					parts := strings.SplitN(line, "=", 2)
					if len(parts) == 2 {
						return strings.TrimSpace(parts[1])
					}
				}
			}
		}
	}

	// Linux machine-id
	if runtime.GOOS == "linux" {
		data, err := os.ReadFile("/etc/machine-id")
		if err == nil {
			return strings.TrimSpace(string(data))
		}
	}

	// macOS
	if runtime.GOOS == "darwin" {
		out, err := exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice").Output()
		if err == nil {
			for _, line := range strings.Split(string(out), "\n") {
				if strings.Contains(line, "IOPlatformUUID") {
					parts := strings.Split(line, "\"")
					if len(parts) >= 4 {
						return parts[3]
					}
				}
			}
		}
	}

	return fmt.Sprintf("%x", time.Now().UnixNano())
}

func (a *AuthSysClient) getJSON(key, jsonStr string) string {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return ""
	}
	if val, ok := data[key]; ok {
		switch v := val.(type) {
		case string:
			return v
		default:
			b, _ := json.Marshal(v)
			return string(b)
		}
	}
	return ""
}

func (a *AuthSysClient) post(endpoint string, body interface{}, token string) string {
	url := fmt.Sprintf("%s/client/%s", a.apiURL, endpoint)
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Sprintf(`{"success":false,"detail":"%s"}`, err.Error())
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("X-HWID", a.getHWID())
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return fmt.Sprintf(`{"success":false,"detail":"%s"}`, err.Error())
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	return string(data)
}

func (a *AuthSysClient) Init(appName string) {
	a.LastError = ""
	a.LastResponse = ""
	a.Initialized = false

	body := map[string]interface{}{
		"app_secret": a.appSecret,
		"version":    a.version,
		"hwid":      a.getHWID(),
		"app_name":  appName,
	}
	a.LastResponse = a.post("init", body, "")
	status := a.getJSON("status", a.LastResponse)
	if status == "success" || status == "update_available" {
		a.Initialized = true
		v := a.getJSON("variables", a.LastResponse)
		if v != "" {
			a.variables = v
		}
	} else {
		a.LastError = a.getJSON("detail", a.LastResponse)
		if a.LastError == "" {
			a.LastError = "Init failed"
		}
	}
}

func (a *AuthSysClient) Login(username, password string, sessionLength int) {
	a.SessionToken = ""
	a.LastError = ""
	a.LastResponse = ""

	if sessionLength == 0 {
		sessionLength = 86400
	}

	body := map[string]interface{}{
		"app_secret":      a.appSecret,
		"username":       username,
		"password":       password,
		"hwid":          a.getHWID(),
		"session_length": sessionLength,
	}
	a.LastResponse = a.post("login", body, "")

	detail := a.getJSON("detail", a.LastResponse)
	if detail != "" {
		a.LastError = detail
		return
	}

	success := a.getJSON("success", a.LastResponse)
	if success == "true" {
		a.SessionToken = a.getJSON("token", a.LastResponse)
		a.Username = username
		a.Email = a.getJSON("email", a.LastResponse)
	} else {
		a.LastError = "Login failed"
	}
}

func (a *AuthSysClient) Register(username, password, licenseKey, email string) {
	a.LastError = ""
	a.LastResponse = ""

	body := map[string]interface{}{
		"app_secret":  a.appSecret,
		"username":   username,
		"password":   password,
		"license_key": licenseKey,
		"hwid":      a.getHWID(),
	}
	if email != "" {
		body["email"] = email
	}
	a.LastResponse = a.post("register", body, "")

	detail := a.getJSON("detail", a.LastResponse)
	if detail != "" {
		a.LastError = detail
		return
	}

	success := a.getJSON("success", a.LastResponse)
	if success != "true" {
		a.LastError = "Registration failed"
	}
}

func (a *AuthSysClient) LicenseLogin(licenseKey string, sessionLength int) {
	a.SessionToken = ""
	a.LastError = ""
	a.LastResponse = ""

	if sessionLength == 0 {
		sessionLength = 86400
	}

	body := map[string]interface{}{
		"app_secret":      a.appSecret,
		"license_key":    licenseKey,
		"hwid":          a.getHWID(),
		"session_length": sessionLength,
	}
	a.LastResponse = a.post("license-login", body, "")

	detail := a.getJSON("detail", a.LastResponse)
	if detail != "" {
		a.LastError = detail
		return
	}

	success := a.getJSON("success", a.LastResponse)
	if success == "true" {
		a.SessionToken = a.getJSON("token", a.LastResponse)
		a.Username = a.getJSON("username", a.LastResponse)
	} else {
		a.LastError = "License login failed"
	}
}

func (a *AuthSysClient) LicenseCheck(licenseKey string) {
	a.LastError = ""
	a.LastResponse = ""
	body := map[string]interface{}{
		"app_secret":  a.appSecret,
		"license_key": licenseKey,
	}
	a.LastResponse = a.post("license/check", body, "")
}

func (a *AuthSysClient) Verify() {
	a.LastError = ""
	a.LastResponse = ""
	if a.SessionToken == "" {
		a.LastError = "No active session"
		return
	}
	body := map[string]interface{}{}
	a.LastResponse = a.post("verify", body, a.SessionToken)
}

func (a *AuthSysClient) ChatSend(roomID int, message string) {
	a.LastError = ""
	a.LastResponse = ""
	endpoint := fmt.Sprintf("chat/send?room_id=%d&message=%s", roomID, urlEncode(message))
	body := map[string]interface{}{}
	a.LastResponse = a.post(endpoint, body, a.SessionToken)
}

func (a *AuthSysClient) Var(name string) string {
	if a.variables != "" {
		return a.getJSON(name, a.variables)
	}
	return ""
}

func (a *AuthSysClient) Logout() {
	a.SessionToken = ""
	a.Username = ""
	a.Email = ""
	a.LastError = ""
	a.LastResponse = ""
}

func urlEncode(s string) string {
	b := &strings.Builder{}
	for _, c := range s {
		switch {
		case c >= 'A' && c <= 'Z', c >= 'a' && c <= 'z', c >= '0' && c <= '9',
			c == '-', c == '_', c == '.', c == '~':
			b.WriteRune(c)
		default:
			fmt.Fprintf(b, "%%%02X", c)
		}
	}
	return b.String()
}
