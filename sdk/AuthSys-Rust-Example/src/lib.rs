use std::collections::HashMap;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct AuthSysException {
    pub message: String,
    pub status_code: i32,
    pub error_code: String,
}

impl AuthSysException {
    pub fn new(message: String, status_code: i32, error_code: String) -> Self {
        Self { message, status_code, error_code }
    }
}

impl std::fmt::Display for AuthSysException {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.error_code, self.message)
    }
}

impl std::error::Error for AuthSysException {}

#[derive(Debug, Clone)]
pub struct AuthSysOptions {
    pub app_secret: String,
    pub app_name: String,
    pub version: String,
    pub api_url: String,
    pub timeout: u64,
    pub max_retries: i32,
    pub skip_certificate_validation: bool,
    pub enable_logging: bool,
}

impl Default for AuthSysOptions {
    fn default() -> Self {
        Self {
            app_secret: String::new(),
            app_name: String::new(),
            version: String::new(),
            api_url: "https://api.authsys.dpdns.org/api/v1".to_string(),
            timeout: 30,
            max_retries: 3,
            skip_certificate_validation: false,
            enable_logging: false,
        }
    }
}

impl AuthSysOptions {
    pub fn new(app_secret: String) -> Self {
        let mut opts = Self::default();
        opts.app_secret = app_secret;
        opts
    }
}

pub struct AuthSys {
    options: AuthSysOptions,
    session_token: String,
    initialized: bool,
    app_variables: HashMap<String, serde_json::Value>,
    username: String,
}

impl AuthSys {
    pub fn new(options: AuthSysOptions) -> Self {
        Self {
            options,
            session_token: String::new(),
            initialized: false,
            app_variables: HashMap::new(),
            username: String::new(),
        }
    }

    pub fn from_secret(app_secret: String) -> Self {
        Self::new(AuthSysOptions::new(app_secret))
    }

    fn log(&self, message: &str) {
        if self.options.enable_logging {
            println!("[AuthSys] {}", message);
        }
    }

    fn send_request(&self, endpoint: &str, data: Option<&serde_json::Value>, headers: Option<&HashMap<String, String>>) -> Result<serde_json::Value, AuthSysException> {
        let url = format!("{}/client/{}", self.options.api_url.trim_end_matches('/'), endpoint);
        let mut last_error: Option<String> = None;

        for attempt in 0..=self.options.max_retries {
            self.log(&format!("POST {} (attempt {})", url, attempt + 1));

            let client = reqwest::blocking::Client::builder()
                .timeout(Duration::from_secs(self.options.timeout))
                .danger_accept_invalid_certs(self.options.skip_certificate_validation)
                .build()
                .map_err(|e| AuthSysException::new(e.to_string(), 0, "network_error".to_string()))?;

            let mut request = client.post(&url);

            if let Some(data) = data {
                request = request.json(data);
            }

            if let Some(headers) = headers {
                for (key, value) in headers {
                    request = request.header(key, value);
                }
            }

            match request.send() {
                Ok(response) => {
                    let status = response.status().as_u16();
                    let body = response.text().unwrap_or_default();
                    self.log(&format!("Response: {} - {}", status, body));

                    if status < 200 || status >= 300 {
                        let error_code = match status {
                            401 => "unauthorized",
                            403 => "forbidden",
                            404 => "not_found",
                            429 => "rate_limited",
                            503 => "maintenance",
                            _ => "api_error",
                        };
                        return Err(AuthSysException::new(body, status as i32, error_code.to_string()));
                    }

                    return serde_json::from_str(&body)
                        .map_err(|e| AuthSysException::new(e.to_string(), 0, "parse_error".to_string()));
                }
                Err(e) => {
                    last_error = Some(e.to_string());
                    self.log(&format!("Request error (attempt {}): {}", attempt + 1, e));
                    if attempt < self.options.max_retries {
                        std::thread::sleep(Duration::from_secs_f64(2.0_f64.powi(attempt) * 1.0));
                    }
                }
            }
        }

        Err(AuthSysException::new(
            last_error.unwrap_or("Request failed after all retries".to_string()),
            0,
            "network_error".to_string(),
        ))
    }

