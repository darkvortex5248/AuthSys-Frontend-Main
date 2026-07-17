using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace AuthSysDevice
{
    public class Device : MonoBehaviour
    {
        private readonly string _appSecret;
        private readonly string _baseUrl;

        public string LastError { get; private set; } = "";
        public string LastResponse { get; private set; } = "";

        public Device(string appSecret, string baseUrl = "https://authsys-main-production.up.railway.app/device")
        {
            _appSecret = appSecret;
            _baseUrl = baseUrl.TrimEnd('/');
        }

        private static string GetHWID()
        {
            try
            {
                return SystemInfo.deviceUniqueIdentifier;
            }
            catch
            {
                return "unknown";
            }
        }

        public IEnumerator Check(Action<bool> callback)
        {
            LastError = "";
            string hwid = GetHWID();
            string json = $"{{\"app_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\"}}";

            using (UnityWebRequest req = new UnityWebRequest(
                $"{_baseUrl}/check", "POST"))
            {
                byte[] body = Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(body);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 15;

                yield return req.SendWebRequest();

                LastResponse = req.downloadHandler?.text ?? "";
                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        var data = JsonUtility.FromJson<DeviceResponse>(LastResponse);
                        if (data.active)
                        {
                            callback?.Invoke(true);
                            yield break;
                        }
                        LastError = string.IsNullOrEmpty(data.message)
                            ? "Device deactivated by admin" : data.message;
                    }
                    catch { LastError = "Failed to parse response"; }
                }
                else
                {
                    LastError = req.error;
                }
                callback?.Invoke(false);
            }
        }

        public IEnumerator Register(string deviceName, Action<bool> callback)
        {
            LastError = "";
            string hwid = GetHWID();
            string json = $"{{\"app_secret\":\"{_appSecret}\",\"hwid\":\"{hwid}\"";
            if (!string.IsNullOrEmpty(deviceName))
                json += $",\"device_name\":\"{deviceName}\"";
            json += "}";

            using (UnityWebRequest req = new UnityWebRequest(
                $"{_baseUrl}/register", "POST"))
            {
                byte[] body = Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(body);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 15;

                yield return req.SendWebRequest();

                LastResponse = req.downloadHandler?.text ?? "";
                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        var data = JsonUtility.FromJson<DeviceResponse>(LastResponse);
                        callback?.Invoke(data.active);
                        yield break;
                    }
                    catch { }
                }
                LastError = req.error;
                callback?.Invoke(false);
            }
        }

        [Serializable]
        private class DeviceResponse
        {
            public bool active;
            public string message;
            public int device_id;
        }
    }
}
