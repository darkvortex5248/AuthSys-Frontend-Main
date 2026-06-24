'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function InstallationPage() {
  return (
    <DocPageLayout
      title="Installation & Setup"
      subtitle="Get AuthSys running in your development environment. Follow the steps below to create an account, install the SDK, and make your first API call."
      sections={[
        {
          title: '1. Create Your Account',
          content: (
            <>
              <p>Navigate to <a href="https://dashboard.authsys.io/register" className="text-[var(--primary)] hover:underline">dashboard.authsys.io/register</a> and sign up with your email and password. After verifying your email, you will be taken to the welcome wizard, which guides you through creating your first application.</p>
              <Callout variant="tip">
                Use your work email for faster Enterprise plan verification. Free accounts have full access to all features with a 500-license limit.
              </Callout>
            </>
          ),
        },
        {
          title: '2. Generate API Credentials',
          content: (
            <>
              <p>In the dashboard, go to <strong>Settings → API Keys</strong> and click <strong>Generate New Key</strong>. Give your key a descriptive name (e.g., "Production Server") and copy it immediately — the secret is shown only once.</p>
              <CodeBlock code={`# Store your API key as an environment variable
export AUTHSYS_API_KEY="as_api_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p"`} lang="bash" title=".env / environment variable" />
              <Callout variant="warning">
                Store your API key in a secure vault or environment variable. Never commit it to version control. If compromised, revoke it immediately from the dashboard.
              </Callout>
            </>
          ),
        },
        {
          title: '3. Install the SDK',
          content: (
            <>
              <p>AuthSys provides official SDKs for the most popular languages. Choose your platform below:</p>
              <CodeBlock code={`# Node.js / TypeScript
npm install @authsys/node

# Python
pip install authsys-python

# C# / .NET
dotnet add package AuthSys.SDK

# C++
# Add to your CMakeLists.txt:
# find_package(authsys REQUIRED)`} lang="bash" title="Installation commands" />
            </>
          ),
        },
        {
          title: '4. Initialize the Client',
          content: (
            <>
              <p>After installing the SDK, initialize the client with your API key:</p>
              <CodeBlock code={`import { AuthSysClient } from '@authsys/node';

const client = new AuthSysClient({
  apiKey: process.env.AUTHSYS_API_KEY!,
  environment: 'production', // or 'sandbox' for testing
});`} lang="typescript" title="initialization.ts" />
              <CodeBlock code={`from authsys import AuthSysClient

client = AuthSysClient(
    api_key="as_api_...",
    environment="sandbox"
)`} lang="python" title="initialization.py" />
              <CodeBlock code={`using AuthSys;

var client = new AuthSysClient(new AuthSysOptions
{
    ApiKey = Environment.GetEnvironmentVariable("AUTHSYS_API_KEY"),
    Environment = AuthSysEnvironment.Sandbox
});`} lang="csharp" title="Initialization.cs" />
            </>
          ),
        },
        {
          title: '5. Verify the Setup',
          content: (
            <>
              <p>Make a test call to verify everything is connected:</p>
              <CodeBlock code={`const health = await client.healthCheck();
console.log(health);
// { status: 'ok', version: '2.1.0', timestamp: '2026-06-15T10:30:00Z' }`} lang="typescript" title="health-check.ts" />
              <Callout variant="info">
                Use the <strong>sandbox</strong> environment during development. Sandbox mode uses test API keys and does not count toward your license limits.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
