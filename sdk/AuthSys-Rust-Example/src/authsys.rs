use reqwest::blocking::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct AuthSysClient {
    app_secret: String,
    version: String,
    api_url: String,
    client: Client,

    pub session_token: Option<String>,
    pub last_error: String,
    pub last_response: String,
    pub initialized: bool,
    pub username: String,
    pub email: String,
}

impl AuthSysClient {
    pub fn new(app_secret: &str, version: &str, api_url: Option<&str>) -> Self {
        Self {
            app_secret: app_secret.to_string(),
            version: version.to_string(),
            api_url: api_url.unwrap_or("https://authsys-main-production.up.railway.app/api/v1").trim_end_matches('/').to_string(),
            client: Client::builder().timeout(Duration::from_secs(30)).build().unwrap(),
            session_token: None,
            last_error: String::new(),
            last_response: String::new(),
            initialized: false,
            username: String::new(),
            email: String::new(),
        }
    }

    fn get_hwid() -> String {
        // Machine ID
        if let Ok(id) = std::fs::read_to_string("/etc/machine-id") {
            return id.trim().to_string();
        }
        // Windows volume serial
        if cfg!(target_os = "windows") {
            let output = std::process::Command::new("wmic")
                .args(&["volume", "where", "DriveLetter='C:'", "get", "SerialNumber", "/value"])
                .output();
            if let Ok(out) = output {
                let stdout = String::from_utf8_lossy(&out.stdout);
                if let Some(line) = stdout.lines().find(|l| l.contains("SerialNumber")) {
                    if let Some(val) = line.split('=').nth(1) {
                        return val.trim().to_string();
                    }
                }
            }
        }
        format!("{:x}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos())
    }

    fn get_json(&self, key: &str) -> String {
        if let Ok(v) = serde_json::from_str::<Value>(&self.last_response) {
            if let Some(val) = v.get(key) {
                if val.is_string() { return val.as_str().unwrap_or("").to_string(); }
                return val.to_string();
            }
        }
        String::new()
    }

    fn post(&self, endpoint: &str, body: Value, token: Option<&str>) -> String {
        let url = format!("{}/client/{}", self.api_url, endpoint);
        let mut req = self.client.post(&url).json(&body).header("Content-Type", "application/json");

        if let Some(t) = token {
            req = req.header("Authorization", format!("Bearer {}", t));
            req = req.header("X-HWID", Self::get_hwid());
        }

        match req.send() {
            Ok(res) => res.text().unwrap_or_else(|e| format!("{{\"success\":false,\"detail\":\"{}\"}}", e)),
            Err(e) => format!("{{\"success\":false,\"detail\":\"{}\"}}", e),
        }
    }

    pub fn init(&mut self, app_name: Option<&str>) {
        self.last_error.clear();
        self.last_response.clear();
        self.initialized = false;

        let body = json!({
            "app_secret": self.app_secret,
            "version": self.version,
            "hwid": Self::get_hwid(),
            "app_name": app_name.unwrap_or(""),
        });
        self.last_response = self.post("init", body, None);

        let status = self.get_json("status");
        if status == "success" || status == "update_available" {
            self.initialized = true;
        } else {
            self.last_error = self.get_json("detail");
            if self.last_error.is_empty() { self.last_error = "Init failed".to_string(); }
        }
    }

    pub fn login(&mut self, username: &str, password: &str, session_length: Option<i32>) {
        self.session_token = None;
        self.last_error.clear();
        self.last_response.clear();

        let body = json!({
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "hwid": Self::get_hwid(),
            "session_length": session_length.unwrap_or(86400),
        });
        self.last_response = self.post("login", body, None);

        let detail = self.get_json("detail");
        if !detail.is_empty() { self.last_error = detail; return; }

        let success = self.get_json("success");
        if success == "true" {
            self.session_token = Some(self.get_json("token"));
            self.username = username.to_string();
            self.email = self.get_json("email");
        } else {
            self.last_error = "Login failed".to_string();
        }
    }

    pub fn register(&mut self, username: &str, password: &str, license_key: &str, email: Option<&str>) {
        self.last_error.clear();
        self.last_response.clear();

        let mut body = json!({
            "app_secret": self.app_secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": Self::get_hwid(),
        });
        if let Some(e) = email {
            if !e.is_empty() {
                body["email"] = json!(e);
            }
        }
        self.last_response = self.post("register", body, None);

        let detail = self.get_json("detail");
        if !detail.is_empty() { self.last_error = detail; return; }

        let success = self.get_json("success");
        if success != "true" { self.last_error = "Registration failed".to_string(); }
    }

    pub fn license_login(&mut self, license_key: &str, session_length: Option<i32>) {
        self.session_token = None;
        self.last_error.clear();
        self.last_response.clear();

        let body = json!({
            "app_secret": self.app_secret,
            "license_key": license_key,
            "hwid": Self::get_hwid(),
            "session_length": session_length.unwrap_or(86400),
        });
        self.last_response = self.post("license_login", body, None);

        let detail = self.get_json("detail");
        if !detail.is_empty() { self.last_error = detail; return; }

        let success = self.get_json("success");
        if success == "true" {
            self.session_token = Some(self.get_json("token"));
            self.username = self.get_json("username");
        } else {
            self.last_error = "License login failed".to_string();
        }
    }

    pub fn license_check(&mut self, license_key: &str) {
        self.last_error.clear();
        self.last_response.clear();
        let body = json!({
            "app_secret": self.app_secret,
            "license_key": license_key,
        });
        self.last_response = self.post("license/check", body, None);
    }

    pub fn verify(&mut self) {
        self.last_error.clear();
        self.last_response.clear();
        if self.session_token.is_none() { self.last_error = "No active session".to_string(); return; }
        let body = json!({});
        self.last_response = self.post("verify", body, self.session_token.as_deref());
    }

    pub fn chat_send(&mut self, room_id: i32, message: &str) {
        self.last_error.clear();
        self.last_response.clear();
        let endpoint = format!("chat/send?room_id={}&message={}", room_id, urlencoding(message));
        let body = json!({});
        self.last_response = self.post(&endpoint, body, self.session_token.as_deref());
    }

    pub fn var(&self, name: &str) -> String {
        self.get_json(name)
    }

    pub fn logout(&mut self) {
        self.session_token = None;
        self.username.clear();
        self.email.clear();
        self.last_error.clear();
        self.last_response.clear();
    }
}

fn urlencoding(s: &str) -> String {
    s.chars().map(|c| match c {
        'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
        _ => format!("%{:02X}", c as u8),
    }).collect()
}
