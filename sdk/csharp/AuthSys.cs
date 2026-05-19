using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Management;

namespace AuthSysSDK
{
    /// <summary>
    /// AuthSys C# SDK — use App Secret from dashboard (NOT Owner ID).
    /// Constructor: new AuthSys(appSecret, version, baseUrl)
    /// Or: new AuthSys(appSecret, ownerId, version, baseUrl) — ownerId is optional metadata only.
    /// </summary>
    public class AuthSys
    {
        private readonly string _appSecret;
        private readonly string _version;
        private readonly string _baseUrl;
        private string _sessionToken;
        private static readonly HttpClient _client = new HttpClient();

        public string Hwid { get; private set; }

        /// <summary>Recommended: app secret + version + API base URL.</summary>
        public AuthSys(string appSecret, string version = "1.0.0", string baseUrl = "https://authsys-vtdu.onrender.com/api/v1")
        {
            _appSecret = appSecret?.Trim() ?? "";
            _version = version;
            _baseUrl = NormalizeBaseUrl(baseUrl);
            Hwid = GetHWID();
        }

        /// <summary>Legacy 4-arg ctor: appSecret, ownerId (ignored for auth), version, baseUrl.</summary>
        public AuthSys(string appSecret, string ownerId, string version, string baseUrl)
            : this(appSecret, version, baseUrl)
        {
            // ownerId is displayed in dashboard for reference only; API auth uses app_secret
        }

        private static string NormalizeBaseUrl(string url)
        {
            url = (url ?? "").Trim().TrimEnd('/');
            if (!url.EndsWith("/api/v1", StringComparison.OrdinalIgnoreCase))
            {
                if (!url.Contains("/api/v1")) url += "/api/v1";
            }
            return url;
        }

        public static string GetHWID()
        {
            try
            {
                string src = "";
                if (OperatingSystem.IsWindows())
                {
                    using var s = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
                    foreach (ManagementObject o in s.Get()) src += o["UUID"]?.ToString();
                    using var b = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
                    foreach (ManagementObject o in b.Get()) src += o["SerialNumber"]?.ToString();
                }
                else
                {
                    src = Environment.MachineName + Environment.UserName;
                }
                using var sha = SHA256.Create();
                var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(src));
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }
            catch
            {
                return "hwid-" + Guid.NewGuid().ToString("N").Substring(0, 16);
            }
        }

        public async Task<JsonElement> InitAsync()
        {
            return await PostAsync("/client/init", new { app_secret = _appSecret, version = _version });
        }

        public async Task<JsonElement> RegisterAsync(string username, string password, string licenseKey, string email = null)
        {
            return await PostAsync("/client/register", new
            {
                app_secret = _appSecret,
                username,
                password,
                license_key = licenseKey,
                hwid = Hwid,
                email
            });
        }

        public async Task<JsonElement> LoginAsync(string username, string password, int sessionLength = 86400)
        {
            var result = await PostAsync("/client/login", new
            {
                app_secret = _appSecret,
                username,
                password,
                hwid = Hwid,
                version = _version,
                session_length = sessionLength
            });
            CaptureToken(result);
            return result;
        }

        public async Task<JsonElement> LicenseLoginAsync(string licenseKey, int sessionLength = 86400)
        {
            var result = await PostAsync("/client/license-login", new
            {
                app_secret = _appSecret,
                license_key = licenseKey,
                hwid = Hwid,
                session_length = sessionLength
            });
            CaptureToken(result);
            return result;
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

        private async Task<JsonElement> PostAsync(string path, object payload)
        {
            try
            {
                string json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _client.PostAsync(_baseUrl + path, content);
                string body = await response.Content.ReadAsStringAsync();

                try
                {
                    using var doc = JsonDocument.Parse(body);
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
                        return ToJson(new { success = true, message = "OK", data = root });
                    }

                    return root;
                }
                catch
                {
                    return ToJson(new { success = false, message = body });
                }
            }
            catch (Exception ex)
            {
                return ToJson(new { success = false, message = "Connection error: " + ex.Message });
            }
        }

        private static JsonElement ToJson(object obj)
        {
            return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(obj));
        }
    }
}
