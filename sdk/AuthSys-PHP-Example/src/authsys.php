<?php

class AuthSysClient {
    private $appSecret;
    private $version;
    private $apiUrl;

    public $sessionToken = null;
    public $lastError = "";
    public $lastResponse = "";
    public $initialized = false;
    public $username = "";
    public $email = "";

    public function __construct($appSecret, $version, $apiUrl = "https://authsys-main-production.up.railway.app/api/v1") {
        $this->appSecret = $appSecret;
        $this->version = $version;
        $this->apiUrl = rtrim($apiUrl, '/');
    }

    private function getHWID() {
        // Method 1: Volume serial on Windows
        if (PHP_OS_FAMILY === 'Windows') {
            $serial = exec('wmic volume where "DriveLetter='C:'" get SerialNumber /value 2>nul');
            if (preg_match('/SerialNumber=(\S+)/', $serial, $m)) {
                return $m[1];
            }
        }

        // Method 2: Machine ID on Linux
        $machine = @file_get_contents('/etc/machine-id');
        if ($machine) return trim($machine);

        // Method 3: Fallback
        return hash('sha256', php_uname());
    }

    private function getJson($key, $json) {
        $data = json_decode($json, true);
        if ($data && isset($data[$key])) {
            return $data[$key];
        }
        return "";
    }

    private function post($endpoint, $jsonBody, $token = null) {
        $url = $this->apiUrl . "/client/" . $endpoint;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonBody,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        if ($token) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Content-Type: application/json",
                "Authorization: Bearer $token",
                "X-HWID: " . $this->getHWID(),
            ]);
        }
        $res = curl_exec($ch);
        if (curl_errno($ch)) {
            curl_close($ch);
            return '{"success":false,"detail":"' . curl_error($ch) . '"}';
        }
        curl_close($ch);
        return $res;
    }

    public function init($appName = "") {
        $this->lastError = "";
        $this->lastResponse = "";
        $this->initialized = false;

        $json = json_encode([
            "app_secret" => $this->appSecret,
            "version" => $this->version,
            "hwid" => $this->getHWID(),
            "app_name" => $appName,
        ]);
        $this->lastResponse = $this->post("init", $json);

        $status = $this->getJson("status", $this->lastResponse);
        if ($status === "success" || $status === "update_available") {
            $this->initialized = true;
        } else {
            $this->lastError = $this->getJson("detail", $this->lastResponse);
            if (!$this->lastError) $this->lastError = "Init failed";
        }
    }

    public function login($username, $password, $sessionLength = 86400) {
        $this->sessionToken = null;
        $this->lastError = "";
        $this->lastResponse = "";

        $json = json_encode([
            "app_secret" => $this->appSecret,
            "username" => $username,
            "password" => $password,
            "hwid" => $this->getHWID(),
            "session_length" => $sessionLength,
        ]);
        $this->lastResponse = $this->post("login", $json);

        $detail = $this->getJson("detail", $this->lastResponse);
        if ($detail) { $this->lastError = $detail; return; }

        $success = $this->getJson("success", $this->lastResponse);
        if ($success === "true" || $success === true) {
            $this->sessionToken = $this->getJson("token", $this->lastResponse);
            $this->username = $username;
            $this->email = $this->getJson("email", $this->lastResponse);
        } else {
            $this->lastError = "Login failed";
        }
    }

    public function register($username, $password, $licenseKey, $email = "") {
        $this->lastError = "";
        $this->lastResponse = "";

        $data = [
            "app_secret" => $this->appSecret,
            "username" => $username,
            "password" => $password,
            "license_key" => $licenseKey,
            "hwid" => $this->getHWID(),
        ];
        if ($email) $data["email"] = $email;

        $this->lastResponse = $this->post("register", json_encode($data));

        $detail = $this->getJson("detail", $this->lastResponse);
        if ($detail) { $this->lastError = $detail; return; }

        $success = $this->getJson("success", $this->lastResponse);
        if ($success !== "true" && $success !== true) {
            $this->lastError = "Registration failed";
        }
    }

    public function licenseLogin($licenseKey, $sessionLength = 86400) {
        $this->sessionToken = null;
        $this->lastError = "";
        $this->lastResponse = "";

        $json = json_encode([
            "app_secret" => $this->appSecret,
            "license_key" => $licenseKey,
            "hwid" => $this->getHWID(),
            "session_length" => $sessionLength,
        ]);
        $this->lastResponse = $this->post("license_login", $json);

        $detail = $this->getJson("detail", $this->lastResponse);
        if ($detail) { $this->lastError = $detail; return; }

        $success = $this->getJson("success", $this->lastResponse);
        if ($success === "true" || $success === true) {
            $this->sessionToken = $this->getJson("token", $this->lastResponse);
            $this->username = $this->getJson("username", $this->lastResponse);
        } else {
            $this->lastError = "License login failed";
        }
    }

    public function licenseCheck($licenseKey) {
        $this->lastError = "";
        $this->lastResponse = "";
        $json = json_encode([
            "app_secret" => $this->appSecret,
            "license_key" => $licenseKey,
        ]);
        $this->lastResponse = $this->post("license/check", $json);
    }

    public function verify() {
        $this->lastError = "";
        $this->lastResponse = "";
        if (!$this->sessionToken) { $this->lastError = "No active session"; return; }
        $this->lastResponse = $this->post("verify", "{}", $this->sessionToken);
    }

    public function chatSend($roomId, $message) {
        $this->lastError = "";
        $this->lastResponse = "";
        $endpoint = "chat/send?room_id=" . intval($roomId) . "&message=" . urlencode($message);
        $this->lastResponse = $this->post($endpoint, "{}", $this->sessionToken);
    }

    public function var($name) {
        return $this->getJson($name, $this->lastResponse);
    }

    public function logout() {
        $this->sessionToken = null;
        $this->username = "";
        $this->email = "";
        $this->lastError = "";
        $this->lastResponse = "";
    }
}
