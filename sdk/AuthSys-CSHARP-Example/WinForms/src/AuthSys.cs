using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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

    public class AuthSys
    {
        private readonly AuthSysOptions _options;
        private readonly HttpClient _httpClient;
        private readonly HttpClientHandler _handler;
        private string _sessionToken = "";
        private bool _initialized = false;
        private Dictionary<string, object> _appVariables = new();
        private string _username = "";

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

        public AuthSys(string appSecret) : this(new AuthSysOptions { AppSecret = appSecret }) { }

        private void Log(string message)
        {
            if (_options.EnableLogging)
            {
                System.Diagnostics.Debug.WriteLine($"[AuthSys] {message}");
            }
        }

        private async Task<Dictionary<string, object>> SendRequestAsync(string endpoint, Dictionary<string, object> data = null, Dictionary<string, string> headers = null)
        {
            var url = $"client/{endpoint}";
            var json = data != null ? JsonSerializer.Serialize(data) : "{}";
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            for (int attempt = 0; attempt <= _options.MaxRetries; attempt++)
            {
                try
                {
                    Log($"POST {url} (attempt {attempt + 1})");
                    using var request = new HttpRequestMessage(HttpMethod.Post, url);
                    request.Content = content;
                    if (headers != null)
                    {
                        foreach (var h in headers)
                            request.Headers.Add(h.Key, h.Value);
                    }

                    var response = await _httpClient.SendAsync(request);
                    var responseBody = await response.Content.ReadAsStringAsync();
                    Log($"Response: {response.StatusCode} - {responseBody}");

                    if (!response.IsSuccessStatusCode)
                    {
                        var statusCode = (int)response.StatusCode;
                        string errorCode = "api_error";
                        switch (statusCode)
                        {
                            case 401: errorCode = "unauthorized"; break;
                            case 403: errorCode = "forbidden"; break;
                            case 404: errorCode = "not_found"; break;
                            case 429: errorCode = "rate_limited"; break;
                            case 503: errorCode = "maintenance"; break;
                        }
                        throw new AuthSysException(responseBody, statusCode, errorCode);
                    }

                    return JsonSerializer.Deserialize<Dictionary<string, object>>(responseBody) ?? new();
                }
                catch (AuthSysException)
                {
                    throw;
                }
                catch (Exception ex) when (attempt < _options.MaxRetries)
                {
                    Log($"Request error (attempt {attempt + 1}): {ex.Message}");
                    await Task.Delay(TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 1000));
                }
            }

            throw new AuthSysException("Request failed after all retries", 0, "network_error");
        }

        public async Task<Dictionary<string, object>> InitAsync()
        {
            Log("Initializing...");
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["version"] = _options.Version,
                ["app_name"] = _options.AppName,
                ["hwid"] = AuthSysHelpers.GetHwid()
            };

            var result = await SendRequestAsync("init", data);
            var status = result.GetValueOrDefault("status", "").ToString() ?? "";

            if (status == "update_required")
                throw new AuthSysException(result.GetValueOrDefault("message", "").ToString() ?? "Update required", 0, "version_mismatch");

            _initialized = status == "success" || status == "update_available";
            if (result.ContainsKey("variables"))
                _appVariables = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(result["variables"])) ?? new();
            return result;
        }

        public async Task<Dictionary<string, object>> RegisterAsync(string username, string password, string licenseKey, string email = "")
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

            return await SendRequestAsync("register", data);
        }

        public async Task<Dictionary<string, object>> LoginAsync(string username, string password, int sessionLength = 86400)
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

            var result = await SendRequestAsync("login", data);
            if (result.ContainsKey("token") && result["token"].ToString() != "")
                _sessionToken = result["token"].ToString() ?? "";
            if (result.ContainsKey("username"))
                _username = result["username"].ToString() ?? "";
            return result;
        }

        public async Task<Dictionary<string, object>> LicenseLoginAsync(string licenseKey, int sessionLength = 86400)
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

            var result = await SendRequestAsync("license-login", data);
            if (result.ContainsKey("token") && result["token"].ToString() != "")
                _sessionToken = result["token"].ToString() ?? "";
            return result;
        }

        public async Task<Dictionary<string, object>> LicenseCheckAsync(string licenseKey)
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["license_key"] = licenseKey
            };
            return await SendRequestAsync("license/check", data);
        }

        public async Task<Dictionary<string, object>> VerifyAsync()
        {
            if (string.IsNullOrEmpty(_sessionToken))
                throw new AuthSysException("No active session. Login first.", 0, "no_session");

            var headers = new Dictionary<string, string>
            {
                ["Authorization"] = $"Bearer {_sessionToken}",
                ["X-HWID"] = AuthSysHelpers.GetHwid()
            };
            return await SendRequestAsync("verify", null, headers);
        }

        public async Task<Dictionary<string, object>> SendChatMessageAsync(int roomId, string message)
        {
            if (string.IsNullOrEmpty(_sessionToken))
                throw new AuthSysException("No active session. Login first.", 0, "no_session");

            var headers = new Dictionary<string, string>
            {
                ["Authorization"] = $"Bearer {_sessionToken}"
            };
            var endpoint = $"chat/send?room_id={roomId}&message={Uri.EscapeDataString(message)}";
            return await SendRequestAsync(endpoint, null, headers);
        }

        public async Task<Dictionary<string, object>> RegisterDeviceAsync(string hwid, string deviceName = "")
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["hwid"] = hwid
            };
            if (!string.IsNullOrEmpty(deviceName))
                data["device_name"] = deviceName;
            return await SendRequestAsync("device/register", data);
        }

        public async Task<Dictionary<string, object>> CheckDeviceAsync(string hwid)
        {
            var data = new Dictionary<string, object>
            {
                ["app_secret"] = _options.AppSecret,
                ["hwid"] = hwid
            };
            return await SendRequestAsync("device/check", data);
        }

        public object GetVariable(string key)
        {
            return _appVariables.ContainsKey(key) ? _appVariables[key] : null;
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
        public string Username => _username;
    }
}
