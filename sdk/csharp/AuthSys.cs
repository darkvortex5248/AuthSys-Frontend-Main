using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Management;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading;

namespace AuthSysSDK
{
    public class AuthSys
    {
        private readonly string _appSecret;
        private readonly string _apiUrl;
        private readonly HttpClient _client;
        private string _sessionToken;
        private CancellationTokenSource _heartbeatCts;

        public dynamic UserData { get; private set; }

        public AuthSys(string appSecret, string apiUrl = "http://localhost:8000/api/v1/client")
        {
            _appSecret = appSecret;
            _apiUrl = apiUrl;
            _client = new HttpClient();
        }

        public string GetHWID()
        {
            try
            {
                string hwidSource = "";
                if (OperatingSystem.IsWindows())
                {
                    using (var searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct"))
                    {
                        foreach (var obj in searcher.Get())
                        {
                            hwidSource += obj["UUID"].ToString();
                        }
                    }
                    using (var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard"))
                    {
                        foreach (var obj in searcher.Get())
                        {
                            hwidSource += obj["SerialNumber"].ToString();
                        }
                    }
                }
                else
                {
                    hwidSource = Environment.MachineName + Environment.UserName + Environment.ProcessorCount;
                }

                using (SHA256 sha256 = SHA256.Create())
                {
                    byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwidSource));
                    return BitConverter.ToString(bytes).Replace("-", "").ToLower();
                }
            }
            catch
            {
                return "fallback-" + Guid.NewGuid().ToString().Substring(0, 8);
            }
        }

        public async Task<(bool success, string message)> LoginAsync(string username, string password)
        {
            var payload = new
            {
                app_secret = _appSecret,
                username = username,
                password = password,
                hwid = GetHWID(),
                version = "1.0.0"
            };

            return await SendRequestAsync("login", payload);
        }

        public async Task<(bool success, string message)> LoginLicenseAsync(string key)
        {
            var payload = new
            {
                app_secret = _appSecret,
                key = key,
                hwid = GetHWID()
            };

            return await SendRequestAsync("login/license", payload);
        }

        private async Task<(bool success, string message)> SendRequestAsync(string endpoint, object payload)
        {
            try
            {
                var response = await _client.PostAsJsonAsync($"{_apiUrl}/{endpoint}", payload);
                var content = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<JsonElement>(content);

                if (response.IsSuccessStatusCode)
                {
                    _sessionToken = data.GetProperty("token").GetString();
                    UserData = data.GetProperty("user");
                    StartHeartbeat();
                    return (true, "Success");
                }

                string detail = data.TryGetProperty("detail", out var d) ? d.GetString() : "Unknown Error";
                return (false, detail);
            }
            catch (Exception ex)
            {
                return (false, $"SDK Error: {ex.Message}");
            }
        }

        private void StartHeartbeat()
        {
            _heartbeatCts?.Cancel();
            _heartbeatCts = new CancellationTokenSource();
            
            Task.Run(async () =>
            {
                while (!_heartbeatCts.Token.IsCancellationRequested)
                {
                    try
                    {
                        var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiUrl}/session/heartbeat");
                        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _sessionToken);
                        
                        var response = await _client.SendAsync(request);
                        if (!response.IsSuccessStatusCode) break;
                    }
                    catch { }
                    await Task.Delay(TimeSpan.FromSeconds(60), _heartbeatCts.Token);
                }
            }, _heartbeatCts.Token);
        }

        public async Task<string> GetVarAsync(string name)
        {
            if (string.IsNullOrEmpty(_sessionToken)) return null;
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_apiUrl}/vars/{name}");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _sessionToken);
                
                var response = await _client.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<JsonElement>();
                    return data.GetProperty("value").GetString();
                }
            }
            catch { }
            return null;
        }
    }
}
