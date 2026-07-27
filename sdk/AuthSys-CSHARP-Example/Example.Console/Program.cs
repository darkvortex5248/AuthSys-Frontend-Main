using System;
using System.Threading.Tasks;
using AuthSys;

namespace AuthSysExample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var options = new AuthSysOptions
            {
                AppSecret = "YOUR_APP_SECRET",
                AppName = "MyApplication",
                Version = "1.0.0",
                EnableLogging = true
            };

            var auth = new AuthSys.AuthSys(options);

            try
            {
                Console.WriteLine("=== Initializing ===");
                var initResult = await auth.InitAsync();
                Console.WriteLine($"Status: {initResult.Status}");
                Console.WriteLine($"Message: {initResult.Message}");
                Console.WriteLine($"Version: {initResult.CurrentVersion}");

                if (initResult.Status == "update_required")
                {
                    Console.WriteLine("Update required! Please update the application.");
                    return;
                }

                Console.WriteLine("\n=== Registering ===");
                var registerResult = await auth.RegisterAsync("testuser", "Password123!", "AUTHSYS-KEY-123456");
                Console.WriteLine($"Success: {registerResult.Success}");
                Console.WriteLine($"Message: {registerResult.Message}");

                Console.WriteLine("\n=== Logging in ===");
                var loginResult = await auth.LoginAsync("testuser", "Password123!");
                Console.WriteLine($"Success: {loginResult.Success}");
                Console.WriteLine($"Username: {loginResult.Username}");
                Console.WriteLine($"Token: {loginResult.Token}");

                Console.WriteLine("\n=== Verifying ===");
                var verifyResult = await auth.VerifyAsync();
                Console.WriteLine($"Valid: {verifyResult.Valid}");
                Console.WriteLine($"Username: {verifyResult.Username}");

                Console.WriteLine("\n=== License Login ===");
                var licenseLoginResult = await auth.LicenseLoginAsync("AUTHSYS-KEY-123456");
                Console.WriteLine($"Success: {licenseLoginResult.Success}");
                Console.WriteLine($"Username: {licenseLoginResult.Username}");

                Console.WriteLine("\n=== License Check ===");
                var licenseCheckResult = await auth.LicenseCheckAsync("AUTHSYS-KEY-123456");
                Console.WriteLine($"Valid: {licenseCheckResult.Valid}");
                Console.WriteLine($"Key Type: {licenseCheckResult.KeyType}");

                Console.WriteLine("\n=== Variables ===");
                foreach (var v in auth.GetAllVariables())
                {
                    Console.WriteLine($"  {v.Key}: {v.Value}");
                }

                Console.WriteLine("\n=== Logging out ===");
                auth.Logout();
                Console.WriteLine($"Is Authenticated: {auth.IsAuthenticated}");
            }
            catch (AuthSysException ex)
            {
                Console.WriteLine($"Auth Error [{ex.ErrorCode}]: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}
