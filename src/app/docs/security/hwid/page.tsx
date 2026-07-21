'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function HWIDPage() {
  return (
    <DocPageLayout
      title="HWID Locking"
      subtitle="Hardware ID (HWID) locking binds a license to a specific machine by fingerprinting its hardware components. This prevents users from sharing licenses across multiple computers."
      sections={[
        {
          title: 'How HWID Locking Works',
          content: (
            <>
              <p>When HWID locking is enabled, the SDK collects hardware identifiers from the host machine — including the motherboard serial, CPU ID, MAC address, disk serial, and TPM module — and combines them into a salted SHA-256 hash. This fingerprint is sent to AuthSys during license validation and stored with the activation.</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Collection</strong> — The SDK gathers hardware data using OS-level APIs.</li>
                <li><strong>Hashing</strong> — Raw identifiers are concatenated with a per-application salt and hashed.</li>
                <li><strong>Binding</strong> — The hash is sent to AuthSys during activation and stored server-side.</li>
                <li><strong>Verification</strong> — On subsequent validations, the server compares the stored HWID against the current machine's fingerprint.</li>
              </ol>
              <Callout variant="info">
                The HWID hash is one-way and salted. Raw hardware identifiers are never transmitted or stored on AuthSys servers.
              </Callout>
            </>
          ),
        },
        {
          title: 'Enabling HWID Locking',
          content: (
            <>
              <p>HWID locking is configured per-license-key in the dashboard, or at validation time in the SDK:</p>
              <CodeBlock code={`// Enable HWID binding during validation
const result = await client.validate('LICENSE-KEY-HERE', {
  bindHwid: true,          // Enable HWID binding
  hwidSalt: 'my-app-v1',   // Optional: application-specific salt
  allowHwidChange: false,  // Optional: allow HWID reset by support
});`} lang="typescript" title="hwid-validation.ts" />
              <p>In the dashboard, toggle <strong>Hardware Lock</strong> on when creating or editing a license key:</p>
              <CodeBlock code={`// API equivalent — create a HWID-locked license
curl -X POST https://api.authsys.io/v1/licenses \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "time_based",
    "duration_days": 365,
    "max_activations": 1,
    "hwid_locked": true
  }'`} lang="bash" title="API request" />
            </>
          ),
        },
        {
          title: 'Custom HWID Components',
          content: (
            <>
              <p>You can customize which hardware components are included in the fingerprint:</p>
              <CodeBlock code={`const client = new AuthSysClient({
  apiKey: '...',
  hwidConfig: {
    components: [
      'motherboard_serial',
      'cpu_id',
      'mac_address',
      'disk_serial',
      // 'gpu_id',       // optional
      // 'tpm',           // optional
      // 'hostname',      // optional — not recommended
    ],
    minComponentsRequired: 3,
  },
});`} lang="typescript" title="custom-hwid.ts" />
              <Callout variant="warning">
                Be careful with the <code>minComponentsRequired</code> setting. Setting it too high may cause false rejections on machines with virtualized or missing hardware. We recommend 3 as the minimum.
              </Callout>
            </>
          ),
        },
        {
          title: 'Handling Hardware Changes',
          content: (
            <>
              <p>When a user upgrades their hardware, their HWID changes and validation will fail. AuthSys provides several strategies to handle this:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Grace Period</strong> — Allow <em>N</em> HWID changes within a time window (configurable in settings).</li>
                <li><strong>Support Reset</strong> — Support staff can reset HWID bindings from the dashboard.</li>
                <li><strong>Self-Service Portal</strong> — Users can deactivate old machines from their account portal.</li>
              </ul>
              <CodeBlock code={`// Configure HWID change tolerance
const result = await client.validate('LICENSE-KEY', {
  bindHwid: true,
  hwidChangePolicy: {
    maxChangesPerMonth: 3,
    gracePeriodMinutes: 30,
  },
  });`} lang="typescript" title="hwid-change-policy.ts" />
            </>
          ),
        },
        {
          title: 'Resetting HWID Bindings',
          content: (
            <>
              <p>You can reset HWID bindings for a user or license key. This allows the user to activate on a new machine:</p>
              <CodeBlock code={`// Reset HWID for a user
POST /api/v1/developer/users/{user_id}/hwid-reset
Response: { "status": "hwid_reset" }

// Reset HWID for all users of a license key
POST /api/v1/developer/keys/{key_id}/hwid-reset
Response: { "status": "hwid_reset", "affected_users": 2 }`} lang="bash" title="Reset HWID" />
              <Callout variant="warning">
                Resetting HWID bypasses hardware binding security. Only perform resets after verifying the user identity through support channels.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
