using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace AuthSys
{
    public class AuthSysClient
    {
        private string _appSecret;
        private string _version;
        private string _apiUrl;

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
        }

        private string GetHWID()
        {
            try
            {
                return SystemInfo.deviceUniqueIdentifier;
            }
            catch
            {
                return "UNITY_FALLBACK_" + Application.productName;
            }
        }

        private string GetJson(string key, string json)
        {
            try
            {
                var doc = new JSONObject(json);
                if (doc.HasField(key))
                {
                    var val = doc[key];
                    if (val.IsString) return val.str;
                    return val.ToString();
                }
            }
            catch { }
            return "";
        }

        public IEnumerator InitAsync(string appName, Action<bool> callback)
        {
            LastError = "";
            LastResponse = "";
            Initialized = false;

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"version\":\"{_version}\",\"hwid\":\"{GetHWID()}\",\"app_name\":\"{appName}\"}}";
            yield return PostAsync("init", json, null, (response) =>
            {
                LastResponse = response;
                var status = GetJson("status", response);
                if (status == "success" || status == "update_available")
                {
                    Initialized = true;
                    callback(true);
                }
                else
                {
                    LastError = GetJson("detail", response);
                    if (string.IsNullOrEmpty(LastError)) LastError = "Init failed";
                    callback(false);
                }
            });
        }

        public IEnumerator LoginAsync(string username, string password, Action<bool> callback, int sessionLength = 86400)
        {
            SessionToken = null;
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}";
            yield return PostAsync("login", json, null, (response) =>
            {
                LastResponse = response;
                var detail = GetJson("detail", response);
                if (!string.IsNullOrEmpty(detail)) { LastError = detail; callback(false); return; }

                var success = GetJson("success", response);
                if (success == "true")
                {
                    SessionToken = GetJson("token", response);
                    Username = username;
                    Email = GetJson("email", response);
                    callback(true);
                }
                else
                {
                    LastError = "Login failed";
                    callback(false);
                }
            });
        }

        public IEnumerator RegisterAsync(string username, string password, string licenseKey, Action<bool> callback, string email = "")
        {
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"username\":\"{username}\",\"password\":\"{password}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\"";
            if (!string.IsNullOrEmpty(email)) json += $",\"email\":\"{email}\"";
            json += "}";

            yield return PostAsync("register", json, null, (response) =>
            {
                LastResponse = response;
                var detail = GetJson("detail", response);
                if (!string.IsNullOrEmpty(detail)) { LastError = detail; callback(false); return; }

                var success = GetJson("success", response);
                if (success == "true") callback(true);
                else { LastError = "Registration failed"; callback(false); }
            });
        }

        public IEnumerator LicenseLoginAsync(string licenseKey, Action<bool> callback, int sessionLength = 86400)
        {
            SessionToken = null;
            LastError = "";
            LastResponse = "";

            var json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\",\"hwid\":\"{GetHWID()}\",\"session_length\":{sessionLength}}}";
            yield return PostAsync("license_login", json, null, (response) =>
            {
                LastResponse = response;
                var detail = GetJson("detail", response);
                if (!string.IsNullOrEmpty(detail)) { LastError = detail; callback(false); return; }

                var success = GetJson("success", response);
                if (success == "true")
                {
                    SessionToken = GetJson("token", response);
                    Username = GetJson("username", response);
                    callback(true);
                }
                else
                {
                    LastError = "License login failed";
                    callback(false);
                }
            });
        }

        public IEnumerator LicenseCheckAsync(string licenseKey, Action<bool> callback)
        {
            LastError = "";
            LastResponse = "";
            var json = $"{{\"app_secret\":\"{_appSecret}\",\"license_key\":\"{licenseKey}\"}}";
            yield return PostAsync("license/check", json, null, (response) =>
            {
                LastResponse = response;
                callback(true);
            });
        }

        public IEnumerator VerifyAsync(Action<bool> callback)
        {
            LastError = "";
            LastResponse = "";
            if (string.IsNullOrEmpty(SessionToken)) { LastError = "No active session"; callback(false); yield break; }
            yield return PostAsync("verify", "{}", SessionToken, (response) =>
            {
                LastResponse = response;
                callback(true);
            });
        }

        public IEnumerator ChatSendAsync(int roomId, string message, Action<bool> callback)
        {
            LastError = "";
            LastResponse = "";
            var endpoint = $"chat/send?room_id={roomId}&message={UnityEngine.Networking.UnityWebRequest.EscapeURL(message)}";
            yield return PostAsync(endpoint, "{}", SessionToken, (response) =>
            {
                LastResponse = response;
                callback(true);
            });
        }

        private IEnumerator PostAsync(string endpoint, string jsonBody, string token, Action<string> callback)
        {
            var url = $"{_apiUrl}/client/{endpoint}";
            using (var req = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
                req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");

                if (!string.IsNullOrEmpty(token))
                {
                    req.SetRequestHeader("Authorization", "Bearer " + token);
                    req.SetRequestHeader("X-HWID", GetHWID());
                }

                req.timeout = 30;
                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    callback(req.downloadHandler.text);
                }
                else
                {
                    callback($"{{\"success\":false,\"detail\":\"{req.error}\"}}");
                }
            }
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
