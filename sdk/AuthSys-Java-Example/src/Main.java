import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting AuthSys Java Example...");

        AuthSys auth = new AuthSys("TestApp", "your_owner_id", "your_app_secret", "1.0");
        auth.init();

        if (!auth.initialized) {
            System.out.println("Failed to initialize: " + auth.lastError);
            return;
        }

        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\n[1] Login\n[2] Register\n[3] License Login\n[4] Verify\n[5] Exit");
            System.out.print("Choose: ");
            String choice = scanner.nextLine();

            if (choice.equals("1")) {
                System.out.print("Username: ");
                String u = scanner.nextLine();
                System.out.print("Password: ");
                String p = scanner.nextLine();
                auth.login(u, p);
                if (auth.sessionToken != null) {
                    System.out.println("Welcome inside the app!");
                    break;
                } else {
                    System.out.println("Login failed: " + auth.lastError);
                }
            } else if (choice.equals("2")) {
                System.out.print("Username: ");
                String u = scanner.nextLine();
                System.out.print("Password: ");
                String p = scanner.nextLine();
                System.out.print("License Key: ");
                String l = scanner.nextLine();
                auth.register(u, p, l);
                if (auth.lastError.isEmpty()) {
                    System.out.println("Registration successful!");
                } else {
                    System.out.println("Registration failed: " + auth.lastError);
                }
            } else if (choice.equals("3")) {
                System.out.print("License Key: ");
                String l = scanner.nextLine();
                auth.licenseLogin(l);
                if (auth.sessionToken != null) {
                    System.out.println("Logged in via License!");
                    break;
                } else {
                    System.out.println("License login failed: " + auth.lastError);
                }
            } else if (choice.equals("4")) {
                auth.verify();
                if (auth.lastError.isEmpty()) {
                    System.out.println("Session is valid!");
                } else {
                    System.out.println("Session verification failed: " + auth.lastError);
                }
            } else if (choice.equals("5")) {
                break;
            }
        }
        scanner.close();
    }
}
