import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class AuthSys {
    public static class AuthSysException extends Exception {
        public int statusCode;
        public String errorCode;

        public AuthSysException(String message, int statusCode, String errorCode) {
            super(message);
            this.statusCode = statusCode;
            this.errorCode = errorCode;
        }
    }

    public static class Options {
        public String appSecret;
        public String appName;
        public String version;
        public String apiUrl;
        public int timeout;
        public int maxRetries;
        public boolean skipCertificateValidation;
        public boolean enableLogging;

        public Options(String appSecret) {
            this.appSecret = appSecret;
            this.appName = "";
            this.version = "";
            this.apiUrl = "https://api.authsys.dpdns.org/api/v1";
            this.timeout = 30000;
            this.maxRetries = 3;
            this.skipCertificateValidation = false;
            this.enableLogging = false;
        }
    }

    private final Options _options;
    private String _sessionToken = "";
    private boolean _initialized = false;
    private final Map<String, Object> _appVariables = new HashMap<>();
    private String _username = "";

    public AuthSys(Options options) {
        this._options = options;
    }

    public AuthSys(String appSecret) {
        this._options = new Options(appSecret);
    }

    private void log(String message) {
        if (_options.enableLogging) {
            System.out.println("[AuthSys] " + message);
        }
    }

    private String sendRequest(String endpoint, String jsonPayload, Map<String, String> headers) throws AuthSysException {
        String url = _options.apiUrl + "/client/" + endpoint;
        String lastError = null;

        for (int attempt = 0; attempt <= _options.maxRetries; attempt++) {
            try {
                log("POST " + url + " (attempt " + (attempt + 1) + ")");
                URL urlObj = new URL(url);
                HttpURLConnection conn = (HttpURLConnection) urlObj.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setConnectTimeout(_options.timeout);
                conn.setReadTimeout(_options.timeout);

                if (headers != null) {
                    for (Map.Entry<String, String> h : headers.entrySet()) {
                        conn.setRequestProperty(h.getKey(), h.getValue());
                    }
                }

                if (jsonPayload != null && !jsonPayload.isEmpty()) {
                    conn.setDoOutput(true);
                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }
                }

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(), "utf-8"));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                String responseBody = response.toString();
                log("Response: " + code + " - " + responseBody);

                if (code < 200 || code >= 300) {
                    handleHttpError(code, responseBody);
                }

                return responseBody;
            } catch (AuthSysException e) {
                throw e;
            } catch (Exception e) {
                lastError = e.getMessage();
                log("Request error (attempt " + (attempt + 1) + "): " + lastError);
                if (attempt < _options.maxRetries) {
                    try { Thread.sleep((long) Math.pow(2, attempt) * 1000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }

        throw new AuthSysException(lastError != null ? lastError : "Request failed after all retries", 0, "network_error");
    }

    private void handleHttpError(int statusCode, String responseBody) throws AuthSysException {
        String detail = responseBody;
        String errorCode = "api_error";

        switch (statusCode) {
            case 401: errorCode = "unauthorized"; break;
            case 403: errorCode = "forbidden"; break;
            case 404: errorCode = "not_found"; break;
            case 429: errorCode = "rate_limited"; break;
            case 503: errorCode = "maintenance"; break;
        }

        throw new AuthSysException(detail, statusCode, errorCode);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public void init() throws AuthSysException {
        log("Initializing...");
        String json = String.format(
            "{\"app_secret\":\"%s\",\"version\":\"%s\",\"app_name\":\"%s\",\"hwid\":\"%s\"}",
            escape(_options.appSecret), escape(_options.version), escape(_options.appName), escape(AuthSysHelper.getHwid())
        );

        String res = sendRequest("init", json, null);
        String status = AuthSysHelper.jsonGet(res, "status");

        if (status.equals("update_required")) {
            throw new AuthSysException(AuthSysHelper.jsonGet(res, "message"), 0, "version_mismatch");
        }

        _initialized = status.equals("success") || status.equals("update_available");
        String varsRaw = AuthSysHelper.jsonGet(res, "variables");
        if (!varsRaw.isEmpty()) {
            _appVariables.putAll(AuthSysHelper.parseVariables(varsRaw));
        }
    }

    public String register(String username, String password, String licenseKey) throws AuthSysException {
        return register(username, password, licenseKey, null);
    }

    public String register(String username, String password, String licenseKey, String email) throws AuthSysException {
        if (!_initialized) {
            throw new AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
        }

        String json = String.format(
            "{\"app_secret\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"license_key\":\"%s\",\"hwid\":\"%s\"",
            escape(_options.appSecret), escape(username), escape(password), escape(licenseKey), escape(AuthSysHelper.getHwid())
        );
        if (email != null && !email.isEmpty()) {
            json += ",\"email\":\"" + escape(email) + "\"";
        }
        json += "}";

        return sendRequest("register", json, null);
    }

    public String login(String username, String password) throws AuthSysException {
        return login(username, password, 86400);
    }

    public String login(String username, String password, int sessionLength) throws AuthSysException {
        if (!_initialized) {
            throw new AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
        }

        _sessionToken = "";
        String json = String.format(
            "{\"app_secret\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"hwid\":\"%s\",\"session_length\":%d}",
            escape(_options.appSecret), escape(username), escape(password), escape(AuthSysHelper.getHwid()), sessionLength
        );

        String res = sendRequest("login", json, null);
        String token = AuthSysHelper.jsonGet(res, "token");
        if (!token.isEmpty()) {
            _sessionToken = token;
            _username = AuthSysHelper.jsonGet(res, "username");
        }
        return res;
    }

    public String licenseLogin(String licenseKey) throws AuthSysException {
        return licenseLogin(licenseKey, 86400);
    }

    public String licenseLogin(String licenseKey, int sessionLength) throws AuthSysException {
        if (!_initialized) {
            throw new AuthSysException("Not initialized. Call init() first.", 0, "not_initialized");
        }

        _sessionToken = "";
        String json = String.format(
            "{\"app_secret\":\"%s\",\"license_key\":\"%s\",\"hwid\":\"%s\",\"session_length\":%d}",
            escape(_options.appSecret), escape(licenseKey), escape(AuthSysHelper.getHwid()), sessionLength
        );

        String res = sendRequest("license-login", json, null);
        String token = AuthSysHelper.jsonGet(res, "token");
        if (!token.isEmpty()) {
            _sessionToken = token;
            _username = AuthSysHelper.jsonGet(res, "username");
        }
        return res;
    }

    public String licenseCheck(String licenseKey) throws AuthSysException {
        String json = String.format(
            "{\"app_secret\":\"%s\",\"license_key\":\"%s\"}",
            escape(_options.appSecret), escape(licenseKey)
        );
        return sendRequest("license/check", json, null);
    }

    public String verify() throws AuthSysException {
        if (_sessionToken.isEmpty()) {
            throw new AuthSysException("No active session. Login first.", 0, "no_session");
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + _sessionToken);
        headers.put("X-HWID", AuthSysHelper.getHwid());

        return sendRequest("verify", null, headers);
    }

    public String sendChatMessage(int roomId, String message) throws AuthSysException {
        if (_sessionToken.isEmpty()) {
            throw new AuthSysException("No active session. Login first.", 0, "no_session");
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + _sessionToken);
        headers.put("X-HWID", AuthSysHelper.getHwid());

        try {
            String encoded = URLEncoder.encode(message, "UTF-8");
            return sendRequest("chat/send?room_id=" + roomId + "&message=" + encoded, null, headers);
        } catch (Exception e) {
            throw new AuthSysException("Failed to encode message: " + e.getMessage(), 0, "encoding_error");
        }
    }

    public String registerDevice(String hwid, String deviceName) throws AuthSysException {
        String json = String.format(
            "{\"app_secret\":\"%s\",\"hwid\":\"%s\"}",
            escape(_options.appSecret), escape(hwid)
        );
        if (deviceName != null && !deviceName.isEmpty()) {
            json = json.replace("}", ",\"device_name\":\"" + escape(deviceName) + "\"}");
        }
        return sendRequest("device/register", json, null);
    }

    public String checkDevice(String hwid) throws AuthSysException {
        String json = String.format(
            "{\"app_secret\":\"%s\",\"hwid\":\"%s\"}",
            escape(_options.appSecret), escape(hwid)
        );
        return sendRequest("device/check", json, null);
    }

    public Object getVariable(String key) {
        return _appVariables.get(key);
    }

    public Map<String, Object> getAllVariables() {
        return _appVariables;
    }

    public void logout() {
        _sessionToken = "";
    }

    public boolean isAuthenticated() {
        return !_sessionToken.isEmpty();
    }

    public boolean isInitialized() {
        return _initialized;
    }

    public String getUsername() {
        return _username;
    }
}
