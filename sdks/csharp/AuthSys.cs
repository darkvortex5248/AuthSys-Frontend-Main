using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

#if NETFRAMEWORK
using System.Management;
#endif

namespace AuthSysSDK
{
    /// <summary>
    /// AuthSys C# SDK — works with .NET Framework 4.7.2+ and .NET Core / .NET 5+.
    /// Requires System.Text.Json (built-in on .NET Core 3+; NuGet on .NET Framework).
    /// Requires System.Management on Windows for HWID (.NET Framework built-in; NuGet on .NET Core).
    /// </summary>
    public class AuthSys
    {
        private static readonly HttpClient Client;

        private readonly string _appSecret;
        private readonly string _ownerId;
        private readonly string _version;
        private readonly string _baseUrl;
        private string _sessionToken;

        static AuthSys()
        {
            Client = new HttpClient();
            Client.Timeout = TimeSpan.FromSeconds(90);
            Client.DefaultRequestHeaders.Add("User-Agent", "AuthSys-CSharp-SDK/2.0");
        }

        public string AppSecret { get { return _appSecret; } }
        public string OwnerId { get { return _ownerId; } }
        public string Version { get { return _version; } }
        public string BaseUrl { get { return _baseUrl; } }
        public string SessionToken { get { return _sessionToken; } }
        public string Hwid { get; private set; }

        public AuthSys(string appSecret, string version = "1.0.0", string baseUrl = "http://localhost:8000/api/v1")
            : this(appSecret, null, version, baseUrl)
        {
        }

        public AuthSys(string credentialA, string credentialB, string version, string baseUrl)
        {
            var resolved = ResolveCredentials(credentialA, credentialB);
            _appSecret = resolved.Item1;
            _ownerId = resolved.Item2 ?? "";
            _version = string.IsNullOrWhiteSpace(version) ? "1.0.0" : version.Trim();
            _baseUrl = NormalizeBaseUrl(baseUrl);
            Hwid = GetHWID();
        }

        public Task<JsonElement> InitAsync()
        {
            return PostAsync("/client/init", new Dictionary<string, object>
            {
                { "app_secret", _appSecret },
                { "version", _version },
                { "hwid", Hwid },
                { "app_name", string.IsNullOrEmpty(_ownerId) ? "client" : _ownerId }
            });
        }

        public Task<JsonElement> RegisterAsync(string username, string password, string licenseKey, string email = null)
        {
            var payload = new Dictionary<string, object>
            {
                { "app_secret", _appSecret },
                { "username", username },
                { "password", password },
                { "license_key", licenseKey },
                { "hwid", Hwid }
            };
            if (!string.IsNullOrEmpty(email))
                payload["email"] = email;
            return PostAsync("/client/register", payload);
        }

        public async Task<JsonElement> LoginAsync(string username, string password, int sessionLength = 86400)
        {
            var result = await PostAsync("/client/login", new Dictionary<string, object>
            {
                { "app_secret", _appSecret },
                { "username", username },
                { "password", password },
                { "hwid", Hwid },
                { "version", _version },
                { "session_length", sessionLength }
            }).ConfigureAwait(false);
            CaptureToken(result);
            return result;
        }

        public async Task<JsonElement> LicenseLoginAsync(string licenseKey, int sessionLength = 86400)
        {
            var result = await PostAsync("/client/license-login", new Dictionary<string, object>
            {
                { "app_secret", _appSecret },
                { "license_key", licenseKey },
                { "hwid", Hwid },
                { "session_length", sessionLength }
            }).ConfigureAwait(false);
            CaptureToken(result);
            return result;
        }

        public Task<JsonElement> CheckLicenseAsync(string licenseKey)
        {
            return PostAsync("/client/license/check", new Dictionary<string, object>
            {
                { "app_secret", _appSecret },
                { "license_key", licenseKey }
            });
        }

        public Task<JsonElement> VerifyAsync()
        {
            if (string.IsNullOrEmpty(_sessionToken))
                return Task.FromResult(ToJson(new { success = false, message = "No active session. Login first." }));

            return GetWithAuthAsync("/client/verify");
        }

        private static Tuple<string, string> ResolveCredentials(string a, string b)
        {
            a = (a ?? "").Trim();
            b = (b ?? "").Trim();

            if (string.IsNullOrEmpty(b))
                return Tuple.Create(a, (string)null);

            bool aIsSecret = LooksLikeAppSecret(a);
            bool bIsSecret = LooksLikeAppSecret(b);

            if (aIsSecret && !bIsSecret) return Tuple.Create(a, b);
            if (bIsSecret && !aIsSecret) return Tuple.Create(b, a);

            if (a.Length >= b.Length) return Tuple.Create(a, b);
            return Tuple.Create(b, a);
        }

