using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace AuthSys
{
    public class AuthSysException : Exception
    {
        public int StatusCode { get; }
        public string ErrorCode { get; }

        public AuthSysException(string message, int statusCode = 0, string errorCode = "") : base(message)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }
    }

    public class AuthSysOptions
    {
        public string AppSecret { get; set; } = "";
        public string AppName { get; set; } = "";
        public string Version { get; set; } = "";
        public string ApiUrl { get; set; } = "https://api.authsys.dpdns.org/api/v1";
        public int TimeoutSeconds { get; set; } = 30;
        public int MaxRetries { get; set; } = 3;
        public bool SkipCertificateValidation { get; set; } = false;
        public bool EnableLogging { get; set; } = false;
    }

    public class InitResult
    {
        public string Status { get; set; } = "";
        public string CurrentVersion { get; set; } = "";
        public string Message { get; set; } = "";
        public Dictionary<string, object> Variables { get; set; } = new();
    }

    public class LoginResult
    {
        public bool Success { get; set; }
        public string Token { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public DateTime? ExpiresAt { get; set; }
        public Dictionary<string, object> Variables { get; set; } = new();
        public string Rank { get; set; } = "";
    }

    public class LicenseCheckResult
    {
        public bool Valid { get; set; }
        public int? DurationDays { get; set; }
        public string KeyType { get; set; } = "";
        public string Message { get; set; } = "";
    }

    public class VerifyResult
    {
        public bool Valid { get; set; }
        public string Username { get; set; } = "";
        public DateTime? ExpiresAt { get; set; }
        public Dictionary<string, object> Variables { get; set; } = new();
    }

    public class RegisterResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public DateTime? ExpiresAt { get; set; }
    }

    public class ChatResult
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "";
    }

    public class DeviceRegisterResult
    {
        public bool Active { get; set; }
        public int DeviceId { get; set; }
    }

    public class DeviceCheckResult
    {
        public bool Active { get; set; }
        public string Message { get; set; } = "";
    }

    public class AuthSys
    {
        private readonly AuthSysOptions _options;
        private readonly HttpClient _httpClient;
        private readonly HttpClientHandler _handler;
        private string _sessionToken = "";
        private bool _initialized = false;
        private Dictionary<string, object> _appVariables = new();

        public event EventHandler<string>? OnLog;

        public AuthSys(AuthSysOptions options)
        {
            _options = options;
            _handler = new HttpClientHandler();
            if (options.SkipCertificateValidation)
            {
                _handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
            }
            _httpClient = new HttpClient(_handler)
            {
                BaseAddress = new Uri(_options.ApiUrl),
                Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds)
            };
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        private void Log(string message)
        {
            if (_options.EnableLogging)
            {
                OnLog?.Invoke(this, $"[AuthSys] {message}");
            }
        }

        private async Task<HttpResponseMessage> SendRequestAsync(string endpoint, HttpContent content, Dictionary<string, string>? headers = null)
        {
            var url = $"client/{endpoint}";
            for (int attempt = 0; attempt <= _options.MaxRetries; attempt++)
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, url);
                    request.Content = content;
                    if (headers != null)
                    {
                        foreach (var h in headers)
                            request.Headers.Add(h.Key, h.Value);
                    }

                    var response = await _httpClient.SendAsync(request);
                    return response;
                }
                catch (HttpRequestException ex) when (attempt < _options.MaxRetries)
                {
                    Log($"Request failed (attempt {attempt + 1}): {ex.Message}");
                    await Task.Delay(TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 1000));
                }
                catch (TaskCanceledException ex) when (attempt < _options.MaxRetries)
                {
                    Log($"Request timed out (attempt {attempt + 1}): {ex.Message}");
                    await Task.Delay(TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 1000));
                }
            }
            throw new AuthSysException("Request failed after all retries", 0, "network_error");
        }

        private async Task<Dictionary<string, object>> HandleResponseAsync(HttpResponseMessage response)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            Log($"Response: {response.StatusCode} - {responseBody}");

            if (!response.IsSuccessStatusCode)
            {
                string detail = responseBody;
                try
                {
                    var errorData = JsonSerializer.Deserialize<Dictionary<string, object>>(responseBody);
                    if (errorData != null && errorData.ContainsKey("detail"))
                        detail = errorData["detail"].ToString() ?? responseBody;
                }
                catch { }

                var statusCode = (int)response.StatusCode;
                switch (statusCode)
                {
                    case 401:
                        throw new AuthSysException(detail, 401, "unauthorized");
                    case 403:
                        throw new AuthSysException(detail, 403, "forbidden");
                    case 404:
                        throw new AuthSysException(detail, 404, "not_found");
                    case 429:
                        throw new AuthSysException(detail, 429, "rate_limited");
                    case 503:
                        throw new AuthSysException(detail, 503, "maintenance");
                    default:
                        throw new AuthSysException(detail, statusCode, "api_error");
                }
            }

            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, object>>(responseBody) ?? new Dictionary<string, object>();
            }
            catch
            {
                return new Dictionary<string, object>();
            }
        }

        public async Task<InitResult> InitAsync()
        {
            Log("Initializing...");
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["version"] = _options.Version,
                ["app_name"] = _options.AppName,
                ["hwid"] = AuthSysHelpers.GetHwid()
            };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("init", content);
            var result = await HandleResponseAsync(response);

            var initResult = new InitResult
            {
                Status = result.GetValueOrDefault("status", "").ToString() ?? "",
                CurrentVersion = result.GetValueOrDefault("current_version", "").ToString() ?? "",
                Message = result.GetValueOrDefault("message", "").ToString() ?? "",
            };

            if (result.ContainsKey("variables"))
            {
                initResult.Variables = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    JsonSerializer.Serialize(result["variables"])) ?? new();
                _appVariables = initResult.Variables;
            }

            if (initResult.Status == "update_required")
                throw new AuthSysException(initResult.Message, 0, "version_mismatch");

            _initialized = initResult.Status == "success" || initResult.Status == "update_available";
            return initResult;
        }

        public async Task<RegisterResult> RegisterAsync(string username, string password, string licenseKey, string email = "")
        {
            if (!_initialized)
                throw new AuthSysException("Not initialized. Call InitAsync() first.", 0, "not_initialized");

            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["username"] = username,
                ["password"] = password,
                ["license_key"] = licenseKey,
                ["hwid"] = AuthSysHelpers.GetHwid()
            };
            if (!string.IsNullOrEmpty(email))
                data["email"] = email;

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("register", content);
            var result = await HandleResponseAsync(response);

            return new RegisterResult
            {
                Success = result.GetValueOrDefault("success", false).Equals(true) || response.IsSuccessStatusCode,
                Message = result.GetValueOrDefault("message", "").ToString() ?? "",
                ExpiresAt = result.ContainsKey("expires_at") && result["expires_at"] != null
                    ? JsonSerializer.Deserialize<DateTime?>(JsonSerializer.Serialize(result["expires_at"]))
                    : null
            };
        }

        public async Task<LoginResult> LoginAsync(string username, string password, int sessionLength = 86400)
        {
            if (!_initialized)
                throw new AuthSysException("Not initialized. Call InitAsync() first.", 0, "not_initialized");

            _sessionToken = "";
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["username"] = username,
                ["password"] = password,
                ["hwid"] = AuthSysHelpers.GetHwid(),
                ["session_length"] = sessionLength
            };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("login", content);
            var result = await HandleResponseAsync(response);

            var loginResult = new LoginResult
            {
                Success = result.GetValueOrDefault("success", false).Equals(true),
                Token = result.GetValueOrDefault("token", "").ToString() ?? "",
                Username = result.GetValueOrDefault("username", "").ToString() ?? "",
                Rank = result.GetValueOrDefault("rank", "").ToString() ?? ""
            };

            if (result.ContainsKey("expires_at") && result["expires_at"] != null)
                loginResult.ExpiresAt = JsonSerializer.Deserialize<DateTime?>(JsonSerializer.Serialize(result["expires_at"]));

            if (result.ContainsKey("variables") && result["variables"] != null)
                loginResult.Variables = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    JsonSerializer.Serialize(result["variables"])) ?? new();

            if (loginResult.Success && !string.IsNullOrEmpty(loginResult.Token))
                _sessionToken = loginResult.Token;

            return loginResult;
        }

        public async Task<LoginResult> LicenseLoginAsync(string licenseKey, int sessionLength = 86400)
        {
            if (!_initialized)
                throw new AuthSysException("Not initialized. Call InitAsync() first.", 0, "not_initialized");

            _sessionToken = "";
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["license_key"] = licenseKey,
                ["hwid"] = AuthSysHelpers.GetHwid(),
                ["session_length"] = sessionLength
            };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("license-login", content);
            var result = await HandleResponseAsync(response);

            var loginResult = new LoginResult
            {
                Success = result.GetValueOrDefault("success", false).Equals(true),
                Token = result.GetValueOrDefault("token", "").ToString() ?? "",
                Username = result.GetValueOrDefault("username", "").ToString() ?? ""
            };

            if (result.ContainsKey("expires_at") && result["expires_at"] != null)
                loginResult.ExpiresAt = JsonSerializer.Deserialize<DateTime?>(JsonSerializer.Serialize(result["expires_at"]));

            if (result.ContainsKey("variables") && result["variables"] != null)
                loginResult.Variables = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    JsonSerializer.Serialize(result["variables"])) ?? new();

            if (loginResult.Success && !string.IsNullOrEmpty(loginResult.Token))
                _sessionToken = loginResult.Token;

            return loginResult;
        }

        public async Task<LicenseCheckResult> LicenseCheckAsync(string licenseKey)
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["license_key"] = licenseKey
            };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("license/check", content);
            var result = await HandleResponseAsync(response);

            return new LicenseCheckResult
            {
                Valid = result.GetValueOrDefault("valid", false).Equals(true),
                DurationDays = result.ContainsKey("duration_days") && result["duration_days"] != null
                    ? JsonSerializer.Deserialize<int?>(JsonSerializer.Serialize(result["duration_days"]))
                    : null,
                KeyType = result.GetValueOrDefault("key_type", "").ToString() ?? "",
                Message = result.GetValueOrDefault("message", "").ToString() ?? ""
            };
        }

        public async Task<VerifyResult> VerifyAsync()
        {
            if (string.IsNullOrEmpty(_sessionToken))
                throw new AuthSysException("No active session. Login first.", 0, "no_session");

            var headers = new Dictionary<string, string>
            {
                ["Authorization"] = $"Bearer {_sessionToken}",
                ["X-HWID"] = AuthSysHelpers.GetHwid()
            };

            var response = await SendRequestAsync("verify", new StringContent("{}", Encoding.UTF8, "application/json"), headers);
            var result = await HandleResponseAsync(response);

            var verifyResult = new VerifyResult
            {
                Valid = result.GetValueOrDefault("valid", false).Equals(true),
                Username = result.GetValueOrDefault("username", "").ToString() ?? ""
            };

            if (result.ContainsKey("expires_at") && result["expires_at"] != null)
                verifyResult.ExpiresAt = JsonSerializer.Deserialize<DateTime?>(JsonSerializer.Serialize(result["expires_at"]));

            if (result.ContainsKey("variables") && result["variables"] != null)
                verifyResult.Variables = JsonSerializer.Deserialize<Dictionary<string, object>>(
                    JsonSerializer.Serialize(result["variables"])) ?? new();

            return verifyResult;
        }

        public async Task<ChatResult> SendChatMessageAsync(int roomId, string message)
        {
            if (string.IsNullOrEmpty(_sessionToken))
                throw new AuthSysException("No active session. Login first.", 0, "no_session");

            var headers = new Dictionary<string, string>
            {
                ["Authorization"] = $"Bearer {_sessionToken}"
            };

            var endpoint = $"chat/send?room_id={roomId}&message={Uri.EscapeDataString(message)}";
            var response = await SendRequestAsync(endpoint, new StringContent("{}", Encoding.UTF8, "application/json"), headers);
            var result = await HandleResponseAsync(response);

            return new ChatResult
            {
                Success = true,
                Status = result.GetValueOrDefault("status", "").ToString() ?? ""
            };
        }

        public async Task<DeviceRegisterResult> RegisterDeviceAsync(string hwid, string deviceName = "")
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["hwid"] = hwid
            };
            if (!string.IsNullOrEmpty(deviceName))
                data["device_name"] = deviceName;

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("device/register", content);
            var result = await HandleResponseAsync(response);

            return new DeviceRegisterResult
            {
                Active = result.GetValueOrDefault("active", false).Equals(true),
                DeviceId = Convert.ToInt32(result.GetValueOrDefault("device_id", 0))
            };
        }

        public async Task<DeviceCheckResult> CheckDeviceAsync(string hwid)
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["hwid"] = hwid
            };

            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await SendRequestAsync("device/check", content);
            var result = await HandleResponseAsync(response);

            return new DeviceCheckResult
            {
                Active = result.GetValueOrDefault("active", false).Equals(true),
                Message = result.GetValueOrDefault("message", "").ToString() ?? ""
            };
        }

        public object GetVariable(string key)
        {
            if (_appVariables.ContainsKey(key))
                return _appVariables[key];
            return null;
        }

        public Dictionary<string, object> GetAllVariables()
        {
            return _appVariables;
        }

        public void Logout()
        {
            _sessionToken = "";
        }

        public bool IsAuthenticated => !string.IsNullOrEmpty(_sessionToken);
        public bool IsInitialized => _initialized;
        public string Username { get; private set; } = "";
    }

    public static class AuthSysHelpers
    {
        public static string GetHwid()
        {
            try
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    var process = new System.Diagnostics.Process
                    {
                        StartInfo = new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = "wmic",
                            Arguments = "csproduct get uuid",
                            RedirectStandardOutput = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        }
                    };
                    process.Start();
                    var output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    if (lines.Length > 1)
                        return lines[1].Trim();
                }
                else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    if (File.Exists("/etc/machine-id"))
                        return File.ReadAllText("/etc/machine-id").Trim();
                }
                else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                {
                    var process = new System.Diagnostics.Process
                    {
                        StartInfo = new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = "ioreg",
                            Arguments = "-rd1 -c IOPlatformExpertDevice",
                            RedirectStandardOutput = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        }
                    };
                    process.Start();
                    var output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    var parts = output.Split('"');
                    if (parts.Length > 3)
                        return parts[3];
                }
            }
            catch { }
            return "UNKNOWN_HWID";
        }

        public static string HashString(string input)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        public static string GenerateGuid()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
