use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::process::Command;

pub fn get_hwid() -> String {
    #[cfg(windows)]
    {
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
        if let Ok(content) = std::fs::read_to_string("/proc/sys/kernel/random/boot_id") {
            return content.trim().to_string();
        }
    }

    #[cfg(target_os = "macos")]
    {
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
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    input.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

pub fn generate_guid() -> String {
    if let Ok(output) = Command::new("uuidgen").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            return s.trim().to_string();
        }
    }
    format!("{:x}", rand::random::<u128>())
}

pub fn is_windows() -> bool {
    cfg!(windows)
}

pub fn is_linux() -> bool {
    cfg!(target_os = "linux")
}

pub fn is_macos() -> bool {
    cfg!(target_os = "macos")
}
