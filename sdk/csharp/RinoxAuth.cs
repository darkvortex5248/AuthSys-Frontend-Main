using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Management;

namespace RinoxAuthSDK
{
    public class RinoxAuth
    {
        private readonly string _appSecret;
        private readonly string _ownerId;
        private readonly string _version;
        private readonly string _baseUrl;
        private string _sessionToken;
        private readonly string _hwid;
        private static readonly HttpClient _client = new HttpClient();

        public RinoxAuth(string appSecret, string ownerId, string version, string baseUrl)
        {
            _appSecret = appSecret;
            _ownerId = ownerId;
            _version = version;
            _baseUrl = baseUrl.EndsWith("/") ? baseUrl.TrimEnd('/') : baseUrl;
            _hwid = GetHWID();
        }

        public RinoxAuth(string appSecret, string version = "1.0.0", string baseUrl = "http://127.0.0.1:8000/api/v1")
        {
            _appSecret = appSecret;
            _version = version;
            _baseUrl = baseUrl.EndsWith("/") ? baseUrl.TrimEnd('/') : baseUrl;
            _hwid = GetHWID();
        }

        private string GetHWID()
        {
            string mId = "";
            try {
                ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT SerializableId FROM Win32_BaseBoard");
                foreach (ManagementObject share in searcher.Get()) {
                    mId += share["SerializableId"];
                }
            } catch { mId = Environment.MachineName; }

            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(mId));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++) {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        public async Task<JsonElement> InitAsync()
        {
            var payload = new { app_secret = _appSecret, version = _version };
            return await PostAsync("/client/init", payload);
        }

        public async Task<JsonElement> RegisterAsync(string username, string password, string licenseKey, string email = null)
        {
            var payload = new { 
                app_secret = _appSecret, 
                username = username, 
                password = password, 
                license_key = licenseKey, 
                hwid = _hwid, 
                email = email 
            };
            return await PostAsync("/client/register", payload);
        }

        public async Task<JsonElement> LoginAsync(string username, string password, int sessionLength = 3600)
        {
            var payload = new { 
                app_secret = _appSecret, 
                username = username, 
                password = password, 
                hwid = _hwid, 
                session_length = sessionLength 
            };
            var result = await PostAsync("/client/login", payload);
            
            if (result.ValueKind != JsonValueKind.Null && result.TryGetProperty("success", out JsonElement success) && success.GetBoolean())
            {
                if (result.TryGetProperty("token", out JsonElement token))
                    _sessionToken = token.GetString();
            }
            return result;
        }

        public async Task<JsonElement> LicenseLoginAsync(string licenseKey, int sessionLength = 3600)
        {
            var payload = new { 
                app_secret = _appSecret, 
                license_key = licenseKey, 
                hwid = _hwid, 
                session_length = sessionLength 
            };
            var result = await PostAsync("/client/license-login", payload);
            
            if (result.ValueKind != JsonValueKind.Null && result.TryGetProperty("success", out JsonElement success) && success.GetBoolean())
            {
                if (result.TryGetProperty("token", out JsonElement token))
                    _sessionToken = token.GetString();
            }
            return result;
        }

        public async Task<JsonElement> VerifyAsync()
        {
            if (string.IsNullOrEmpty(_sessionToken))
                throw new Exception("No active session found.");

            var request = new HttpRequestMessage(HttpMethod.Post, _baseUrl + "/client/verify");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _sessionToken);
            request.Headers.Add("X-HWID", _hwid);

            var response = await _client.SendAsync(request);
            string content = await response.Content.ReadAsStringAsync();
            try {
                return JsonSerializer.Deserialize<JsonElement>(content);
            } catch {
                throw new Exception("Server returned non-JSON response: " + content);
            }
        }

        private async Task<JsonElement> PostAsync(string endpoint, object payload)
        {
            try {
                string json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _client.PostAsync(_baseUrl + endpoint, content);
                string responseString = await response.Content.ReadAsStringAsync();
                
                try {
                    var doc = JsonDocument.Parse(responseString);
                    var root = doc.RootElement;
                    
                    if (root.TryGetProperty("detail", out JsonElement detail))
                    {
                        var errorObj = new { success = false, message = detail.GetString() };
                        return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(errorObj));
                    }
                    return root.Clone();
                } catch {
                    var errorObj = new { success = false, message = "Server Error: " + responseString };
                    return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(errorObj));
                }
            } catch (Exception ex) {
                var errorObj = new { success = false, message = "Connection Error: " + ex.Message };
                return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(errorObj));
            }
        }
    }
}
