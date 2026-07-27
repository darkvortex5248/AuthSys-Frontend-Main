using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuthSys.Utilities;

namespace AuthSys.Models
{
    public class AuthSysOptions
    {
        public string Name { get; set; } = "";
        public string Secret { get; set; } = "";
        public string Version { get; set; } = "1.0.0";
        public string ApiUrl { get; set; } = "https://api.authsys.dpdns.org/api/v1";
        public int TimeoutSeconds { get; set; } = 30;
        public int RetryAttempts { get; set; } = 3;
        public int RetryDelayMs { get; set; } = 1000;
        public bool DebugMode { get; set; } = false;
        public bool SkipCertificateValidation { get; set; } = false;
        public HWIDMode HWIDMode { get; set; } = HWIDMode.Auto;
        public ILogger? Logger { get; set; }
    }

    public enum HWIDMode
    {
        Auto,
        Windows,
        Linux,
        MacOS,
        Custom
    }

    public class InitRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("version")]
        public string Version { get; set; } = "";
        
        [JsonPropertyName("app_name")]
        public string AppName { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
    }

    public class InitResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
        
        [JsonPropertyName("app_data")]
        public AppData AppData { get; set; } = new();
        
        [JsonPropertyName("version")]
        public string Version { get; set; } = "";
        
        [JsonPropertyName("min_version")]
        public string MinVersion { get; set; } = "";
    }

    public class AppData
    {
        [JsonPropertyName("variables")]
        public Dictionary<string, JsonElement>? Variables { get; set; }
        
        [JsonPropertyName("hwid_enabled")]
        public bool HwidEnabled { get; set; } = true;
        
        [JsonPropertyName("maintenance_mode")]
        public bool MaintenanceMode { get; set; } = false;
        
        [JsonPropertyName("maintenance_message")]
        public string? MaintenanceMessage { get; set; }
    }

    public class LoginRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("username")]
        public string Username { get; set; } = "";
        
        [JsonPropertyName("password")]
        public string Password { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
        
        [JsonPropertyName("session_length")]
        public int SessionLength { get; set; } = 86400;
    }

    public class LicenseLoginRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("license_key")]
        public string LicenseKey { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
        
        [JsonPropertyName("session_length")]
        public int SessionLength { get; set; } = 86400;
    }

    public class AuthResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("token")]
        public string Token { get; set; } = "";
        
        [JsonPropertyName("expires_at")]
        public DateTime? ExpiresAt { get; set; }
        
        [JsonPropertyName("user")]
        public JsonElement? User { get; set; }
        
        [JsonPropertyName("requires_2fa")]
        public bool Requires2FA { get; set; }
        
        [JsonPropertyName("temp_token")]
        public string? TempToken { get; set; }
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
    }

    public class VerifyRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
    }

    public class VerifyResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
        
        [JsonPropertyName("expires_at")]
        public DateTime? ExpiresAt { get; set; }
        
        [JsonPropertyName("user")]
        public JsonElement? User { get; set; }
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
    }

    public class RegisterRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("username")]
        public string Username { get; set; } = "";
        
        [JsonPropertyName("password")]
        public string Password { get; set; } = "";
        
        [JsonPropertyName("license_key")]
        public string LicenseKey { get; set; } = "";
        
        [JsonPropertyName("email")]
        public string? Email { get; set; }
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
    }

    public class RegisterResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("user_id")]
        public int UserId { get; set; }
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
    }

    public class LicenseCheckRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("license_key")]
        public string LicenseKey { get; set; } = "";
    }

    public class LicenseCheckResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
        
        [JsonPropertyName("duration_days")]
        public int DurationDays { get; set; }
        
        [JsonPropertyName("key_type")]
        public string KeyType { get; set; } = "";
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
    }

    public class ChatRequest
    {
        [JsonPropertyName("room_id")]
        public int RoomId { get; set; }
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
    }

    public class ChatResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
    }

    public class DeviceRegisterRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("device_name")]
        public string DeviceName { get; set; } = "";
        
        [JsonPropertyName("device_type")]
        public string DeviceType { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
    }

    public class DeviceRegisterResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("device_id")]
        public int DeviceId { get; set; }
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
    }

    public class DeviceCheckRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
        
        [JsonPropertyName("hwid")]
        public string HWID { get; set; } = "";
    }

    public class DeviceCheckResponse
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
        
        [JsonPropertyName("device_name")]
        public string DeviceName { get; set; } = "";
        
        [JsonPropertyName("detail")]
        public string Detail { get; set; } = "";
    }

    public class LogoutRequest
    {
        [JsonPropertyName("app_secret")]
        public string AppSecret { get; set; } = "";
    }
}
