package authsys

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

type AuthSysException struct {
	Message    string
	StatusCode int
	ErrorCode  string
}

func (e *AuthSysException) Error() string {
	return fmt.Sprintf("[%s] %s", e.ErrorCode, e.Message)
}

type Options struct {
	AppSecret              string
	AppName                string
	Version                string
	ApiUrl                 string
	Timeout                int
	MaxRetries             int
	SkipCertificateValidation bool
	EnableLogging          bool
}

type AuthSys struct {
	options       *Options
	sessionToken  string
	initialized   bool
	appVariables  map[string]interface{}
	username      string
}

func NewAuthSys(appSecret string) *AuthSys {
	return &AuthSys{
		options: &Options{
			AppSecret: appSecret,
			AppName:   "",
			Version:   "",
			ApiUrl:    "https://api.authsys.dpdns.org/api/v1",
			Timeout:   30,
			MaxRetries: 3,
			SkipCertificateValidation: false,
			EnableLogging: false,
		},
		appVariables: make(map[string]interface{}),
	}
}

func NewAuthSysWithOptions(opts *Options) *AuthSys {
	if opts.ApiUrl == "" {
		opts.ApiUrl = "https://api.authsys.dpdns.org/api/v1"
	}
	if opts.Timeout == 0 {
		opts.Timeout = 30
	}
	if opts.MaxRetries == 0 {
		opts.MaxRetries = 3
	}
	return &AuthSys{
		options:      opts,
		appVariables: make(map[string]interface{}),
	}
}

func (a *AuthSys) log(message string) {
	if a.options.EnableLogging {
		fmt.Printf("[AuthSys] %s\n", message)
	}
}

func (a *AuthSys) sendRequest(endpoint string, data interface{}, headers map[string]string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/client/%s", strings.TrimRight(a.options.ApiUrl, "/"), endpoint)
	var jsonData []byte
	if data != nil {
		jsonData, _ = json.Marshal(data)
	}

	var lastError error
	for attempt := 0; attempt <= a.options.MaxRetries; attempt++ {
		a.log(fmt.Sprintf("POST %s (attempt %d)", url, attempt+1))

		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			lastError = err
			continue
		}
		req.Header.Set("Content-Type", "application/json")
		for k, v := range headers {
			req.Header.Set(k, v)
		}

		client := &http.Client{Timeout: time.Duration(a.options.Timeout) * time.Second}
		if a.options.SkipCertificateValidation {
			client.Transport = &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			}
		}

		resp, err := client.Do(req)
		if err != nil {
			lastError = err
			a.log(fmt.Sprintf("Request error (attempt %d): %s", attempt+1, err.Error()))
			if attempt < a.options.MaxRetries {
				time.Sleep(time.Duration(1<<uint(attempt)) * time.Second)
			}
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		a.log(fmt.Sprintf("Response: %d - %s", resp.StatusCode, string(body)))

		var result map[string]interface{}
		json.Unmarshal(body, &result)

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			detail := string(body)
			if d, ok := result["detail"]; ok {
				detail = fmt.Sprintf("%v", d)
			}
			errorCode := "api_error"
			switch resp.StatusCode {
			case 401:
				errorCode = "unauthorized"
			case 403:
				errorCode = "forbidden"
			case 404:
				errorCode = "not_found"
			case 429:
				errorCode = "rate_limited"
			case 503:
				errorCode = "maintenance"
			}
			return result, &AuthSysException{Message: detail, StatusCode: resp.StatusCode, ErrorCode: errorCode}
		}

		return result, nil
	}

	return nil, &AuthSysException{Message: fmt.Sprintf("Request failed after all retries: %v", lastError), StatusCode: 0, ErrorCode: "network_error"}
}

func (a *AuthSys) Init() (map[string]interface{}, error) {
	a.log("Initializing...")
	data := map[string]interface{}{
		"app_secret": a.options.AppSecret,
		"version":    a.options.Version,
		"app_name":   a.options.AppName,
		"hwid":       GetHwid(),
	}

	result, err := a.sendRequest("init", data, nil)
	if err != nil {
		return result, err
	}

	status := ""
	if s, ok := result["status"].(string); ok {
		status = s
	}

	if status == "update_required" {
		msg := ""
		if m, ok := result["message"].(string); ok {
			msg = m
		}
		return result, &AuthSysException{Message: msg, StatusCode: 0, ErrorCode: "version_mismatch"}
	}

	a.initialized = status == "success" || status == "update_available"
	if vars, ok := result["variables"].(map[string]interface{}); ok {
		a.appVariables = vars
	}
	return result, nil
}

