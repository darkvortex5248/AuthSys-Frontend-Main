import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class AuthSys {
    public String name;
    public String ownerid;
    public String secret;
    public String version;
    public String apiUrl;

    public boolean initialized = false;
    public String sessionid = null;

    public AuthSys(String name, String ownerid, String secret, String version) {
        this.name = name;
        this.ownerid = ownerid;
        this.secret = secret;
        this.version = version;
        this.apiUrl = "https://authsys-main-production.up.railway.app/api/v1";
    }

    private String getHWID() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                Process process = Runtime.getRuntime().exec(new String[]{"wmic", "csproduct", "get", "uuid"});
                process.getOutputStream().close();
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                StringBuilder output = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
                return output.toString().replace("UUID", "").trim();
            }
        } catch (Exception e) {}
        return "UNKNOWN_JAVA_HWID";
    }

    private String postRequest(String endpoint, String jsonPayload) {
        try {
            URL url = new URL(this.apiUrl + "/client/" + endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            BufferedReader br = new BufferedReader(new InputStreamReader(
                    code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(), "utf-8"));
            
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            return response.toString();
        } catch (Exception e) {
            return "{\"status\":\"error\", \"detail\":\"" + e.getMessage() + "\"}";
        }
    }

    public void init() {
        String json = String.format("{\"app_secret\":\"%s\", \"version\":\"%s\", \"hwid\":\"%s\"}", secret, version, getHWID());
        String res = postRequest("init", json);
        
        if (res.contains("\"status\":\"success\"") || res.contains("\"status\":\"update_available\"")) {
            this.initialized = true;
            System.out.println("[*] Initialized successfully");
        } else {
            System.out.println("[!] Init Failed: " + res);
        }
    }

    public boolean login(String username, String password) {
        if (!initialized) return false;
        
        String json = String.format("{\"app_secret\":\"%s\", \"username\":\"%s\", \"password\":\"%s\", \"hwid\":\"%s\"}", 
            secret, username, password, getHWID());
        String res = postRequest("login", json);

        if (res.contains("access_token")) {
            System.out.println("[*] Logged in successfully");
            // Basic parsing to extract access_token could be done here (e.g. using org.json or Gson)
            this.sessionid = "mock_token_extracted";
            return true;
        } else {
            System.out.println("[!] Login Failed: " + res);
            return false;
        }
    }

    public boolean register(String username, String password, String licenseKey) {
        if (!initialized) return false;
        
        String json = String.format("{\"app_secret\":\"%s\", \"username\":\"%s\", \"password\":\"%s\", \"license_key\":\"%s\", \"hwid\":\"%s\"}", 
            secret, username, password, licenseKey, getHWID());
        String res = postRequest("register", json);

        if (res.contains("access_token") || res.contains("User registered successfully")) {
            System.out.println("[*] Registered successfully");
            return true;
        } else {
            System.out.println("[!] Registration Failed: " + res);
            return false;
        }
    }
}
