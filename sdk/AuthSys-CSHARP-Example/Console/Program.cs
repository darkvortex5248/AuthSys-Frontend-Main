using System;
using System.Threading.Tasks;
using AuthSys;
using AuthSys.Exceptions;
using AuthSys.Utilities;
using AuthSys.Models;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("AuthSys C# SDK v2.0 - Modern Example");
        Console.WriteLine("=====================================\n");

        var client = new AuthSysClient(new AuthSysOptions
        {
            Name = "MyApplication",
            Secret = "your-app-secret-here",
            Version = "1.0.0",
            ApiUrl = "https://api.authsys.dpdns.org/api/v1",
            DebugMode = true,
            Logger = new ConsoleLogger(),
            RetryAttempts = 3,
            RetryDelayMs = 1000
        });

        client.SessionExpired += (s, e) => {
            Console.WriteLine("Session expired! Please re-authenticate.");
        };

        client.VersionUpdate += (s, e) => {
            Console.WriteLine($"Version update: {e.Message} (Required: {e.IsRequired})");
        };

        try
        {
            // Phase 1: Initialize
            Console.WriteLine("1. Initializing...");
            var initResult = await client.InitAsync();
            Console.WriteLine($"   Status: {initResult.Status}");
            
            if (initResult.Status == "update_required")
            {
                Console.WriteLine("   Update required! Please update your application.");
                return;
            }

            // Phase 2: Login
            Console.WriteLine("\n2. Logging in...");
            var authResult = await client.LoginAsync("testuser", "password123");
            Console.WriteLine($"   Login: {authResult.Success}");
            Console.WriteLine($"   Token: {client.SessionToken?.Substring(0, 20)}...");

            // Phase 3: Verify session
            Console.WriteLine("\n3. Verifying session...");
            var verifyResult = await client.VerifyAsync();
            Console.WriteLine($"   Valid: {verifyResult.Valid}");

            // Phase 4: Get variables
            Console.WriteLine("\n4. Getting variables...");
            var theme = client.GetVariable("theme");
            Console.WriteLine($"   Theme: {theme ?? "not set"}");

            // Phase 5: Send chat message
            Console.WriteLine("\n5. Sending chat message...");
            var chatResult = await client.SendChatMessageAsync(1, "Hello from C# SDK!");
            Console.WriteLine($"   Sent: {chatResult.Success}");

            // Phase 6: Logout
            Console.WriteLine("\n6. Logging out...");
            await client.LogoutAsync();
            Console.WriteLine($"   Authenticated: {client.IsAuthenticated}");

            Console.WriteLine("\n✅ All operations completed successfully!");
        }
        catch (AuthenticationException ex)
        {
            Console.WriteLine($"❌ Authentication error: {ex.Message}");
        }
        catch (LicenseException ex)
        {
            Console.WriteLine($"❌ License error: {ex.Message}");
        }
        catch (RateLimitException ex)
        {
            Console.WriteLine($"❌ Rate limit: {ex.Message}");
        }
        catch (NetworkException ex)
        {
            Console.WriteLine($"❌ Network error: {ex.Message}");
        }
        catch (ValidationException ex)
        {
            Console.WriteLine($"❌ Validation error: {ex.Message}");
        }
        catch (SessionExpiredException ex)
        {
            Console.WriteLine($"❌ Session expired: {ex.Message}");
        }
        catch (VersionMismatchException ex)
        {
            Console.WriteLine($"❌ Version mismatch: {ex.Message}");
        }
        catch (MaintenanceException ex)
        {
            Console.WriteLine($"❌ Maintenance: {ex.Message}");
        }
        catch (AuthSysException ex)
        {
            Console.WriteLine($"❌ AuthSys error: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Unexpected error: {ex.Message}");
        }

        client.Dispose();
        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }
}
