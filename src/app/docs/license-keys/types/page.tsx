'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function KeyTypesPage() {
  return (
    <DocPageLayout
      title="License Key Types"
      subtitle="AuthSys supports three license models: time-based subscriptions, lifetime licenses, and usage-based keys. Choose the model that best fits your product."
      sections={[
        {
          title: 'Time-Based (Subscription)',
          content: (
            <>
              <p>Time-based keys expire after a fixed duration from the date of creation or first activation. They are the most common license model for SaaS and subscription software.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Duration</strong> — Configurable in days (e.g., 30, 90, 365).</li>
                <li><strong>Auto-expiry</strong> — Key status changes to <code>expired</code> automatically.</li>
                <li><strong>Grace Period</strong> — Configurable grace period after expiry (default: 7 days).</li>
                <li><strong>Renewal</strong> — Extend the expiry date via the API or dashboard to renew.</li>
              </ul>
              <CodeBlock code={`// Create a 30-day time-based license
const license = await client.createLicense({
  type: 'time_based',
  durationDays: 30,
  maxActivations: 3,
  hwidLocked: true,
  prefix: 'MONTHLY',
});

// Extend/renew an existing license
await client.updateLicense(license.id, {
  expiresAt: '2027-06-15T00:00:00Z', // New expiry
});`} lang="typescript" title="time-based.ts" />
              <Callout variant="info">
                Time-based keys are ideal for SaaS products, annual subscriptions, and trial periods. The automatic expiry enforcement reduces manual overhead.
              </Callout>
            </>
          ),
        },
        {
          title: 'Lifetime (Perpetual)',
          content: (
            <>
              <p>Lifetime keys never expire. They remain valid indefinitely unless manually revoked or suspended. Best for perpetual software licenses and one-time purchases.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>No Expiry</strong> — The <code>expires_at</code> field is <code>null</code>.</li>
                <li><strong>HWID Locking</strong> — Recommended to prevent sharing.</li>
                <li><strong>Activation Limits</strong> — Still enforced (configurable max activations).</li>
                <li><strong>Transferable</strong> — Can be transferred between machines via deactivation/reactivation.</li>
              </ul>
              <CodeBlock code={`// Create a lifetime license
const license = await client.createLicense({
  type: 'lifetime',
  maxActivations: 2,  // Allow activation on 2 machines
  hwidLocked: true,
  prefix: 'LIFETIME',
});

// Lifetime key in validation response
{
  "valid": true,
  "license": {
    "type": "lifetime",
    "expires_at": null,
    "status": "active"
  }
}`} lang="typescript" title="lifetime.ts" />
            </>
          ),
        },
        {
          title: 'Usage-Based (Pay-per-Use)',
          content: (
            <>
              <p>Usage-based keys expire after a specified number of validations or uses. Perfect for API products, pay-as-you-go models, and limited trials.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Max Uses</strong> — Configurable total allowed uses (e.g., 1000 API calls).</li>
                <li><strong>Use Counter</strong> — Incremented on each successful validation. Stored server-side.</li>
                <li><strong>Reset</strong> — Counter can be reset via the API (billing cycles).</li>
                <li><strong>Expiry Fallback</strong> — Can also have a time-based expiry as a safety net.</li>
              </ul>
              <CodeBlock code={`// Create a usage-based license with 1000 uses
const license = await client.createLicense({
  type: 'uses_based',
  maxUses: 1000,
  maxActivations: 1,
  hwidLocked: false,
  prefix: 'USAGE',
});

// Check remaining uses
const result = await client.validate(license.key);
console.log(\`Uses remaining: \${result.license.usesRemaining}\`);

// Reset uses (for billing cycle reset)
await client.resetLicenseUses(license.id);`} lang="typescript" title="uses-based.ts" />
              <Callout variant="warning">
                Usage-based keys should always be validated server-side. Client-side validation can be bypassed, allowing the user to exceed their usage limit.
              </Callout>
            </>
          ),
        },
        {
          title: 'Seller-Generated Keys',
          content: (
            <>
              <p>With the Seller API, third-party sellers can generate license keys on your behalf without accessing your dashboard. Keys generated through the seller flow include a <strong>seller tag</strong> in their metadata:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Each seller has their own API key with scoped permissions</li>
                <li>Keys are linked to the seller for commission tracking</li>
                <li>Sellers can only generate keys — they cannot view, modify, or revoke existing keys</li>
              </ul>
              <Callout variant="tip">
                The Seller API is ideal for affiliate programs and reseller networks. You control the plan limits, and sellers generate keys within those limits.
              </Callout>
            </>
          ),
        },
        {
          title: 'Comparison Table',
          content: (
            <>
              <CodeBlock code={`Feature            | Time-Based  | Lifetime    | Usage-Based
-------------------|-------------|-------------|------------
Expires            | Yes         | No          | When uses depleted
Use Case           | Subscriptions| Perpetual   | API / PAYG
HWID Recommended   | Yes         | Yes         | Optional
Activations        | Configurable| Configurable| 1 (typical)
Auto-Renew         | Via API     | N/A         | Reset uses
Revocable          | Yes         | Yes         | Yes
Grace Period       | Configurable| N/A         | N/A`} lang="text" title="Comparison" />
            </>
          ),
        },
      ]}
    />
  );
}
