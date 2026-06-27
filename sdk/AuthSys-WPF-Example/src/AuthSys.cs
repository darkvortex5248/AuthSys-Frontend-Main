using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Management;
using System.Net;

namespace AuthSys
{
    public class AuthSysClient
    {
        private readonly string _appSecret;
        private readonly string _version;
        private readonly string _apiUrl;
        private readonly HttpClient _http;

        public string SessionToken { get; private set; }
        public string LastError { get; private set; }
        public string LastResponse { get; private set; }
        public bool Initialized { get; private set; }
        public string Username { get; private set; }
        public string Email { get; private set; }

        public AuthSysClient(string appSecret, string version, string apiUrl = "https://authsys-main-production.up.railway.app/api/v1")
        {
            _appSecret = appSecret;
            _version = version;
            _apiUrl = apiUrl.TrimEnd('/');
            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        private string GetHWID()
        {
            try
            {
                using (var mos = new ManagementObjectSearcher("SELECT VolumeSerialNumber FROM Win32_LogicalDisk WHERE DeviceID = 'C:'"))
                using (var c = mos.Get().GetEnumerator())
                {
                    if (c.MoveNext() && c.Current?["VolumeSerialNumber"] != null)
                        return c.Current["VolumeSerialNumber"].ToString();
                }
            } catch { }

            try
            {
                using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                {
                    if (key?.GetValue("MachineGuid") is string guid)
                        return guid;
                }
            } catch { }

            return "FALLBACK_HWID";
        }

        private string GetJson(string key, string json)
        {
            try
            {
                using (var doc = JsonDocument.Parse(json))
                {
                    if (doc.RootElement.TryGetProperty(key, out var val))
                    {
                        if (val.ValueKind == JsonValueKind.String) return val.GetString();
                        return val.GetRawText();
                    }
                }
            } catch { }
            return "";
        }

        private async Task<string> PostAsync(string endpoint, string jsonBody, string token = null)
        {
            try
            {
                var url = $"{_apiUrl}/client/{endpoint}";
                var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = new StringContent(jsonBody, Encoding.UTF8, "application/json") };
                if (!string.IsNullOrEmpty(token))
                {
                    req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                    req.Headers.Add("X-HWID", GetHWID());
                }
                var res = await _http.SendAsync(req);
                return await res.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"detail\":\"{ex.Message}\"}}";
            }
        }

        public async Task InitAsync(string appName = "")
        {
            LastError = "";
            LastResponse = "";
            Initialized = false;

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"version\":\"{_version}\",\"hwid\":\"{GetHWID()}\",\"app_name\":\"{appName}\"}}";
            LastResponse = await PostAsync("init", json);

            var status = GetJson("status", LastResponse);
            if (status == "success" || status == "update_available")
            {
                Initialized = true;
            }
            else
            {
                LastError = GetJson("detail", LastResponse);
                if (string.IsNullOrEmpty(LastError)) LastError = "Init failed";
            }
        }

        public async Task LoginAsync(string username, string password, int sessionLength = 86400)
        {
            SessionToken = null;
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}";
            LastResponse = await PostAsync("login", json);

            var detail = GetJson("detail", LastResponse);
            if (!string.IsNullOrEmpty(detail)) { LastError = detail; return; }

            var success = GetJson("success", LastResponse);
            if (success == "true")
            {
                SessionToken = GetJson("token", LastResponse);
                Username = username;
                Email = GetJson("email", LastResponse);
            }
            else
            {
                LastError = "Login failed";
            }
        }

        public async Task RegisterAsync(string username, string password, string licenseKey, string email = "")
        {
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\"";
            if (!string.IsNullOrEmpty(email)) json += $",\"email\":\"{email}\"";
            json += "}";

            LastResponse = await PostAsync("register", json);

            var detail = GetJson("detail", LastResponse);
            if (!string.IsNullOrEmpty(detail)) { LastError = detail; return; }

            var success = GetJson("success", LastResponse);
            if (success != "true") LastError = "Registration failed";
        }

        public async Task LicenseLoginAsync(string licenseKey, int sessionLength = 86400)
        {
            SessionToken = null;
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}";
            LastResponse = await PostAsync("license_login", json);

            var detail = GetJson("detail", LastResponse);
            if (!string.IsNullOrEmpty(detail)) { LastError = detail; return; }

            var success = GetJson("success", LastResponse);
            if (success == "true")
            {
                SessionToken = GetJson("token", LastResponse);
                Username = GetJson("username", LastResponse);
            }
            else
            {
                LastError = "License login failed";
            }
        }

        public async Task LicenseCheckAsync(string licenseKey)
        {
            LastError = "";
            LastResponse = "";
            var json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\"}}";
            LastResponse = await PostAsync("license/check", json);
        }

        public async Task VerifyAsync()
        {
            LastError = "";
            LastResponse = "";
            if (string.IsNullOrEmpty(SessionToken)) { LastError = "No active session"; return; }
            LastResponse = await PostAsync("verify", "{}", SessionToken);
        }

        public async Task ChatSendAsync(int roomId, string message)
        {
            LastError = "";
            LastResponse = "";
            var endpoint = $"chat/send?room_id={roomId}&message={Uri.EscapeDataString(message)}";
            LastResponse = await PostAsync(endpoint, "{}", SessionToken);
        }

        public string Var(string name)
        {
            return GetJson(name, LastResponse);
        }

        public void Logout()
        {
            SessionToken = null;
            Username = null;
            Email = null;
            LastError = "";
            LastResponse = "";
        }
    }
}