        private static bool LooksLikeAppSecret(string s)
        {
            return s.Length >= 32 && Regex.IsMatch(s, @"^[a-fA-F0-9]+$");
        }

        public static string GetHWID()
        {
            try
            {
                string src = "";
                if (IsWindows())
                {
#if NETFRAMEWORK
                    using (var s = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct"))
                    {
                        foreach (ManagementObject o in s.Get())
                            src += o["UUID"] != null ? o["UUID"].ToString() : "";
                    }
                    using (var b = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard"))
                    {
                        foreach (ManagementObject o in b.Get())
                            src += o["SerialNumber"] != null ? o["SerialNumber"].ToString() : "";
                    }
#else
                    try
                    {
                        var mgmtType = Type.GetType("System.Management.ManagementObjectSearcher, System.Management");
                        if (mgmtType != null)
                        {
                            dynamic s = Activator.CreateInstance(mgmtType, "SELECT UUID FROM Win32_ComputerSystemProduct");
                            foreach (dynamic o in s.Get())
                                src += (string)o["UUID"];
                            dynamic b = Activator.CreateInstance(mgmtType, "SELECT SerialNumber FROM Win32_BaseBoard");
                            foreach (dynamic o in b.Get())
                                src += (string)o["SerialNumber"];
                        }
                    }
                    catch { }
#endif
                }

                if (string.IsNullOrEmpty(src))
                    src = Environment.MachineName + Environment.UserName + Environment.OSVersion;

                using (var sha = SHA256.Create())
                {
                    var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(src));
                    return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                }
            }
            catch
            {
                return "hwid-" + Guid.NewGuid().ToString("N").Substring(0, 16);
            }
        }

        private static bool IsWindows()
        {
#if NETFRAMEWORK
            return Environment.OSVersion.Platform == PlatformID.Win32NT;
#else
            return RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
#endif
        }

        private static string NormalizeBaseUrl(string url)
        {
            url = (url ?? "").Trim().TrimEnd('/');
            if (!url.EndsWith("/api/v1", StringComparison.OrdinalIgnoreCase))
            {
                if (url.IndexOf("/api/v1", StringComparison.OrdinalIgnoreCase) < 0)
                    url += "/api/v1";
            }
            return url;
        }

        private void CaptureToken(JsonElement result)
        {
            if (result.ValueKind == JsonValueKind.Object &&
                result.TryGetProperty("success", out var ok) && ok.GetBoolean() &&
                result.TryGetProperty("token", out var tok))
            {
                _sessionToken = tok.GetString();
            }
        }

        private async Task<JsonElement> PostAsync(string path, Dictionary<string, object> payload)
        {
            try
            {
                string json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await Client.PostAsync(_baseUrl + path, content).ConfigureAwait(false);
                return await ParseResponse(response).ConfigureAwait(false);
            }
            catch (TaskCanceledException)
            {
                return ToJson(new { success = false, message = "Request timed out. Server starting up?" });
            }
            catch (Exception ex)
            {
                return ToJson(new { success = false, message = "Connection error: " + ex.Message });
            }
        }

        private async Task<JsonElement> GetWithAuthAsync(string path)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, _baseUrl + path);
                request.Headers.Add("Authorization", "Bearer " + _sessionToken);
                request.Headers.Add("X-HWID", Hwid);
                var response = await Client.SendAsync(request).ConfigureAwait(false);
                return await ParseResponse(response).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                return ToJson(new { success = false, message = "Connection error: " + ex.Message });
            }
        }

        private static async Task<JsonElement> ParseResponse(HttpResponseMessage response)
        {
            string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

            try
            {
                using (var doc = JsonDocument.Parse(body))
                {
                    var root = doc.RootElement.Clone();

                    if (root.TryGetProperty("detail", out var detail))
                    {
                        string msg = detail.ValueKind == JsonValueKind.String
                            ? detail.GetString()
                            : detail.ToString();
                        return ToJson(new { success = false, message = msg });
                    }

                    if (response.IsSuccessStatusCode && !root.TryGetProperty("success", out _))
                    {
                        if (root.TryGetProperty("status", out var statusEl))
                        {
                            string status = statusEl.GetString() ?? "";
                            bool ok = status == "success" || status == "update_available";
                            string message = root.TryGetProperty("message", out var msgEl)
                                ? msgEl.GetString() ?? status
                                : status;
                            return ToJson(new { success = ok, message = message, status = status, data = root });
                        }
                        return ToJson(new { success = true, message = "OK", data = root });
                    }

                    return root;
                }
            }
            catch
            {
                return ToJson(new { success = false, message = body });
            }
        }

        private static JsonElement ToJson(object obj)
        {
            return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(obj));
        }
    }
}
