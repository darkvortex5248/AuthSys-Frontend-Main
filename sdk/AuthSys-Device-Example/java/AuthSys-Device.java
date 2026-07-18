import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Scanner;

public class AuthSysDevice {

    private final String appSecret;
    private final String baseUrl;
    public String lastError = "";
    public String lastResponse = "";

    public AuthSysDevice(String appSecret) {
        this(appSecret, "https://authsys-main-production.up.railway.app/device");
    }

    public AuthSysDevice(String appSecret, String baseUrl) {
        this.appSecret = appSecret;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
    }

    private static String getHWID() {
        try {
            StringBuilder raw = new StringBuilder();
            raw.append(java.net.InetAddress.getLocalHost().getHostName());
            raw.append(System.getProperty("os.name"));
            raw.append(System.getProperty("os.version"));
            raw.append(System.getProperty("os.arch"));
            try {
                java.net.NetworkInterface ni = java.net.NetworkInterface.getByInetAddress(
                    java.net.InetAddress.getLocalHost());
                if (ni != null) {
                    byte[] mac = ni.getHardwareAddress();
                    if (mac != null) {
                        for (byte b : mac) raw.append(String.format("%02X", b));
                    }
                }
            } catch (Exception ignored) {}
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(raw.toString().getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02X", b));
            return sb.toString();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String postRequest(String endpoint, String json) throws IOException {
        URL url = new URL(baseUrl + "/" + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = json.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int status = conn.getResponseCode();
        Scanner scanner;
        if (status >= 200 && status < 300) {
            scanner = new Scanner(conn.getInputStream());
        } else {
            scanner = new Scanner(conn.getErrorStream());
        }
        String body = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
        scanner.close();
        conn.disconnect();
        return body;
    }

    private String jsonGet(String json, String key) {
        String search = "\"" + key + "\":";
        int idx = json.indexOf(search);
        if (idx == -1) return "";
        int start = idx + search.length();
        if (json.charAt(start) == '"') {
            start++;
            int end = json.indexOf('"', start);
            return end == -1 ? "" : json.substring(start, end);
        }
        int end = json.indexOf(",", start);
        if (end == -1) end = json.indexOf("}", start);
        return end == -1 ? json.substring(start) : json.substring(start, end).trim();
    }

    public boolean check() {
        lastError = "";
        try {
            String json = "{\"group_secret\":\"" + appSecret + "\",\"hwid\":\"" + getHWID() + "\"}";
            lastResponse = postRequest("check", json);
            String active = jsonGet(lastResponse, "active");
            if ("true".equals(active)) return true;
            String msg = jsonGet(lastResponse, "message");
            lastError = msg.isEmpty() ? "Device deactivated by admin" : msg;
            return false;
        } catch (Exception e) {
            lastError = e.getMessage();
            return false;
        }
    }

    public boolean register(String deviceName) {
        lastError = "";
        try {
            String json = "{\"group_secret\":\"" + appSecret + "\",\"hwid\":\"" + getHWID() + "\"";
            if (deviceName != null && !deviceName.isEmpty()) {
                json += ",\"device_name\":\"" + deviceName + "\"";
            }
            json += "}";
            lastResponse = postRequest("register", json);
            String active = jsonGet(lastResponse, "active");
            return "true".equals(active);
        } catch (Exception e) {
            lastError = e.getMessage();
            return false;
        }
    }
}
