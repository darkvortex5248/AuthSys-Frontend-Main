'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function QuickstartPage() {
  return (
    <DocPageLayout
      title="Quickstart Guide"
      subtitle="Integrate AuthSys in under 5 minutes. This guide walks through SDK installation, license validation, and HWID binding with a complete working example."
      sections={[
        {
          title: 'Prerequisites',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li>Node.js 18+ installed</li>
                <li>An AuthSys account with a sandbox API key</li>
                <li>A trial license key (available in the dashboard under <strong>License Keys → Create</strong>)</li>
              </ul>
            </>
          ),
        },
        {
          title: '1. Create a New Project',
          content: (
            <>
              <CodeBlock code={`mkdir authsys-quickstart
cd authsys-quickstart
npm init -y
npm install @authsys/node`} lang="bash" title="Terminal" />
            </>
          ),
        },
        {
          title: '2. Write the Integration',
          content: (
            <>
              <p>Create a file named <code>index.ts</code> with the following code:</p>
              <CodeBlock code={`import { AuthSysClient } from '@authsys/node';

const client = new AuthSysClient({
  apiKey: process.env.AUTHSYS_API_KEY!,
  environment: 'sandbox',
});

async function main() {
  // 1. Authenticate the client
  const session = await client.authenticate();
  console.log('Session:', session.id);

  // 2. Validate a license key
  const licenseKey = 'TRIAL-ABCDE-FGHIJ-KLMNO-PQRST'; // Replace with your key
  const result = await client.validate(licenseKey, {
    bindHwid: true,
    metadata: { version: '1.0.0' },
  });

  if (result.valid) {
    console.log('License valid! Expires:', result.expiresAt);
  } else {
    console.log('License invalid:', result.reason);
  }

  // 3. Get full license info
  const info = await client.getLicense(licenseKey);
  console.log('License type:', info.type);
  console.log('Activations:', info.activations.length);
}

main().catch(console.error);`} lang="typescript" title="index.ts" />
            </>
          ),
        },
        {
          title: '3. Run It',
          content: (
            <>
              <CodeBlock code={`export AUTHSYS_API_KEY="as_api_YOUR_KEY"
npx tsx index.ts`} lang="bash" title="Terminal" />
              <p>Expected output:</p>
              <CodeBlock code={`Session: sess_abc123def456
License valid! Expires: 2026-07-15T10:30:00Z
License type: time_based
Activations: 1`} lang="text" title="Console output" />
              <Callout variant="tip">
                If validation fails, make sure your sandbox API key has <strong>not</strong> been set to production mode, and that the license key has not expired. Use the dashboard to create a fresh trial key if needed.
              </Callout>
            </>
          ),
        },
        {
          title: 'Next Steps',
          content: (
            <>
              <p>You have successfully validated a license key! From here you can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enable <strong>HWID locking</strong> to bind licenses to specific machines</li>
                <li>Set up <strong>webhooks</strong> to receive real-time license events</li>
                <li>Explore the <strong>dashboard</strong> to view analytics and audit logs</li>
                <li>Read the <strong>SDK reference</strong> for advanced configuration options</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