    pub fn init(&mut self) -> Result<serde_json::Value, AuthSysException> {
        self.log("Initializing...");
        let data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "version": self.options.version,
            "app_name": self.options.app_name,
            "hwid": get_hwid(),
        });

        let result = self.send_request("init", Some(&data), None)?;
        let status = result.get("status").and_then(|v| v.as_str()).unwrap_or("");

        if status == "update_required" {
            let message = result.get("message").and_then(|v| v.as_str()).unwrap_or("Update required");
            return Err(AuthSysException::new(message.to_string(), 0, "version_mismatch".to_string()));
        }

        self.initialized = status == "success" || status == "update_available";
        if let Some(vars) = result.get("variables").and_then(|v| v.as_object()) {
            self.app_variables = vars.clone();
        }
        Ok(result)
    }

    pub fn register(&self, username: &str, password: &str, license_key: &str, email: Option<&str>) -> Result<serde_json::Value, AuthSysException> {
        if !self.initialized {
            return Err(AuthSysException::new("Not initialized. Call init() first.".to_string(), 0, "not_initialized".to_string()));
        }

        let mut data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "username": username,
            "password": password,
            "license_key": license_key,
            "hwid": get_hwid(),
        });

        if let Some(email) = email {
            if !email.is_empty() {
                data["email"] = serde_json::Value::String(email.to_string());
            }
        }

        self.send_request("register", Some(&data), None)
    }

    pub fn login(&mut self, username: &str, password: &str, session_length: i64) -> Result<serde_json::Value, AuthSysException> {
        if !self.initialized {
            return Err(AuthSysException::new("Not initialized. Call init() first.".to_string(), 0, "not_initialized".to_string()));
        }

        self.session_token = String::new();
        let data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "username": username,
            "password": password,
            "hwid": get_hwid(),
            "session_length": session_length,
        });

        let result = self.send_request("login", Some(&data), None)?;
        if let Some(token) = result.get("token").and_then(|v| v.as_str()) {
            if !token.is_empty() {
                self.session_token = token.to_string();
            }
        }
        if let Some(u) = result.get("username").and_then(|v| v.as_str()) {
            self.username = u.to_string();
        }
        Ok(result)
    }

    pub fn license_login(&mut self, license_key: &str, session_length: i64) -> Result<serde_json::Value, AuthSysException> {
        if !self.initialized {
            return Err(AuthSysException::new("Not initialized. Call init() first.".to_string(), 0, "not_initialized".to_string()));
        }

        self.session_token = String::new();
        let data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "license_key": license_key,
            "hwid": get_hwid(),
            "session_length": session_length,
        });

        let result = self.send_request("license-login", Some(&data), None)?;
        if let Some(token) = result.get("token").and_then(|v| v.as_str()) {
            if !token.is_empty() {
                self.session_token = token.to_string();
            }
        }
        Ok(result)
    }

    pub fn license_check(&self, license_key: &str) -> Result<serde_json::Value, AuthSysException> {
        let data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "license_key": license_key,
        });
        self.send_request("license/check", Some(&data), None)
    }

    pub fn verify(&self) -> Result<serde_json::Value, AuthSysException> {
        if self.session_token.is_empty() {
            return Err(AuthSysException::new("No active session. Login first.".to_string(), 0, "no_session".to_string()));
        }

        let headers = HashMap::from([
            ("Authorization".to_string(), format!("Bearer {}", self.session_token)),
            ("X-HWID".to_string(), get_hwid()),
        ]);
        self.send_request("verify", None, Some(&headers))
    }

    pub fn send_chat_message(&self, room_id: i64, message: &str) -> Result<serde_json::Value, AuthSysException> {
        if self.session_token.is_empty() {
            return Err(AuthSysException::new("No active session. Login first.".to_string(), 0, "no_session".to_string()));
        }

        use percent_encoding::{NON_ALPHANUMERIC, utf8_percent_encode};

        let headers = HashMap::from([
            ("Authorization".to_string(), format!("Bearer {}", self.session_token)),
            ("X-HWID".to_string(), get_hwid()),
        ]);
        let encoded_message = utf8_percent_encode(message, NON_ALPHANUMERIC).to_string();
        let endpoint = format!("chat/send?room_id={}&message={}", room_id, encoded_message);
        self.send_request(&endpoint, None, Some(&headers))
    }

    pub fn register_device(&self, hwid: &str, device_name: Option<&str>) -> Result<serde_json::Value, AuthSysException> {
        let mut data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "hwid": hwid,
        });
        if let Some(name) = device_name {
            if !name.is_empty() {
                data["device_name"] = serde_json::Value::String(name.to_string());
            }
        }
        self.send_request("device/register", Some(&data), None)
    }

    pub fn check_device(&self, hwid: &str) -> Result<serde_json::Value, AuthSysException> {
        let data = serde_json::json!({
            "app_secret": self.options.app_secret,
            "hwid": hwid,
        });
        self.send_request("device/check", Some(&data), None)
    }

    pub fn get_variable(&self, key: &str) -> Option<&serde_json::Value> {
        self.app_variables.get(key)
    }

    pub fn get_all_variables(&self) -> &HashMap<String, serde_json::Value> {
        &self.app_variables
    }

    pub fn logout(&mut self) {
        self.session_token = String::new();
    }

    pub fn is_authenticated(&self) -> bool {
        !self.session_token.is_empty()
    }

    pub fn is_initialized(&self) -> bool {
        self.initialized
    }

    pub fn get_username(&self) -> &str {
        &self.username
    }
}

pub fn get_hwid() -> String {
    #[cfg(windows)]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("wmic").args(["csproduct", "get", "uuid"]).output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                for line in s.lines() {
                    let line = line.trim();
                    if !line.is_empty() && line != "UUID" {
                        return line.to_string();
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/etc/machine-id") {
            return content.trim().to_string();
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("ioreg").args(["-rd1", "-c", "IOPlatformExpertDevice"]).output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                for line in s.lines() {
                    if line.contains("IOPlatformUUID") {
                        let parts: Vec<&str> = line.split('"').collect();
                        if parts.len() >= 4 {
                            return parts[3].to_string();
                        }
                    }
                }
            }
        }
    }

    "UNKNOWN_HWID".to_string()
}

pub fn hash_string(input: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

pub fn generate_guid() -> String {
    use std::process::Command;
    if let Ok(output) = Command::new("uuidgen").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            return s.trim().to_string();
        }
    }
    format!("{:x}", rand::random::<u128>())
}
