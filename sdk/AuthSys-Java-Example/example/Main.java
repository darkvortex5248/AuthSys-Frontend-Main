import java.util.Map;

public class Main {
    public static void main(String[] args) {
        AuthSys auth = new AuthSys("YOUR_APP_SECRET");
        auth._options.appName = "MyApplication";
        auth._options.version = "1.0.0";
        auth._options.enableLogging = true;

        try {
            System.out.println("=== Initializing ===");
            auth.init();
            System.out.println("Is Initialized: " + auth.isInitialized());

            System.out.println("\n=== Registering ===");
            String registerResult = auth.register("testuser", "Password123!", "AUTHSYS-KEY-123456");
            System.out.println("Result: " + registerResult);

            System.out.println("\n=== Logging in ===");
            String loginResult = auth.login("testuser", "Password123!");
            System.out.println("Result: " + loginResult);
            System.out.println("Is Authenticated: " + auth.isAuthenticated());

            System.out.println("\n=== Verifying ===");
            String verifyResult = auth.verify();
            System.out.println("Result: " + verifyResult);

            System.out.println("\n=== License Login ===");
            String licenseLoginResult = auth.licenseLogin("AUTHSYS-KEY-123456");
            System.out.println("Result: " + licenseLoginResult);

            System.out.println("\n=== License Check ===");
            String licenseCheckResult = auth.licenseCheck("AUTHSYS-KEY-123456");
            System.out.println("Result: " + licenseCheckResult);

            System.out.println("\n=== Variables ===");
            Map<String, Object> variables = auth.getAllVariables();
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                System.out.println("  " + entry.getKey() + ": " + entry.getValue());
            }

            System.out.println("\n=== Sending chat message ===");
            String chatResult = auth.sendChatMessage(1, "Hello World!");
            System.out.println("Result: " + chatResult);

            System.out.println("\n=== Device Registration ===");
            String deviceResult = auth.registerDevice("HWID123", "My Device");
            System.out.println("Result: " + deviceResult);

            System.out.println("\n=== Logging out ===");
            auth.logout();
            System.out.println("Is Authenticated: " + auth.isAuthenticated());

        } catch (AuthSys.AuthSysException e) {
            System.out.println("Auth Error [" + e.errorCode + "]: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
