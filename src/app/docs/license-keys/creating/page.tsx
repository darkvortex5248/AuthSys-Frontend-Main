'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function CreatingKeysPage() {
  return (
    <DocPageLayout
      title="Creating License Keys"
      subtitle="Generate license keys through the AuthSys dashboard or programmatically via the API. Both methods offer full control over key type, duration, HWID locking, and metadata."
      sections={[
        {
          title: 'Via the Dashboard',
          content: (
            <>
              <p>Navigate to <strong>License Keys → Create Key</strong> in the dashboard. The creation form includes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Key Type</strong> — Time-based, lifetime, or usage-based.</li>
                <li><strong>Duration</strong> — For time-based keys, set the number of days until expiry (e.g., 30, 90, 365).</li>
                <li><strong>Max Activations</strong> — How many machines can activate this key simultaneously.</li>
                <li><strong>HWID Lock</strong> — Toggle hardware binding on/off.</li>
                <li><strong>Prefix</strong> — Custom prefix for easy identification (e.g., <code>PREMIUM</code>, <code>TRIAL</code>).</li>
                <li><strong>Metadata</strong> — Key-value pairs for custom data (tier, product version, etc.).</li>
              </ul>
              <Callout variant="tip">
                Use prefixes to organize keys by tier or product. For example, <code>TRIAL-...</code>, <code>BASIC-...</code>, <code>PREMIUM-...</code>. This makes it easy to identify key types at a glance.
              </Callout>
            </>
          ),
        },
        {
          title: 'Via the API',
          content: (
            <>
              <p>Create keys programmatically using the <code>POST /licenses</code> endpoint:</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/licenses \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "time_based",
    "prefix": "PREMIUM",
    "duration_days": 365,
    "max_activations": 3,
    "hwid_locked": true,
    "metadata": {
      "tier": "premium",
      "product": "my-app-v2",
      "customer_id": "usr_x1y2z3w4"
    }
  }'

Response:
{
  "id": "lic_a1b2c3d4e5f6",
  "key": "PREMIUM-A1B2C3D4-E5F6G7H8-I9J0K1L2-M3N4O5P6",
  "type": "time_based",
  "status": "active",
  "expires_at": "2027-06-15T10:00:00Z"
}`} lang="bash" title="API creation" />
            </>
          ),
        },
        {
          title: 'Batch Creation',
          content: (
            <>
              <p>Generate multiple keys at once using the batch endpoint:</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/licenses/batch \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "count": 100,
    "type": "time_based",
    "duration_days": 30,
    "max_activations": 1,
    "hwid_locked": true,
    "prefix": "TRIAL"
  }'

Response:
{
  "created": 100,
  "licenses": [
    {"id": "lic_...", "key": "TRIAL-A1B2C3D4-..."},
    {"id": "lic_...", "key": "TRIAL-E5F6G7H8-..."}
  ]
}`} lang="bash" title="Batch creation" />
              <p>You can also generate keys with <strong>seller tags</strong> for use with the Seller API — third-party sellers can generate keys on your behalf using their own API key:</p>
              <CodeBlock code={`// Create a seller account (dashboard or API)
POST /api/v1/developer/sellers
{
  "name": "Reseller XYZ",
  "plan_id": 2
}
// Response: { "seller_key": "seller_a1b2c3d4..." }

// Seller generates a key (no dashboard needed)
POST /api/v1/developer/sellers/generate-key
{
  "seller_key": "seller_a1b2c3d4...",
  "type": "time_based",
  "prefix": "RESELLER",
  "duration_days": 365
}`} lang="bash" title="Seller API key generation" />
              <Callout variant="info">
                Batch creation allows up to 1000 keys per request. For larger batches, split into multiple requests or contact support for Enterprise-level bulk operations.
              </Callout>
            </>
          ),
        },
        {
          title: 'Using SDKs',
          content: (
            <>
              <p>All SDKs support key creation with the same options as the API:</p>
              <CodeBlock code={`// Node.js SDK — create a license
const license = await client.createLicense({
  type: 'time_based',
  prefix: 'PREMIUM',
  durationDays: 365,
  maxActivations: 3,
  hwidLocked: true,
  metadata: {
    tier: 'premium',
    product: 'my-app-v2',
  },
});

console.log('Created key:', license.key);`} lang="typescript" title="sdk-creation.ts" />
              <CodeBlock code={`# Python SDK — create a license
license = await client.create_license(
    type="time_based",
    prefix="PREMIUM",
    duration_days=365,
    max_activations=3,
    hwid_locked=True,
    metadata={"tier": "premium", "product": "my-app-v2"},
)
print(f"Created key: {license.key}")`} lang="python" title="sdk-creation.py" />
            </>
          ),
        },
      ]}
    />
  );
}
