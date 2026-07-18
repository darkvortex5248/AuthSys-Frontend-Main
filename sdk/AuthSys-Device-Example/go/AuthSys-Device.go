package authsysdevice

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type Device struct {
	AppSecret   string
	BaseURL     string
	LastError   string
	LastResponse string
	client      *http.Client
}

func NewDevice(appSecret, baseURL string) *Device {
	if baseURL == "" {
		baseURL = "https://authsys-main-production.up.railway.app/device"
	}
	return &Device{
		AppSecret: appSecret,
		BaseURL:   strings.TrimRight(baseURL, "/"),
		client:    &http.Client{Timeout: 15 * time.Second},
	}
}

func getHWID() string {
	raw := ""
	hostname, err := os.Hostname()
	if err == nil {
		raw += hostname
	}
	interfaces, err := net.Interfaces()
	if err == nil {
		for _, iface := range interfaces {
			if len(iface.HardwareAddr) > 0 {
				raw += iface.HardwareAddr.String()
			}
		}
	}
	hash := md5.Sum([]byte(raw))
	return fmt.Sprintf("%X", hash)
}

func (d *Device) request(endpoint string, payload map[string]string) (map[string]interface{}, error) {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", d.BaseURL+"/"+endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	d.LastResponse = string(respBody)
	var result map[string]interface{}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (d *Device) Check() bool {
	d.LastError = ""
	payload := map[string]string{
		"group_secret": d.AppSecret,
		"hwid":       getHWID(),
	}
	result, err := d.request("check", payload)
	if err != nil {
		d.LastError = err.Error()
		return false
	}
	if active, ok := result["active"].(bool); ok && active {
		return true
	}
	if msg, ok := result["message"].(string); ok {
		d.LastError = msg
	} else {
		d.LastError = "Device deactivated by admin"
	}
	return false
}

func (d *Device) Register(deviceName string) bool {
	d.LastError = ""
	payload := map[string]string{
		"group_secret": d.AppSecret,
		"hwid":       getHWID(),
	}
	if deviceName != "" {
		payload["device_name"] = deviceName
	}
	result, err := d.request("register", payload)
	if err != nil {
		d.LastError = err.Error()
		return false
	}
	active, _ := result["active"].(bool)
	return active
}
