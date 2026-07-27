using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuthSys;

namespace AuthSysExample
{
    class Program
    {
        static string GetVal(Dictionary<string, object> dict, string key)
        {
            return dict.ContainsKey(key) ? dict[key]?.ToString() ?? "" : "";
        }

        static bool GetBool(Dictionary<string, object> dict, string key)
        {
            return dict.ContainsKey(key) && dict[key]?.ToString() == "True";
        }

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
                Console.WriteLine($"Status: {GetVal(initResult, "status")}");

                if (GetVal(initResult, "status") == "update_required")
                {
                    Console.WriteLine("Update required!");
                    return;
                }

                Console.WriteLine("\n=== Registering ===");
                var registerResult = await auth.RegisterAsync("testuser", "Password123!", "AUTHSYS-KEY-123456");
                Console.WriteLine($"Success: {GetBool(registerResult, "success")}");

                Console.WriteLine("\n=== Logging in ===");
                var loginResult = await auth.LoginAsync("testuser", "Password123!");
                Console.WriteLine($"Success: {GetBool(loginResult, "success")}");
                Console.WriteLine($"Username: {GetVal(loginResult, "username")}");

                Console.WriteLine("\n=== Verifying ===");
                var verifyResult = await auth.VerifyAsync();
                Console.WriteLine($"Valid: {GetBool(verifyResult, "valid")}");

                Console.WriteLine("\n=== License Login ===");
                var licenseLoginResult = await auth.LicenseLoginAsync("AUTHSYS-KEY-123456");
                Console.WriteLine($"Success: {GetBool(licenseLoginResult, "success")}");

                Console.WriteLine("\n=== License Check ===");
                var licenseCheckResult = await auth.LicenseCheckAsync("AUTHSYS-KEY-123456");
                Console.WriteLine($"Valid: {GetBool(licenseCheckResult, "valid")}");

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
