using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace AuthSys
{
    public class AuthSysException : Exception
    {
        public int statusCode;
        public string errorCode;

        public AuthSysException(string message, int statusCode = 0, string errorCode = "")
            : base(message)
        {
            this.statusCode = statusCode;
            this.errorCode = errorCode;
        }
    }

    [Serializable]
    public class AuthSysOptions
    {
        public string appSecret;
        public string appName;
        public string version;
        public string apiUrl;
        public int timeout;
        public int maxRetries;
        public bool skipCertificateValidation;
        public bool enableLogging;

        public AuthSysOptions(string appSecret)
        {
            this.appSecret = appSecret;
            this.appName = "";
            this.version = "";
            this.apiUrl = "https://api.authsys.dpdns.org/api/v1";
            this.timeout = 30;
            this.maxRetries = 3;
            this.skipCertificateValidation = false;
            this.enableLogging = false;
        }
    }

    public class AuthSys
    {
        private AuthSysOptions _options;
        private string _sessionToken = "";
        private bool _initialized = false;
        private Dictionary<string, object> _appVariables = new Dictionary<string, object>();
        private string _username = "";

        public AuthSys(AuthSysOptions options)
        {
            _options = options;
        }

        public AuthSys(string appSecret)
        {
            _options = new AuthSysOptions(appSecret);
        }

        private void Log(string message)
        {
            if (_options.enableLogging)
            {
                Debug.Log($"[AuthSys] {message}");
            }
        }

        private IEnumerator SendRequest(string endpoint, string jsonPayload, Dictionary<string, string> headers,
            Action<string, int, string> onComplete)
        {
            string url = $"{_options.apiUrl}/client/{endpoint}";
            string lastError = null;

            for (int attempt = 0; attempt <= _options.maxRetries; attempt++)
            {
                Log($"POST {url} (attempt {attempt + 1})");

                UnityWebRequest request = new UnityWebRequest(url, "POST");
                if (!string.IsNullOrEmpty(jsonPayload))
                {
                    byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonPayload);
                    request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                }
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Accept", "application/json");

                if (headers != null)
                {
                    foreach (var h in headers)
                    {
                        request.SetRequestHeader(h.Key, h.Value);
                    }
                }

                request.timeout = _options.timeout;

                yield return request.SendWebRequest();

                string responseBody = request.downloadHandler.text;
                int statusCode = (int)request.responseCode;
                Log($"Response: {statusCode} - {responseBody}");

                if (request.result != UnityWebRequest.Result.Success && statusCode == 0)
                {
                    lastError = request.error;
                    Log($"Request error (attempt {attempt + 1}): {lastError}");
                    if (attempt < _options.maxRetries)
                    {
                        yield return new WaitForSeconds((float)Math.Pow(2, attempt));
                    }
                    continue;
                }

                if (statusCode < 200 || statusCode >= 300)
                {
                    string errorCode = "api_error";
                    switch (statusCode)
                    {
                        case 401: errorCode = "unauthorized"; break;
                        case 403: errorCode = "forbidden"; break;
                        case 404: errorCode = "not_found"; break;
                        case 429: errorCode = "rate_limited"; break;
                        case 503: errorCode = "maintenance"; break;
                    }
                    onComplete(responseBody, statusCode, errorCode);
                    yield break;
                }

                onComplete(responseBody, statusCode, "success");
                yield break;
            }

            onComplete(lastError ?? "Request failed after all retries", 0, "network_error");
        }

        private string Escape(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\")
                    .Replace("\"", "\\\"")
                    .Replace("\n", "\\n")
                    .Replace("\r", "\\r")
                    .Replace("\t", "\\t");
        }

        public void Init(Action<bool, string> onComplete)
        {
            Log("Initializing...");
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"version\":\"{Escape(_options.version)}\",\"app_name\":\"{Escape(_options.appName)}\",\"hwid\":\"{GetHwid()}\"}}";

            MonoBehaviour mono = new GameObject().AddComponent<AuthSysRunner>();
            mono.StartCoroutine(mono.StartCoroutine(SendRequest("init", json, null, (response, code, error) =>
            {
                if (error != "success")
                {
                    onComplete(false, response);
                    return;
                }

                if (response.Contains("\"update_required\""))
                {
                    onComplete(false, "Update required");
                    return;
                }

                _initialized = response.Contains("\"success\"") || response.Contains("\"update_available\"");
                onComplete(_initialized, response);
            })));
        }

        public void Register(string username, string password, string licenseKey, string email, Action<string, int, string> onComplete)
        {
            if (!_initialized)
            {
                onComplete("Not initialized", 0, "not_initialized");
                return;
            }

            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"username\":\"{Escape(username)}\",\"password\":\"{Escape(password)}\",\"license_key\":\"{Escape(licenseKey)}\",\"hwid\":\"{GetHwid()}\"}}";
            if (!string.IsNullOrEmpty(email))
            {
                json = json.Substring(0, json.Length - 1) + $",\"email\":\"{Escape(email)}\"}}";
            }

            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("register", json, null, onComplete));
        }

        public void Login(string username, string password, int sessionLength, Action<string, int, string> onComplete)
        {
            if (!_initialized)
            {
                onComplete("Not initialized", 0, "not_initialized");
                return;
            }

            _sessionToken = "";
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"username\":\"{Escape(username)}\",\"password\":\"{Escape(password)}\",\"hwid\":\"{GetHwid()}\",\"session_length\":{sessionLength}}}";

            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("login", json, null, (response, code, error) =>
            {
                if (error == "success")
                {
                    var tokenMatch = System.Text.RegularExpressions.Regex.Match(response, "\"token\":\"([^\"]+)\"");
                    if (tokenMatch.Success)
                    {
                        _sessionToken = tokenMatch.Groups[1].Value;
                    }
                }
                onComplete(response, code, error);
            }));
        }

        public void LicenseLogin(string licenseKey, int sessionLength, Action<string, int, string> onComplete)
        {
            if (!_initialized)
            {
                onComplete("Not initialized", 0, "not_initialized");
                return;
            }

            _sessionToken = "";
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"license_key\":\"{Escape(licenseKey)}\",\"hwid\":\"{GetHwid()}\",\"session_length\":{sessionLength}}}";

            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("license-login", json, null, (response, code, error) =>
            {
                if (error == "success")
                {
                    var tokenMatch = System.Text.RegularExpressions.Regex.Match(response, "\"token\":\"([^\"]+)\"");
                    if (tokenMatch.Success)
                    {
                        _sessionToken = tokenMatch.Groups[1].Value;
                    }
                }
                onComplete(response, code, error);
            }));
        }

        public void LicenseCheck(string licenseKey, Action<string, int, string> onComplete)
        {
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"license_key\":\"{Escape(licenseKey)}\"}}";
            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("license/check", json, null, onComplete));
        }

        public void Verify(Action<string, int, string> onComplete)
        {
            if (string.IsNullOrEmpty(_sessionToken))
            {
                onComplete("No active session", 0, "no_session");
                return;
            }

            var headers = new Dictionary<string, string>
            {
                {"Authorization", $"Bearer {_sessionToken}"},
                {"X-HWID", GetHwid()}
            };

            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("verify", null, headers, onComplete));
        }

        public void SendChatMessage(int roomId, string message, Action<string, int, string> onComplete)
        {
            if (string.IsNullOrEmpty(_sessionToken))
            {
                onComplete("No active session", 0, "no_session");
                return;
            }

            var headers = new Dictionary<string, string>
            {
                {"Authorization", $"Bearer {_sessionToken}"},
                {"X-HWID", GetHwid()}
            };

            string endpoint = $"chat/send?room_id={roomId}&message={UnityWebRequest.EscapeURL(message)}";
            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest(endpoint, null, headers, onComplete));
        }

        public void RegisterDevice(string hwid, string deviceName, Action<string, int, string> onComplete)
        {
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"hwid\":\"{Escape(hwid)}\"}}";
            if (!string.IsNullOrEmpty(deviceName))
            {
                json = json.Substring(0, json.Length - 1) + $",\"device_name\":\"{Escape(deviceName)}\"}}";
            }

            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("device/register", json, null, onComplete));
        }

        public void CheckDevice(string hwid, Action<string, int, string> onComplete)
        {
            string json = $"{{\"app_secret\":\"{Escape(_options.appSecret)}\",\"hwid\":\"{Escape(hwid)}\"}}";
            var runner = new GameObject().AddComponent<AuthSysRunner>();
            runner.StartCoroutine(SendRequest("device/check", json, null, onComplete));
        }

        public object GetVariable(string key)
        {
            return _appVariables.ContainsKey(key) ? _appVariables[key] : null;
        }

        public Dictionary<string, object> GetAllVariables()
        {
            return _appVariables;
        }

        public void Logout()
        {
            _sessionToken = "";
        }

        public bool IsAuthenticated => !string.IsNullOrEmpty(_sessionToken);
        public bool IsInitialized => _initialized;
        public string GetUsername() => _username;

        public static string GetHwid()
        {
            return SystemInfo.deviceUniqueIdentifier;
        }
    }

    public class AuthSysRunner : MonoBehaviour
    {
        public void OnDestroy()
        {
            Destroy(gameObject);
        }
    }
}
