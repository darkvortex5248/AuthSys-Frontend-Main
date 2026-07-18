import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class AuthSys {
    public String name;
    public String ownerid;
    public String secret;
    public String version;
    public String apiUrl;

    public boolean initialized = false;
    public String sessionToken = null;
    public String lastError = "";
    public String lastResponse = "";
    public java.util.Map<String, String> appData = new java.util.HashMap<>();

    public AuthSys(String name, String ownerid, String secret, String version) {
        this(name, ownerid, secret, version, "https://authsys-main-production.up.railway.app/api/v1");
    }

    public AuthSys(String name, String ownerid, String secret, String version, String apiUrl) {
        this.name = name;
        this.ownerid = ownerid;
        this.secret = secret;
        this.version = version;
        this.apiUrl = apiUrl.replaceAll("/+$", "");
    }

    public String getHWID() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                Process process = Runtime.getRuntime().exec(new String[]{"wmic", "csproduct", "get", "uuid"});
                process.getOutputStream().close();
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                StringBuilder output = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
                String result = output.toString().replace("UUID", "").trim();
                return result.isEmpty() ? "UNKNOWN_HWID" : result;
            } else if (os.contains("linux")) {
                Process process = Runtime.getRuntime().exec(new String[]{"cat", "/etc/machine-id"});
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line = reader.readLine();
                return line != null ? line.trim() : "UNKNOWN_HWID";
            } else if (os.contains("mac")) {
                Process process = Runtime.getRuntime().exec(new String[]{"ioreg", "-rd1", "-c", "IOPlatformExpertDevice"});
                process.getOutputStream().close();
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("IOPlatformUUID")) {
                        String[] parts = line.split("\"");
                        if (parts.length >= 4) return parts[3];
                    }
                }
            }
        } catch (Exception e) {}
        return "UNKNOWN_JAVA_HWID";
    }

    private String postRequest(String endpoint, String jsonPayload) {
        return postRequest(endpoint, jsonPayload, null);
    }

    private String postRequest(String endpoint, String jsonPayload, java.util.Map<String, String> headers) {
        lastResponse = "";
        lastError = "";
        try {
            URL url = new URL(this.apiUrl + "/client/" + endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);

            if (headers != null) {
                for (java.util.Map.Entry<String, String> h : headers.entrySet()) {
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
            lastResponse = response.toString();
            return lastResponse;
        } catch (Exception e) {
            lastError = e.getMessage();
            lastResponse = "{\"success\":false,\"detail\":\"" + e.getMessage() + "\"}";
            return lastResponse;
        }
    }

    private String escape(String s) {
        return (s == null ? "" : s)
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }

    private String jsonGet(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) {
            search = "\"" + key + "\":";
            start = json.indexOf(search);
            if (start == -1) return "";
            start = start + search.length();
            int end = json.indexOf(",", start);
            if (end == -1) end = json.indexOf("}", start);
            if (end == -1) return json.substring(start).trim();
            return json.substring(start, end).trim();
        }
        start += search.length();
        int end = json.indexOf("\"", start);
        return end == -1 ? json.substring(start) : json.substring(start, end);
    }

    private boolean jsonGetBool(String json, String key) {
        return jsonGet(json, key).equals("true");
    }

    private boolean hasKey(String json, String key) {
        return json.contains("\"" + key + "\":");
    }

    public void init() {
        lastError = "";
        lastResponse = "";
        initialized = false;

        String json = String.format(
            "{\"app_secret\":\"%s\",\"version\":\"%s\",\"app_name\":\"%s\",\"hwid\":\"%s\"}",
            escape(secret), escape(version), escape(name), escape(getHWID())
        );
        String res = postRequest("init", json);
        String status = jsonGet(res, "status");

        if (status.equals("success") || status.equals("update_available")) {
            this.initialized = true;
            String varsRaw = jsonGet(res, "variables");
            if (!varsRaw.isEmpty()) {
                try {
                    String varsStr = res.replaceAll(".*\"variables\":\\{?", "").replaceAll("\\}.*", "");
                    for (String pair : varsStr.split(",")) {
                        String[] kv = pair.split(":");
                        if (kv.length == 2) {
                            String k = kv[0].replaceAll("[\"{} ]", "");
                            String v = kv[1].replaceAll("[\" ]", "");
                            appData.put(k, v);
                        }
                    }
                } catch (Exception e) { }
            }
        } else {
            String detail = jsonGet(res, "detail");
            lastError = detail.isEmpty() ? "Init failed" : detail;
        }
    }

    public void register(String username, String password, String licenseKey) {
        register(username, password, licenseKey, null);
    }

    public void register(String username, String password, String licenseKey, String email) {
        lastError = "";
        lastResponse = "";
        if (!initialized) {
            lastError = "init() failed or not called";
            return;
        }

        String json = String.format(
            "{\"app_secret\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"license_key\":\"%s\",\"hwid\":\"%s\"",
            escape(secret), escape(username), escape(password), escape(licenseKey), escape(getHWID())
        );
        if (email != null && !email.isEmpty()) {
            json += ",\"email\":\"" + escape(email) + "\"";
        }
        json += "}";

        String res = postRequest("register", json);

        if (hasKey(res, "detail")) {
            lastError = jsonGet(res, "detail");
        } else if (!jsonGetBool(res, "success")) {
            lastError = "Registration failed";
        }
    }

    public void login(String username, String password) {
        login(username, password, 86400);
    }

    public void login(String username, String password, int sessionLength) {
        lastError = "";
        lastResponse = "";
        sessionToken = null;
        if (!initialized) {
            lastError = "init() failed or not called";
            return;
        }

        String json = String.format(
            "{\"app_secret\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"hwid\":\"%s\",\"session_length\":%d}",
            escape(secret), escape(username), escape(password), escape(getHWID()), sessionLength
        );
        String res = postRequest("login", json);

        if (hasKey(res, "detail")) {
            lastError = jsonGet(res, "detail");
        } else if (jsonGetBool(res, "success")) {
            String token = jsonGet(res, "token");
            if (!token.isEmpty()) sessionToken = token;
        } else {
            lastError = "Login failed: server returned success=false";
        }
    }

    public void licenseLogin(String licenseKey) {
        licenseLogin(licenseKey, 86400);
    }

    public void licenseLogin(String licenseKey, int sessionLength) {
        lastError = "";
        lastResponse = "";
        sessionToken = null;
        if (!initialized) {
            lastError = "init() failed or not called";
            return;
        }

        String json = String.format(
            "{\"app_secret\":\"%s\",\"license_key\":\"%s\",\"hwid\":\"%s\",\"session_length\":%d}",
            escape(secret), escape(licenseKey), escape(getHWID()), sessionLength
        );
        String res = postRequest("license-login", json);

        if (hasKey(res, "detail")) {
            lastError = jsonGet(res, "detail");
        } else if (jsonGetBool(res, "success")) {
            String token = jsonGet(res, "token");
            if (!token.isEmpty()) sessionToken = token;
        } else {
            lastError = "License login failed: server returned success=false";
        }
    }

    public void licenseCheck(String licenseKey) {
        lastError = "";
        lastResponse = "";
        String json = String.format(
            "{\"app_secret\":\"%s\",\"license_key\":\"%s\"}",
            escape(secret), escape(licenseKey)
        );
        postRequest("license/check", json);
        if (hasKey(lastResponse, "detail")) {
            lastError = jsonGet(lastResponse, "detail");
        }
    }

    public void verify() {
        lastError = "";
        lastResponse = "";
        if (sessionToken == null || sessionToken.isEmpty()) {
            lastError = "No active session. Login first.";
            return;
        }

        java.util.Map<String, String> headers = new java.util.HashMap<>();
        headers.put("Authorization", "Bearer " + sessionToken);
        headers.put("X-HWID", getHWID());

        postRequest("verify", null, headers);

        if (hasKey(lastResponse, "detail")) {
            lastError = jsonGet(lastResponse, "detail");
        } else if (!jsonGetBool(lastResponse, "valid")) {
            lastError = "Session verification failed";
        }
    }

    public void chatSend(int roomId, String message) {
        lastError = "";
        lastResponse = "";
        if (sessionToken == null || sessionToken.isEmpty()) {
            lastError = "No active session. Login first.";
            return;
        }

        java.util.Map<String, String> headers = new java.util.HashMap<>();
        headers.put("Authorization", "Bearer " + sessionToken);

        try {
            String encoded = URLEncoder.encode(message, "UTF-8");
            postRequest("chat/send?room_id=" + roomId + "&message=" + encoded, null, headers);
        } catch (Exception e) {
            lastError = "Failed to encode message: " + e.getMessage();
            return;
        }

        if (hasKey(lastResponse, "detail")) {
            lastError = jsonGet(lastResponse, "detail");
        }
    }

    public String var(String name) {
        return appData.getOrDefault(name, null);
    }

    public void logout() {
        sessionToken = null;
    }
}
