using System;
using System.Diagnostics;
using System.Management;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AuthSys
{
    public class api
    {
        public string name, ownerid, secret, version, apiUrl;
        public string sessionToken;
        public bool initialized;

        public class AppData
        {
            public JsonElement variables { get; set; }
        }

        public AppData app_data = new AppData();
        public JsonElement user_data;
        public string lastError = "";
        public JsonElement lastResponse;

        public class ResponseStructure
        {
            public string status { get; set; }
            public string message { get; set; }
            public string detail { get; set; }
            public bool success { get; set; }
            public string token { get; set; }
            public bool valid { get; set; }
            public string username { get; set; }
            public string email { get; set; }
            public string expires_at { get; set; }
            public JsonElement variables { get; set; }
            public JsonElement user { get; set; }
        }

        public ResponseStructure response = new ResponseStructure();
        private static readonly HttpClient client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

        public api(string name, string ownerid, string secret, string version, string apiUrl = "https://authsys-main-production.up.railway.app/api/v1")
        {
            this.name = name;
            this.ownerid = ownerid;
            this.secret = secret;
            this.version = version;
            this.apiUrl = apiUrl.TrimEnd('/');
        }

        private string GetHWID()
        {
            try
            {
                string uuid = string.Empty;
                ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
                foreach (ManagementObject wmi in searcher.Get())
                {
                    uuid = wmi["UUID"].ToString();
                }
                return uuid;
            }
            catch
            {
                return "UNKNOWN_HWID";
            }
        }

        private ResponseStructure PostRequest(string endpoint, object data, Dictionary<string, string> headers = null)
        {
            try
            {
                string json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, $"{apiUrl}/client/{endpoint}")
                {
                    Content = content
                };
                if (headers != null)
                {
                    foreach (var h in headers)
                        request.Headers.TryAddWithoutValidation(h.Key, h.Value);
                }

                var result = client.SendAsync(request).GetAwaiter().GetResult();
                var resultString = result.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var parsed = JsonSerializer.Deserialize<ResponseStructure>(resultString, opts);
                response = parsed ?? new ResponseStructure();
                try { lastResponse = JsonDocument.Parse(resultString).RootElement.Clone(); } catch { }
                lastError = response.detail ?? "";
                return response;
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
                return new ResponseStructure { success = false, detail = ex.Message };
            }
        }

        public void init()
        {
            lastError = "";
            initialized = false;

            var data = new
            {
                app_secret = this.secret,
                version = this.version,
                app_name = this.name,
                hwid = GetHWID()
            };

            response = PostRequest("init", data);

            if (response.status == "success" || response.status == "update_available")
            {
                initialized = true;
                app_data.variables = response.variables;
            }
            else
            {
                lastError = response.detail ?? response.message ?? "Init failed";
            }
        }

        public void register(string username, string password, string license_key, string email = "")
        {
            lastError = "";
            if (!initialized)
            {
                lastError = "init() failed or not called";
                return;
            }

            var data = new
            {
                app_secret = this.secret,
                username,
                password,
                license_key,
                email = string.IsNullOrEmpty(email) ? null : email,
                hwid = GetHWID()
            };

            response = PostRequest("register", data);

            if (!string.IsNullOrEmpty(response.detail))
                lastError = response.detail;
            else if (!response.success)
                lastError = "Registration failed";
        }

        public void login(string username, string password, int sessionLength = 86400)
        {
            lastError = "";
            sessionToken = null;
            if (!initialized)
            {
                lastError = "init() failed or not called";
                return;
            }

            var data = new
            {
                app_secret = this.secret,
                username,
                password,
                hwid = GetHWID(),
                session_length = sessionLength
            };

            response = PostRequest("login", data);

            if (!string.IsNullOrEmpty(response.detail))
                lastError = response.detail;
            else if (response.success && !string.IsNullOrEmpty(response.token))
            {
                sessionToken = response.token;
                user_data = response.user;
            }
            else if (!response.success)
                lastError = "Login failed: server returned success=false";
        }

        public void licenseLogin(string key, int sessionLength = 86400)
        {
            lastError = "";
            sessionToken = null;
            if (!initialized)
            {
                lastError = "init() failed or not called";
                return;
            }

            var data = new
            {
                app_secret = this.secret,
                license_key = key,
                hwid = GetHWID(),
                session_length = sessionLength
            };

            response = PostRequest("license-login", data);

            if (!string.IsNullOrEmpty(response.detail))
                lastError = response.detail;
            else if (response.success && !string.IsNullOrEmpty(response.token))
            {
                sessionToken = response.token;
                user_data = response.user;
            }
            else if (!response.success)
                lastError = "License login failed: server returned success=false";
        }

        public void licenseCheck(string key)
        {
            lastError = "";
            var data = new { app_secret = this.secret, license_key = key };
            response = PostRequest("license/check", data);
            if (!string.IsNullOrEmpty(response.detail)) lastError = response.detail;
        }

        public void verify()
        {
            lastError = "";
            if (string.IsNullOrEmpty(sessionToken))
            {
                lastError = "No active session. Login first.";
                return;
            }

            var headers = new Dictionary<string, string>
            {
                { "Authorization", $"Bearer {sessionToken}" },
                { "X-HWID", GetHWID() }
            };
            response = PostRequest("verify", null, headers);

            if (!string.IsNullOrEmpty(response.detail))
                lastError = response.detail;
            else if (!response.valid)
                lastError = "Session verification failed";
        }

        public void chatSend(int roomId, string message)
        {
            lastError = "";
            if (string.IsNullOrEmpty(sessionToken))
            {
                lastError = "No active session. Login first.";
                return;
            }

            var headers = new Dictionary<string, string>
            {
                { "Authorization", $"Bearer {sessionToken}" }
            };
            response = PostRequest($"chat/send?room_id={roomId}&message={Uri.EscapeDataString(message)}", null, headers);
            if (!string.IsNullOrEmpty(response.detail)) lastError = response.detail;
        }

        public string var(string varName)
        {
            if (!initialized || app_data.variables.ValueKind == JsonValueKind.Undefined) return null;
            if (app_data.variables.TryGetProperty(varName, out JsonElement el))
                return el.GetString();
            return null;
        }

        public void logout()
        {
            sessionToken = null;
            user_data = default;
        }
    }
}
