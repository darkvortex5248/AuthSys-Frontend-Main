import java.io.*;
import java.util.*;

public class AuthSysHelper {

    public static String getHwid() {
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

    public static String jsonGet(String json, String key) {
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

    public static Map<String, Object> parseVariables(String json) {
        Map<String, Object> result = new HashMap<>();
        if (json == null || json.isEmpty()) return result;

        String varsStr = json.replaceAll(".*\"variables\":\\{?", "").replaceAll("\\}.*", "");
        if (varsStr.isEmpty()) return result;

        String[] pairs = varsStr.split(",");
        for (String pair : pairs) {
            String[] kv = pair.split(":", 2);
            if (kv.length == 2) {
                String k = kv[0].replaceAll("[\"{} ]", "");
                String v = kv[1].replaceAll("[\" ]", "");
                result.put(k, v);
            }
        }
        return result;
    }

    public static String hashString(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public static String generateGuid() {
        return java.util.UUID.randomUUID().toString();
    }
}
