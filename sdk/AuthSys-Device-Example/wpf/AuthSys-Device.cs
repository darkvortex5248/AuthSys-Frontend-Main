using System;
using System.Net.Http;
using System.Text;
using System.Management;
using System.Threading.Tasks;
using System.Windows;

namespace AuthSysDevice
{
    public class Device
    {
        private readonly string _appSecret;
        private readonly string _baseUrl;
        private readonly HttpClient _client;

        public string LastError { get; private set; } = "";
        public string LastResponse { get; private set; } = "";

        public Device(string appSecret, string baseUrl = "https://authsys-main-production.up.railway.app/device")
        {
            _appSecret = appSecret;
            _baseUrl = baseUrl.TrimEnd('/');
            _client = new HttpClient();
            _client.Timeout = TimeSpan.FromSeconds(15);
        }

        private static string GetHWID()
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
                foreach (var obj in searcher.Get())
                {
                    if (obj["SerialNumber"] != null)
                        return obj["SerialNumber"].ToString().Trim();
                }
            }
            catch { }
            return "unknown";
        }

        public bool Check()
        {
            LastError = "";
            try
            {
                string hwid = GetHWID();
                string json = $"{{\"app_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\"}}";
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = _client.PostAsync($"{_baseUrl}/check", content).Result;
                LastResponse = response.Content.ReadAsStringAsync().Result;
                var obj = Newtonsoft.Json.Linq.JObject.Parse(LastResponse);
                if (obj["active"]?.Value<bool>() == true) return true;
                LastError = obj["message"]?.Value<string>() ?? "Device deactivated by admin";
                return false;
            }
            catch (Exception ex)
            {
                LastError = ex.Message;
                return false;
            }
        }

        public bool Register(string deviceName = "")
        {
            LastError = "";
            try
            {
                string hwid = GetHWID();
                string json = $"{{\"app_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\"";
                if (!string.IsNullOrEmpty(deviceName))
                    json += $",\"device_name\":\"{deviceName}\"";
                json += "}";
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = _client.PostAsync($"{_baseUrl}/register", content).Result;
                LastResponse = response.Content.ReadAsStringAsync().Result;
                var obj = Newtonsoft.Json.Linq.JObject.Parse(LastResponse);
                return obj["active"]?.Value<bool>() == true;
            }
            catch (Exception ex)
            {
                LastError = ex.Message;
                return false;
            }
        }
    }
}
