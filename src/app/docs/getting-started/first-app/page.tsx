'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function FirstAppPage() {
  return (
    <DocPageLayout
      title="Your First App"
      subtitle="Build a complete license-protected application from scratch. This guide covers project setup, license validation, HWID binding, and error handling."
      sections={[
        {
          title: 'Overview',
          content: (
            <>
              <p>We will build a simple CLI tool that checks for a valid license before running. The app will:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Prompt the user for their license key on first run</li>
                <li>Validate the key against AuthSys with HWID binding</li>
                <li>Cache the validation result for offline use</li>
                <li>Refuse to run if the license is invalid or expired</li>
              </ol>
            </>
          ),
        },
        {
          title: 'Project Setup',
          content: (
            <>
              <CodeBlock code={`mkdir my-licensed-app
cd my-licensed-app
npm init -y
npm install @authsys/node dotenv`} lang="bash" title="Terminal" />
              <p>Create a <code>.env</code> file with your API key:</p>
              <CodeBlock code={`AUTHSYS_API_KEY=as_api_YOUR_SECRET
AUTHSYS_ENV=sandbox`} lang="bash" title=".env" />
            </>
          ),
        },
        {
          title: 'The License Manager',
          content: (
            <>
              <p>Create <code>license.js</code> — a reusable module for license validation:</p>
              <CodeBlock code={`import { AuthSysClient } from '@authsys/node';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import 'dotenv/config';

const client = new AuthSysClient({
  apiKey: process.env.AUTHSYS_API_KEY!,
  environment: (process.env.AUTHSYS_ENV as 'sandbox' | 'production') || 'sandbox',
});

const CACHE_PATH = join(homedir(), '.myapp', 'license-cache.json');

export async function validateOrPrompt(): Promise<void> {
  // 1. Try cache first
  if (existsSync(CACHE_PATH)) {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    if (cached.valid && new Date(cached.expiresAt) > new Date()) {
      console.log('License valid (cached).');
      return;
    }
  }

  // 2. Prompt user
  const licenseKey = prompt('Enter your license key:');
  if (!licenseKey) {
    console.error('No license key provided.');
    process.exit(1);
  }

  // 3. Validate with HWID binding
  const result = await client.validate(licenseKey, { bindHwid: true });

  if (result.valid) {
    writeFileSync(CACHE_PATH, JSON.stringify({
      valid: true,
      key: licenseKey,
      expiresAt: result.expiresAt,
      validatedAt: new Date().toISOString(),
    }));
    console.log('License activated successfully!');
  } else {
    console.error('License validation failed:', result.reason);
    process.exit(1);
  }
}`} lang="javascript" title="license.js" />
            </>
          ),
        },
        {
          title: 'The Main Entry Point',
          content: (
            <>
              <p>Create <code>index.js</code>:</p>
              <CodeBlock code={`import { validateOrPrompt } from './license.js';

async function main() {
  console.log('My Licensed App v1.0.0');
  console.log('------------------------');

  // Gate the app behind license validation
  await validateOrPrompt();

  // Application logic here
  console.log('App is running. Press Ctrl+C to exit.');
  // ... your actual app code
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});`} lang="javascript" title="index.js" />
            </>
          ),
        },
        {
          title: 'App Environments (Dev / Staging / Prod)',
          content: (
            <>
              <p>AuthSys supports separate environments per application. Each environment gets its own <strong>app secret</strong> and <strong>owner ID</strong>, allowing you to develop and test without affecting production data.</p>
              <p>Create environments from <strong>Settings → System → App Environments</strong> in the dashboard:</p>
              <CodeBlock code={`// TypeScript — use environment-specific clients
const devClient = new AuthSysClient({
  apiKey: process.env.DEV_API_KEY!,
  envId: 'env_dev_abc',  // development environment
});

const prodClient = new AuthSysClient({
  apiKey: process.env.PROD_API_KEY!,
  envId: 'env_prod_xyz', // production environment
});

// Each environment has isolated:
// - License keys and users
// - Variables and blacklist
// - Audit logs and analytics
// - Webhook endpoints`} lang="typescript" title="environments.ts" />
              <Callout variant="tip">
                Use the sandbox environment during development — it uses test API keys and does not count toward your license limits. Each environment generates a unique <code>app_secret</code> and <code>owner_id</code>.
              </Callout>
            </>
          ),
        },
        {
          title: 'Running the App',
          content: (
            <>
              <CodeBlock code={`node index.js

# Output:
# My Licensed App v1.0.0
# ------------------------
# Enter your license key: TRIAL-ABCDE-FGHIJ-KLMNO-PQRST
# License activated successfully!
# App is running. Press Ctrl+C to exit.`} lang="bash" title="Terminal" />
              <Callout variant="tip">
                The cache file is stored at <code>~/.myapp/license-cache.json</code>. Delete it to force re-validation. In production, consider encrypting the cache with the machine's HWID as the key.
              </Callout>
              <Callout variant="info">
                This pattern works for CLI tools, desktop apps, and scripts. For GUI applications, use the same logic but with a dialog window for license input.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
