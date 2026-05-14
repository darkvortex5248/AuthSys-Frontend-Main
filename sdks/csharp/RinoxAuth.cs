using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RinoxAuthSDK
{
    public class AuthException : Exception { public AuthException(string m) : base(m) {} }
    public class BannedException : Exception { public BannedException(string m) : base(m) {} }
    public class ExpiredException : Exception { public ExpiredException(string m) : base(m) {} }
    public class HWIDException : Exception { public HWIDException(string m) : base(m) {} }
    public class VersionException : Exception { public VersionException(string m) : base(m) {} }

    public class RinoxAuth
    {
        private string appSecret, apiUrl, hwid, token;
        private HttpClient client;

        public RinoxAuth(string appName, string appSecret, string apiUrl)
        {
            this.appSecret = appSecret;
            this.apiUrl = apiUrl.TrimEnd('/');
            this.client = new HttpClient();
            this.hwid = GenerateHWID();
        }

        private string GenerateHWID()
        {
            // Simplified MVP HWID
            return Environment.MachineName; 
        }

        private async Task<JsonDocument> PostAsync(string endpoint, object data)
        {
            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            if (token != null) client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
            var res = await client.PostAsync(apiUrl + endpoint, content);
            var resText = await res.Content.ReadAsStringAsync();
            
            if ((int)res.StatusCode == 403) {
                if (resText.Contains("HWID mismatch")) throw new HWIDException(resText);
                if (resText.Contains("banned")) throw new BannedException(resText);
                if (resText.Contains("expired")) throw new ExpiredException(resText);
            }
            if (!res.IsSuccessStatusCode) throw new AuthException(resText);
            
            return JsonDocument.Parse(resText);
        }

        public async Task<bool> Init(string version)
        {
            var res = await PostAsync("/client/init", new { app_name = "", app_secret = appSecret, version, hwid });
            if (res.RootElement.GetProperty("status").GetString() == "update_required") throw new VersionException(res.RootElement.GetProperty("message").GetString());
            return true;
        }

        public async Task<bool> Login(string username, string password)
        {
            var res = await PostAsync("/client/login", new { app_secret = appSecret, username, password, hwid });
            token = res.RootElement.GetProperty("token").GetString();
            return true;
        }

        public async Task<bool> Register(string username, string password, string licenseKey, string email = null)
        {
            await PostAsync("/client/register", new { app_secret = appSecret, username, password, license_key = licenseKey, email, hwid });
            return true;
        }
    }
}
