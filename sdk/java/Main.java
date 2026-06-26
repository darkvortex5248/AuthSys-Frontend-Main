import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting AuthSys Java Example...");

        AuthSys auth = new AuthSys("TestApp", "your_owner_id", "your_app_secret", "1.0");
        auth.init();

        if (!auth.initialized) {
            System.out.println("Failed to initialize. Exiting.");
            return;
        }

        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\n[1] Login\n[2] Register\n[3] Exit");
            System.out.print("Choose: ");
            String choice = scanner.nextLine();

            if (choice.equals("1")) {
                System.out.print("Username: ");
                String u = scanner.nextLine();
                System.out.print("Password: ");
                String p = scanner.nextLine();
                
                if (auth.login(u, p)) {
                    System.out.println("Welcome inside the app!");
                    break;
                }
            } else if (choice.equals("2")) {
                System.out.print("Username: ");
                String u = scanner.nextLine();
                System.out.print("Password: ");
                String p = scanner.nextLine();
                System.out.print("License Key: ");
                String l = scanner.nextLine();
                
                auth.register(u, p, l);
            } else if (choice.equals("3")) {
                break;
            }
        }
        scanner.close();
    }
}
