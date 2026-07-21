'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function TroubleshootingFAQPage() {
  return (
    <DocPageLayout
      title="Troubleshooting FAQ"
      subtitle="Common issues, error codes, and solutions when integrating and using AuthSys."
      sections={[
        {
          title: 'Why is my license validation returning "invalid_api_key"?',
          content: (
            <>
              <p>This error means the API key you are using is either incorrect, revoked, or does not have the required permissions for the endpoint you are calling.</p>
              <p><strong>Solutions:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Verify that the API key in your code matches the one in the dashboard under <strong>Settings → API Keys</strong>.</li>
                <li>Check that the API key has not been revoked. Revoked keys show as <code>revoked</code> in the dashboard.</li>
                <li>Ensure the API key's permissions include the endpoint you are calling (e.g., <code>licenses:validate</code> for validation).</li>
                <li>If you regenerated the key, update it in all environments (development, staging, production).</li>
              </ol>
              <CodeBlock code={`// Check API key permissions via verify endpoint
curl -X POST https://api.authsys.io/v1/auth/verify \\
  -H "X-API-Key: as_api_YOUR_KEY"

// Response will include permissions
{
  "valid": true,
  "session": {
    "permissions": ["licenses:read", "licenses:validate"]
  }
}`} lang="bash" title="Debug API key" />
            </>
          ),
        },
        {
          title: 'Why is validation returning "expired" for a newly created key?',
          content: (
            <>
              <p>This usually happens when there is a mismatch between the environment you are calling and where the key was created. Keys created in <code>sandbox</code> cannot be validated against the <code>production</code> environment, and vice versa.</p>
              <p>Additionally, check that the key's time zone was set correctly. The API accepts ISO 8601 timestamps in UTC. If you set a duration in days, it is calculated from the creation time in UTC.</p>
              <Callout variant="tip">
                Use the dashboard's <strong>Test Key</strong> feature to validate a key without writing code. Go to <strong>License Keys → Select a key → Test</strong> to see the full validation response.
              </Callout>
            </>
          ),
        },
        {
          title: 'Why is HWID binding failing?',
          content: (
            <>
              <p>HWID binding failures can occur for several reasons:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Virtual Machine</strong> — Some virtual machines report inconsistent or missing hardware identifiers. The C++ SDK can be configured to allow known VM environments.</li>
                <li><strong>Hardware Change</strong> — Replacing a GPU, motherboard, or hard drive changes the hardware fingerprint. Use the HWID change policy (grace period or support reset) to handle this.</li>
                <li><strong>Containerized Environment</strong> — Docker containers have limited hardware access. Use the <code>hostname</code> or <code>mac_address</code> components as fallbacks.</li>
                <li><strong>Permission Issues</strong> — On Linux, reading <code>/sys/class/dmi/id/product_serial</code> may require root. The SDK logs a warning and skips unreadable components.</li>
              </ul>
              <CodeBlock code={`// Debug HWID collection
const hwid = client.debugHwid();
console.log('Collected components:', hwid.components);
console.log('Fingerprint:', hwid.fingerprint);
console.log('Missing:', hwid.missing);`} lang="typescript" title="Debug HWID" />
            </>
          ),
        },
        {
          title: 'Why am I getting rate limited?',
          content: (
            <>
              <p>Rate limiting is triggered when you exceed the requests-per-second limit for your plan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Free: 10 req/s</li>
                <li>Pro: 100 req/s</li>
                <li>Enterprise: 1000 req/s</li>
              </ul>
              <p>Check the response headers to see your current rate limit status:</p>
              <CodeBlock code={`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1623762000
Retry-After: 45

{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Try again in 45 seconds.",
  "retry_after_seconds": 45
}`} lang="bash" title="Rate limit response" />
              <Callout variant="warning">
                If you consistently hit rate limits, implement client-side caching in your SDK (the SDK supports this natively) or upgrade your plan.
              </Callout>
            </>
          ),
        },
        {
          title: 'Why is my validation returning "rate_limit_exceeded"?',
          content: (
            <>
              <p>Each API key has a rate limit based on your plan tier. If you exceed this limit, validation requests are throttled:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Check headers</strong> — <code>X-RateLimit-Remaining</code> and <code>Retry-After</code> show your current status.</li>
                <li><strong>Implement caching</strong> — Enable the SDK cache to reduce redundant validation calls.</li>
                <li><strong>Check for leaks</strong> — If your API key is exposed in client code, attackers can consume your rate limit.</li>
                <li><strong>Upgrade plan</strong> — Higher tiers have higher rate limits.</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Webhook not being received?',
          content: (
            <>
              <p>If your webhook endpoint is not receiving events, check the following:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Your endpoint must respond with a 2xx status within 10 seconds.</li>
                <li>Your endpoint must be publicly accessible (no firewall blocking AuthSys IPs).</li>
                <li>Verify the webhook secret matches on both sides.</li>
                <li>Check the webhook delivery log in the dashboard under <strong>Settings → Webhooks → Delivery Log</strong>.</li>
              </ol>
              <p>AuthSys IP ranges for webhook delivery (add to your allowlist):</p>
              <CodeBlock code={`# AuthSys webhook IP ranges
34.120.84.0/24
35.192.45.0/24
54.88.120.0/24
44.204.78.0/24`} lang="text" title="Webhook IPs" />
            </>
          ),
        },
        {
          title: 'How do I migrate from another licensing platform?',
          content: (
            <>
              <p>AuthSys provides a migration tool that imports license keys, users, and activations from most major licensing platforms. Contact our support team to request a migration plan. The migration API allows bulk import:</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/migration/import \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "legacy_platform",
    "licenses": [
      {
        "key": "OLD-KEY-FORMAT",
        "type": "lifetime",
        "status": "active",
        "expires_at": null,
        "metadata": {"imported_from": "old_platform"}
      }
    ]
  }'`} lang="bash" title="Migration import" />
            </>
          ),
        },
      ]}
    />
  );
}
