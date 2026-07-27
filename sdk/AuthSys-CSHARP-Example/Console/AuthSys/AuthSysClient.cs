using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using AuthSys.Models;
using AuthSys.Exceptions;
using AuthSys.Utilities;

namespace AuthSys
{
    public class AuthSysClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly ILogger _logger;
        private readonly RetryPolicy _retryPolicy;
        private readonly HWIDHelper _hwidHelper;
        private readonly TokenManager _tokenManager;
        private readonly ConfigurationManager _config;
        private bool _disposed = false;

        public event EventHandler<SessionExpiredEventArgs>? SessionExpired;
        public event EventHandler<VersionUpdateEventArgs>? VersionUpdate;
        public event EventHandler<LogEventArgs>? OnLog;

        public AuthSysClient(AuthSysOptions options)
        {
            _config = new ConfigurationManager(options);
            _logger = options.Logger ?? new NullLogger();
            _retryPolicy = new RetryPolicy(options.RetryAttempts, options.RetryDelayMs, _logger);
            _hwidHelper = new HWIDHelper(options.HWIDMode, _logger);
            _tokenManager = new TokenManager(_logger);

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = options.DebugMode,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            _httpClient = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = options.SkipCertificateValidation
                    ? (message, cert, chain, errors) => true
                    : null
            })
            {
                BaseAddress = new Uri(_config.ApiUrl),
                Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds)
            };

            _httpClient.DefaultRequestHeaders.Add("User-Agent", $"AuthSys-SDK-{AuthSysVersion.Version}/csharp");
        }

        public async Task<InitResponse> InitAsync(CancellationToken ct = default)
        {
            _logger.Log(LogLevel.Info, "Initializing AuthSys client...");

            var request = new InitRequest
            {
                AppSecret = _config.Secret,
                Version = _config.Version,
                AppName = _config.Name,
                HWID = _hwidHelper.GetHWID()
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/init",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Init response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<InitResponse>(content, _jsonOptions);
            }, ct);

            _config.IsInitialized = true;
            _config.AppData = response.AppData;

            if (response.Status == "update_required")
            {
                VersionUpdate?.Invoke(this, new VersionUpdateEventArgs
                {
                    RequiredVersion = response.Version,
                    Message = response.Message,
                    IsRequired = true
                });
            }
            else if (response.Status == "update_available")
            {
                VersionUpdate?.Invoke(this, new VersionUpdateEventArgs
                {
                    RequiredVersion = response.Version,
                    Message = response.Message,
                    IsRequired = false
                });
            }

            _logger.Log(LogLevel.Info, "AuthSys client initialized successfully.");
            return response;
        }

        public async Task<AuthResponse> LoginAsync(string username, string password, int sessionLength = 86400, CancellationToken ct = default)
        {
            EnsureInitialized();
            _tokenManager.ClearToken();

            var request = new LoginRequest
            {
                AppSecret = _config.Secret,
                Username = username,
                Password = password,
                HWID = _hwidHelper.GetHWID(),
                SessionLength = sessionLength
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/login",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Login response: {content}");

                if (httpResponse.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    throw new RateLimitException("Rate limit exceeded. Please try again later.");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<AuthResponse>(content, _jsonOptions);
            }, ct);

            if (response.Requires2FA)
            {
                throw new TwoFactorRequiredException("Two-factor authentication is required.");
            }

            if (!response.Success || string.IsNullOrEmpty(response.Token))
            {
                throw new AuthenticationException(response.Detail ?? response.Message ?? "Login failed");
            }

            _tokenManager.SetToken(response.Token, response.ExpiresAt);
            return response;
        }

        public async Task<AuthResponse> LicenseLoginAsync(string licenseKey, int sessionLength = 86400, CancellationToken ct = default)
        {
            EnsureInitialized();
            _tokenManager.ClearToken();

            var request = new LicenseLoginRequest
            {
                AppSecret = _config.Secret,
                LicenseKey = licenseKey,
                HWID = _hwidHelper.GetHWID(),
                SessionLength = sessionLength
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/license-login",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"License login response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<AuthResponse>(content, _jsonOptions);
            }, ct);

            if (!response.Success || string.IsNullOrEmpty(response.Token))
            {
                throw new LicenseException(response.Detail ?? response.Message ?? "License login failed");
            }

            _tokenManager.SetToken(response.Token, response.ExpiresAt);
            return response;
        }

        public async Task<VerifyResponse> VerifyAsync(CancellationToken ct = default)
        {
            EnsureInitialized();
            EnsureAuthenticated();

            var request = new VerifyRequest
            {
                AppSecret = _config.Secret,
                HWID = _hwidHelper.GetHWID()
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/verify",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Verify response: {content}");

                if (httpResponse.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    SessionExpired?.Invoke(this, new SessionExpiredEventArgs());
                    throw new SessionExpiredException("Session has expired. Please re-authenticate.");
                }

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<VerifyResponse>(content, _jsonOptions);
            }, ct);

            if (!response.Valid)
            {
                SessionExpired?.Invoke(this, new SessionExpiredEventArgs());
                throw new SessionExpiredException(response.Detail ?? "Session verification failed");
            }

            _tokenManager.UpdateFromVerify(response.ExpiresAt);
            return response;
        }

        public async Task<RegisterResponse> RegisterAsync(string username, string password, string licenseKey, string email = "", CancellationToken ct = default)
        {
            EnsureInitialized();

            var request = new RegisterRequest
            {
                AppSecret = _config.Secret,
                Username = username,
                Password = password,
                LicenseKey = licenseKey,
                Email = email,
                HWID = _hwidHelper.GetHWID()
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/register",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Register response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<RegisterResponse>(content, _jsonOptions);
            }, ct);

            if (!response.Success)
            {
                throw new ValidationException(response.Detail ?? response.Message ?? "Registration failed");
            }

            return response;
        }

        public async Task<LicenseCheckResponse> LicenseCheckAsync(string licenseKey, CancellationToken ct = default)
        {
            EnsureInitialized();

            var request = new LicenseCheckRequest
            {
                AppSecret = _config.Secret,
                LicenseKey = licenseKey
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/license/check",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"License check response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<LicenseCheckResponse>(content, _jsonOptions);
            }, ct);

            return response;
        }

        public async Task<ChatResponse> SendChatMessageAsync(int roomId, string message, CancellationToken ct = default)
        {
            EnsureInitialized();
            EnsureAuthenticated();

            var request = new ChatRequest
            {
                RoomId = roomId,
                Message = message
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/chat/send",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Chat response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<ChatResponse>(content, _jsonOptions);
            }, ct);

            return response;
        }

        public async Task<DeviceRegisterResponse> RegisterDeviceAsync(string deviceName, string deviceType, CancellationToken ct = default)
        {
            EnsureInitialized();
            EnsureAuthenticated();

            var request = new DeviceRegisterRequest
            {
                AppSecret = _config.Secret,
                DeviceName = deviceName,
                DeviceType = deviceType,
                HWID = _hwidHelper.GetHWID()
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/device/register",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Device register response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<DeviceRegisterResponse>(content, _jsonOptions);
            }, ct);

            return response;
        }

        public async Task<DeviceCheckResponse> CheckDeviceAsync(CancellationToken ct = default)
        {
            EnsureInitialized();
            EnsureAuthenticated();

            var request = new DeviceCheckRequest
            {
                AppSecret = _config.Secret,
                HWID = _hwidHelper.GetHWID()
            };

            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync("client/device/check",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));

                var content = await httpResponse.Content.ReadAsStringAsync();
                _logger.Log(LogLevel.Debug, $"Device check response: {content}");

                httpResponse.EnsureSuccessStatusCode();
                return JsonSerializer.Deserialize<DeviceCheckResponse>(content, _jsonOptions);
            }, ct);

            return response;
        }

        public async Task LogoutAsync(CancellationToken ct = default)
        {
            if (!_tokenManager.HasToken) return;

            try
            {
                var request = new LogoutRequest
                {
                    AppSecret = _config.Secret
                };

                await _httpClient.PostAsync("client/logout",
                    new StringContent(JsonSerializer.Serialize(request, _jsonOptions),
                        Encoding.UTF8, "application/json"));
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Warning, $"Logout request failed: {ex.Message}");
            }
            finally
            {
                _tokenManager.ClearToken();
            }
        }

        public string GetVariable(string key)
        {
            if (!_config.IsInitialized || _config.AppData?.Variables == null)
                return null;

            if (_config.AppData.Variables.TryGetValue(key, out JsonElement el))
                return el.GetString();
            return null;
        }

        public T GetVariable<T>(string key)
        {
            var value = GetVariable(key);
            if (value == null) return default;

            try
            {
                return JsonSerializer.Deserialize<T>(value, _jsonOptions);
            }
            catch
            {
                return default;
            }
        }

        public bool IsAuthenticated => _tokenManager.HasToken;
        public string SessionToken => _tokenManager.Token;
        public DateTime? TokenExpiry => _tokenManager.ExpiresAt;
        public bool IsInitialized => _config.IsInitialized;

        private void EnsureInitialized()
        {
            if (!_config.IsInitialized)
                throw new InvalidOperationException("Client not initialized. Call InitAsync() first.");
        }

        private void EnsureAuthenticated()
        {
            if (!IsAuthenticated)
                throw new AuthenticationException("Not authenticated. Call LoginAsync() or LicenseLoginAsync() first.");
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed && disposing)
            {
                _httpClient?.Dispose();
                _disposed = true;
            }
        }
    }
}
