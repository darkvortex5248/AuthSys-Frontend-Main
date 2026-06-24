'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function JavaScriptSDKPage() {
  return (
    <DocPageLayout
      title="JavaScript / TypeScript SDK"
      subtitle="The official AuthSys SDK for Node.js, browsers, and Electron. Supports TypeScript out of the box with full type definitions."
      sections={[
        {
          title: 'Installation',
          content: (
            <>
              <CodeBlock code={`npm install @authsys/node`} lang="bash" title="npm" />
              <Callout variant="info">
                For browser-based applications, use <code>@authsys/client</code> instead. The browser SDK uses Web Crypto API and has a smaller bundle size (12 KB gzipped).
              </Callout>
            </>
          ),
        },
        {
          title: 'Initialization',
          content: (
            <>
              <p>Import and configure the client with your API key:</p>
              <CodeBlock code={`import { AuthSysClient } from '@authsys/node';

const client = new AuthSysClient({
  apiKey: process.env.AUTHSYS_API_KEY!,
  environment: 'production',   // 'sandbox' | 'production'
  timeout: 10000,               // Request timeout in ms
  retryCount: 3,                // Automatic retry on failure
  retryDelay: 1000,             // Base delay between retries (ms)
});

// TypeScript generics — strongly typed responses
type CustomMetadata = {
  version: string;
  userId: string;
};

const result = await client.validate<CustomMetadata>('KEY-12345', {
  metadata: { version: '2.0.0', userId: 'usr_abc' },
});`} lang="typescript" title="initialization.ts" />
            </>
          ),
        },
        {
          title: 'License Validation',
          content: (
            <>
              <p>The <code>validate</code> method is the primary way to check a license key. It supports HWID binding, metadata, and custom options.</p>
              <CodeBlock code={`const result = await client.validate(licenseKey, {
  bindHwid: true,
  metadata: { version: appVersion },
});

if (result.valid) {
  console.log(\`License: \${result.license.type}\`);
  console.log(\`Expires: \${result.license.expiresAt}\`);
  console.log(\`Activations: \${result.license.activationCount}\`);
} else {
  switch (result.reason) {
    case 'expired':
      showError('Your license has expired.');
      break;
    case 'hwid_mismatch':
      showError('This license is bound to another device.');
      break;
    case 'revoked':
      showError('This license has been revoked.');
      break;
    case 'max_activations':
      showError('Maximum activations reached.');
      break;
    default:
      showError('Invalid license key.');
  }
}`} lang="typescript" title="validation.ts" />
            </>
          ),
        },
        {
          title: 'Event Subscriptions',
          content: (
            <>
              <p>The SDK emits events for important lifecycle changes:</p>
              <CodeBlock code={`// Subscribe to SDK events
client.on('license.expiring', (data) => {
  console.warn(\`License expires in \${data.daysRemaining} days\`);
});

client.on('license.expired', () => {
  showDialog('Your license has expired. Please renew.');
});

client.on('tamper.detected', (alert) => {
  console.error('Tamper detected:', alert.type);
});

client.on('heartbeat.failure', (err) => {
  console.warn('Heartbeat failed:', err.message);
});

// Remove listeners
client.off('license.expiring');`} lang="typescript" title="events.ts" />
            </>
          ),
        },
        {
          title: 'Error Handling',
          content: (
            <>
              <p>The SDK throws typed errors for different failure modes:</p>
              <CodeBlock code={`import {
  AuthSysError,
  ValidationError,
  NetworkError,
  RateLimitError,
} from '@authsys/node';

try {
  await client.validate(licenseKey);
} catch (err) {
  if (err instanceof ValidationError) {
    // Invalid or malformed license key
    console.error('Validation failed:', err.message);
  } else if (err instanceof RateLimitError) {
    // Too many requests — implement backoff
    console.error('Rate limited. Retry after:', err.retryAfter);
  } else if (err instanceof NetworkError) {
    // Connectivity issue — implement retry logic
    console.error('Network error:', err.message);
  } else if (err instanceof AuthSysError) {
    // Generic AuthSys error
    console.error('AuthSys error:', err.code, err.message);
  }
}`} lang="typescript" title="error-handling.ts" />
            </>
          ),
        },
      ]}
    />
  );
}