func (a *AuthSys) Register(username, password, licenseKey, email string) (map[string]interface{}, error) {
	if !a.initialized {
		return nil, &AuthSysException{Message: "Not initialized. Call Init() first.", StatusCode: 0, ErrorCode: "not_initialized"}
	}

	data := map[string]interface{}{
		"app_secret":   a.options.AppSecret,
		"username":     username,
		"password":     password,
		"license_key":  licenseKey,
		"hwid":         GetHwid(),
	}
	if email != "" {
		data["email"] = email
	}

	return a.sendRequest("register", data, nil)
}

func (a *AuthSys) Login(username, password string, sessionLength int) (map[string]interface{}, error) {
	if !a.initialized {
		return nil, &AuthSysException{Message: "Not initialized. Call Init() first.", StatusCode: 0, ErrorCode: "not_initialized"}
	}

	a.sessionToken = ""
	data := map[string]interface{}{
		"app_secret":     a.options.AppSecret,
		"username":       username,
		"password":       password,
		"hwid":           GetHwid(),
		"session_length": sessionLength,
	}

	result, err := a.sendRequest("login", data, nil)
	if err != nil {
		return result, err
	}

	if token, ok := result["token"].(string); ok && token != "" {
		a.sessionToken = token
	}
	if u, ok := result["username"].(string); ok {
		a.username = u
	}
	return result, nil
}

func (a *AuthSys) LicenseLogin(licenseKey string, sessionLength int) (map[string]interface{}, error) {
	if !a.initialized {
		return nil, &AuthSysException{Message: "Not initialized. Call Init() first.", StatusCode: 0, ErrorCode: "not_initialized"}
	}

	a.sessionToken = ""
	data := map[string]interface{}{
		"app_secret":     a.options.AppSecret,
		"license_key":    licenseKey,
		"hwid":           GetHwid(),
		"session_length": sessionLength,
	}

	result, err := a.sendRequest("license-login", data, nil)
	if err != nil {
		return result, err
	}

	if token, ok := result["token"].(string); ok && token != "" {
		a.sessionToken = token
	}
	if u, ok := result["username"].(string); ok {
		a.username = u
	}
	return result, nil
}

func (a *AuthSys) LicenseCheck(licenseKey string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"app_secret":  a.options.AppSecret,
		"license_key": licenseKey,
	}
	return a.sendRequest("license/check", data, nil)
}

func (a *AuthSys) Verify() (map[string]interface{}, error) {
	if a.sessionToken == "" {
		return nil, &AuthSysException{Message: "No active session. Login first.", StatusCode: 0, ErrorCode: "no_session"}
	}

	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", a.sessionToken),
		"X-HWID":        GetHwid(),
	}
	return a.sendRequest("verify", nil, headers)
}

func (a *AuthSys) SendChatMessage(roomId int, message string) (map[string]interface{}, error) {
	if a.sessionToken == "" {
		return nil, &AuthSysException{Message: "No active session. Login first.", StatusCode: 0, ErrorCode: "no_session"}
	}

	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", a.sessionToken),
		"X-HWID":        GetHwid(),
	}
	endpoint := fmt.Sprintf("chat/send?room_id=%d&message=%s", roomId, url.QueryEscape(message))
	return a.sendRequest(endpoint, nil, headers)
}

func (a *AuthSys) RegisterDevice(hwid, deviceName string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"app_secret": a.options.AppSecret,
		"hwid":       hwid,
	}
	if deviceName != "" {
		data["device_name"] = deviceName
	}
	return a.sendRequest("device/register", data, nil)
}

func (a *AuthSys) CheckDevice(hwid string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"app_secret": a.options.AppSecret,
		"hwid":       hwid,
	}
	return a.sendRequest("device/check", data, nil)
}

func (a *AuthSys) GetVariable(key string) interface{} {
	return a.appVariables[key]
}

func (a *AuthSys) GetAllVariables() map[string]interface{} {
	return a.appVariables
}

func (a *AuthSys) Logout() {
	a.sessionToken = ""
}

func (a *AuthSys) IsAuthenticated() bool {
	return a.sessionToken != ""
}

func (a *AuthSys) IsInitialized() bool {
	return a.initialized
}

func (a *AuthSys) GetUsername() string {
	return a.username
}
