use std::collections::HashMap;
use std::time::Duration;
use reqwest::blocking::Client;

pub struct Device {
    app_secret: String,
    base_url: String,
    client: Client,
    pub last_error: String,
    pub last_response: String,
}

impl Device {
    pub fn new(app_secret: &str, base_url: &str) -> Self {
        let url = if base_url.is_empty() {
            "https://authsys-main-production.up.railway.app/device".to_string()
        } else {
            base_url.trim_end_matches('/').to_string()
        };
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap();
        Device {
            app_secret: app_secret.to_string(),
            base_url: url,
            client,
            last_error: String::new(),
            last_response: String::new(),
        }
    }

    fn get_hwid() -> String {
        let hostname = hostname::get()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_default();
        let hash = format!("{:X}", md5::compute(hostname.as_bytes()));
        hash
    }

    fn request(&mut self, endpoint: &str, payload: &HashMap<&str, &str>) -> Option<serde_json::Value> {
        let url = format!("{}/{}", self.base_url, endpoint);
        match self.client.post(&url).json(payload).send() {
            Ok(resp) => {
                self.last_response = resp.text().unwrap_or_default();
                serde_json::from_str(&self.last_response).ok()
            }
            Err(e) => {
                self.last_error = e.to_string();
                None
            }
        }
    }

    pub fn check(&mut self) -> bool {
        self.last_error.clear();
        let mut payload = HashMap::new();
        payload.insert("app_secret", &self.app_secret[..]);
        payload.insert("hwid", &Self::get_hwid()[..]);

        match self.request("check", &payload) {
            Some(data) => {
                if data["active"].as_bool().unwrap_or(false) {
                    true
                } else {
                    self.last_error = data["message"]
                        .as_str()
                        .unwrap_or("Device deactivated by admin")
                        .to_string();
                    false
                }
            }
            None => false,
        }
    }

    pub fn register(&mut self, device_name: &str) -> bool {
        self.last_error.clear();
        let mut payload = HashMap::new();
        payload.insert("app_secret", &self.app_secret[..]);
        payload.insert("hwid", &Self::get_hwid()[..]);
        if !device_name.is_empty() {
            payload.insert("device_name", device_name);
        }

        match self.request("register", &payload) {
            Some(data) => data["active"].as_bool().unwrap_or(false),
            None => false,
        }
    }
}
