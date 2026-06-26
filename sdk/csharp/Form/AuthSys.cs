using System;
using System.Diagnostics;
using System.Management;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AuthSys
{
    public class api
    {
        public string name, ownerid, secret, version, apiUrl;
        public string sessionid;
        public bool initialized;

        public class AppData
        {
            public JsonElement variables { get; set; }
        }

        public AppData app_data = new AppData();
        public JsonElement user_data;

        public class ResponseStructure
        {
            public string status { get; set; }
            public string message { get; set; }
            public string detail { get; set; }
            public string access_token { get; set; }
            public JsonElement variables { get; set; }
            public JsonElement user { get; set; }
        }

        public ResponseStructure response = new ResponseStructure();
        private static readonly HttpClient client = new HttpClient();

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

        private ResponseStructure PostRequest(string endpoint, object data)
        {
            try
            {
                string json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var result = client.PostAsync($"{apiUrl}/client/{endpoint}", content).Result;
                var resultString = result.Content.ReadAsStringAsync().Result;
                
                return JsonSerializer.Deserialize<ResponseStructure>(resultString);
            }
            catch (Exception ex)
            {
                return new ResponseStructure { status = "error", detail = ex.Message };
            }
        }

        public void init()
        {
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
        }

        public void register(string username, string password, string license_key, string email = "")
        {
            if (!initialized)
            {
                response = new ResponseStructure { status = "error", detail = "Please initialize first" };
                return;
            }

            var data = new
            {
                app_secret = this.secret,
                username = username,
                password = password,
                license_key = license_key,
                email = string.IsNullOrEmpty(email) ? null : email,
                hwid = GetHWID()
            };

            response = PostRequest("register", data);
            
            if (!string.IsNullOrEmpty(response.access_token) || response.message == "User registered successfully")
            {
                user_data = response.user;
            }
        }

        public void login(string username, string password)
        {
            if (!initialized) return;

            var data = new
            {
                app_secret = this.secret,
                username = username,
                password = password,
                hwid = GetHWID()
            };

            response = PostRequest("login", data);

            if (!string.IsNullOrEmpty(response.access_token))
            {
                sessionid = response.access_token;
                user_data = response.user;
            }
        }

        public void license(string key)
        {
            if (!initialized) return;

            var data = new
            {
                app_secret = this.secret,
                license_key = key,
                hwid = GetHWID()
            };

            response = PostRequest("license_login", data);

            if (!string.IsNullOrEmpty(response.access_token))
            {
                sessionid = response.access_token;
                user_data = response.user;
            }
        }

        public string var(string varName)
        {
            if (!initialized) return null;

            try
            {
                if (app_data.variables.ValueKind != JsonValueKind.Undefined && app_data.variables.TryGetProperty(varName, out JsonElement el))
                {
                    return el.GetString();
                }
            }
            catch { }
            return null;
        }
    }
}
