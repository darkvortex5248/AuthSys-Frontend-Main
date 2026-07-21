'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function BestPracticesPage() {
  return (
    <DocPageLayout
      title="License Key Best Practices"
      subtitle="Follow these recommendations to maximize security, minimize friction for legitimate users, and effectively manage your license key lifecycle."
      sections={[
        {
          title: '1. Always Validate Server-Side',
          content: (
            <>
              <p>Client-side validation can be bypassed by decompiling or patching your application. Every license decision must be verified by the AuthSys server:</p>
              <CodeBlock code={`// ❌ BAD: Client-only validation
const result = await client.validate(key);
if (result.valid) { runApp(); }

// ✅ GOOD: Validate and enforce server-side
const result = await client.validate(key);
if (!result.valid) {
  throw new Error('License invalid: ' + result.reason);
}
// Only reach this point if validation passed
runApp();`} lang="typescript" title="server-side-validation.ts" />
              <Callout variant="danger">
                Never trust the client. Even if validation passes on the client, an attacker can modify the response. Always check the signed server response and fail closed.
              </Callout>
            </>
          ),
        },
        {
          title: '2. Use HWID Locking',
          content: (
            <>
              <p>HWID locking prevents license sharing by binding each license to a specific machine. Even if a user shares their license key, it will not work on another computer.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enable HWID locking on all license types by default.</li>
                <li>Set <code>max_activations</code> to a reasonable number (3 is a good default for multi-device users).</li>
                <li>Provide a self-service portal for users to deactivate old machines.</li>
                <li>Log HWID change events for audit and fraud detection.</li>
              </ul>
            </>
          ),
        },
        {
          title: '3. Implement Graceful Degradation',
          content: (
            <>
              <p>Your application should handle network failures and server downtime gracefully. Use the SDK's caching and offline mode:</p>
              <CodeBlock code={`const client = new AuthSysClient({
  cache: {
    enabled: true,
    ttlMinutes: 1440,           // 24h cache
    offlineGraceMinutes: 120,   // 2h offline grace
  },
  retryPolicy: {
    maxRetries: 3,
    backoffMs: [1000, 5000, 15000],  // Progressive delay
  },
});

function handleValidationError(err: Error): boolean {
  if (err instanceof NetworkError) {
    // Check if we have a valid cached response
    const cached = client.getCachedValidation();
    if (cached && cached.valid) {
      console.warn('Using cached validation (offline mode)');
      return true; // Allow app to run
    }
  }
  return false; // Block app
}`} lang="typescript" title="graceful-degradation.ts" />
            </>
          ),
        },
        {
          title: '4. Monitor & Audit',
          content: (
            <>
              <p>Active monitoring helps you detect abuse patterns early:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Set up webhooks</strong> for <code>threat.detected</code> and <code>license.validated</code> events.</li>
                <li><strong>Review audit logs</strong> weekly for unusual patterns (e.g., rapid activations, geographic anomalies).</li>
                <li><strong>Use the analytics dashboard</strong> to track activation trends and identify unusual spikes.</li>
                <li><strong>Configure rate limit alerts</strong> to notify you when a key approaches its limit.</li>
              </ul>
              <CodeBlock code={`// Get activation history for analysis
const history = await client.getLicenseHistory(licenseId, {
  startDate: '2026-01-01',
  endDate: '2026-06-15',
  events: ['activated', 'validated', 'hwid_changed'],
});

// Detect unusual patterns
const ipCounts = new Map<string, number>();
for (const event of history) {
  ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
}
for (const [ip, count] of ipCounts) {
  if (count > 100) {
    alert(\`Suspicious activity from IP \${ip}: \${count} events\`);
  }
}`} lang="typescript" title="monitoring.ts" />
            </>
          ),
        },
        {
          title: '5. Key Lifecycle Management',
          content: (
            <>
              <p>Establish a clear lifecycle policy for your license keys:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Creation</strong> — Use descriptive prefixes and metadata for easy filtering.</li>
                <li><strong>Distribution</strong> — Deliver keys securely (email, dashboard, in-app purchase).</li>
                <li><strong>Activation</strong> — Bind to HWID on first validation.</li>
                <li><strong>Monitoring</strong> — Track usage and flag anomalies.</li>
                <li><strong>Suspension</strong> — Suspend (don't delete) keys for policy violations.</li>
                <li><strong>Reactivation</strong> — Re-activate suspended keys after issue resolution.</li>
                <li><strong>Expiration/Deletion</strong> — Archive expired keys; delete only after retention period.</li>
              </ol>
              <Callout variant="tip">
                Use the <code>metadata</code> field to store internal notes about each key (customer ID, purchase date, support ticket references). This data is searchable in the dashboard.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
