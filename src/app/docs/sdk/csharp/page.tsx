'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function CSharpSDKPage() {
  return (
    <DocPageLayout
      title="C# / .NET SDK"
      subtitle="The official AuthSys SDK for .NET 6+ and .NET Framework 4.8+. Provides both synchronous and asynchronous APIs with full nullable reference type annotations."
      sections={[
        {
          title: 'Installation',
          content: (
            <>
              <CodeBlock code={`# .NET CLI
dotnet add package AuthSys.SDK

# Package Manager
Install-Package AuthSys.SDK

# PackageReference
<PackageReference Include="AuthSys.SDK" Version="2.1.0" />`} lang="bash" title="Installation" />
            </>
          ),
        },
        {
          title: 'Initialization',
          content: (
            <>
              <p>Register the client in your dependency injection container or instantiate it directly:</p>
              <CodeBlock code={`using AuthSys;
using Microsoft.Extensions.DependencyInjection;

// Method 1: DI registration (recommended for ASP.NET Core)
services.AddAuthSysClient(options =>
{
    options.ApiKey = Environment.GetEnvironmentVariable("AUTHSYS_API_KEY");
    options.Environment = AuthSysEnvironment.Production;
    options.Timeout = TimeSpan.FromSeconds(10);
});

// Method 2: Direct instantiation
var client = new AuthSysClient(new AuthSysOptions
{
    ApiKey = "as_api_...",
    Environment = AuthSysEnvironment.Sandbox,
});`} lang="csharp" title="Startup.cs" />
            </>
          ),
        },
        {
          title: 'License Validation',
          content: (
            <>
              <CodeBlock code={`using AuthSys.Models;

public class LicenseService
{
    private readonly IAuthSysClient _client;

    public LicenseService(IAuthSysClient client)
    {
        _client = client;
    }

    public async Task<bool> ValidateLicense(string licenseKey)
    {
        try
        {
            var result = await _client.ValidateAsync(
                licenseKey,
                new ValidationOptions
                {
                    BindHwid = true,
                    Metadata = new Dictionary<string, string>
                    {
                        ["app_version"] = "2.0.0",
                        ["os_platform"] = Environment.OSVersion.ToString()
                    }
                }
            );

            if (result.IsValid)
            {
                Console.WriteLine($"License: {result.License.Type}");
                Console.WriteLine($"Expires: {result.License.ExpiresAt:O}");
                return true;
            }

            Console.WriteLine($"Validation failed: {result.Reason}");
            return false;
        }
        catch (AuthSysRateLimitException ex)
        {
            Console.WriteLine($"Rate limited. Retry after {ex.RetryAfter}s");
            return false;
        }
        catch (AuthSysException ex)
        {
            Console.WriteLine($"AuthSys error: {ex.Code} \u2014 {ex.Message}");
            return false;
        }
    }
}`} lang="csharp" title="LicenseService.cs" />
            </>
          ),
        },
        {
          title: 'Configuration & Options',
          content: (
            <>
              <p>The SDK supports extensive configuration through <code>IConfiguration</code> binding:</p>
              <CodeBlock code={`// appsettings.json
{
  "AuthSys": {
    "ApiKey": "as_api_...",
    "Environment": "sandbox",
    "Timeout": "00:00:10",
    "RetryPolicy": {
      "MaxRetries": 3,
      "BaseDelay": "00:00:01"
    },
    "AntiTamper": {
      "Enabled": true,
      "DebuggerAction": "report"
    },
    "HwidConfig": {
      "MinComponentsRequired": 3,
      "Components": ["motherboard_serial", "cpu_id", "disk_serial"]
    }
  }
}`} lang="json" title="appsettings.json" />
              <Callout variant="info">
                The .NET SDK supports <code>IHttpClientFactory</code> for resilient HTTP connections, including automatic retries with exponential backoff via Polly.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
