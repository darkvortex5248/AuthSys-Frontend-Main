'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function ValidationFlowPage() {
  return (
    <DocPageLayout
      title="Validation Flow"
      subtitle="Learn how AuthSys validates license keys step by step — from the client SDK sending a request to the server returning a signed response with full status information."
      sections={[
        {
          title: 'End-to-End Validation',
          content: (
            <>
              <p>When your application calls <code>client.validate()</code>, the following sequence executes:</p>
              <ol className="list-decimal pl-5 space-y-3">
                <li><strong>HWID Collection</strong> — The SDK gathers the machine's hardware fingerprint (motherboard serial, CPU ID, MAC address, disk serial) and computes a salted SHA-256 hash.</li>
                <li><strong>Request Signing</strong> — The SDK signs the request payload with HMAC-SHA256 using your API secret. The signature is sent in the <code>X-Signature</code> header.</li>
                <li><strong>API Reception</strong> — The AuthYS API verifies the request signature, checks the API key permissions, and passes the request to the validation engine.</li>
                <li><strong>Server-Side Checks</strong> — The validation engine performs a series of checks in order: format validation → signature verification → status check → expiry check → HWID comparison → activation limit check → threat analysis.</li>
                <li><strong>Threat Analysis</strong> — The engine evaluates the request against threat monitoring rules (rate limits, geolocation, proxy detection, behavioral patterns).</li>
                <li><strong>Signed Response</strong> — The server returns a signed JSON response. The SDK verifies the response signature before returning the result to your application.</li>
              </ol>
            </>
          ),
        },
        {
          title: 'Validation Rules (Ordered)',
          content: (
            <>
              <p>The validation engine applies these rules in strict order. The first failing rule determines the rejection reason:</p>
              <CodeBlock code={`Validation Pipeline:
1. FORMAT_CHECK    → Is the key format valid? (5x5 groups, valid checksum)
2. SIGNATURE_CHECK → Is the HMAC signature valid? (anti-forgery)
3. STATUS_CHECK    → Is the key status "active"? (not suspended/revoked)
4. EXPIRY_CHECK    → Is the current date before the expiry date?
5. HWID_CHECK      → If HWID locked, does the provided HWID match?
6. ACTIVATION_CHECK→ Is the activation count below the max?
7. THREAT_CHECK    → Is the request from a blocked IP/VPN?
8. RATE_CHECK      → Is the API key within rate limits?`} lang="text" title="Validation pipeline" />
              <Callout variant="info">
                The first four checks (format, signature, status, expiry) happen in <strong>&lt;5ms</strong> and are cached at the CDN edge. HWID and activation checks require database lookups and take ~20-50ms.
              </Callout>
            </>
          ),
        },
        {
          title: 'Validation Response',
          content: (
            <>
              <p>The server returns a structured response with full details:</p>
              <CodeBlock code={`{
  "valid": false,
  "reason": "hwid_mismatch",
  "message": "License key is bound to a different device.",
  "checks": {
    "format": "passed",
    "signature": "passed",
    "status": "passed",
    "expiry": "passed",
    "hwid": "failed",
    "activation_limit": "skipped",
    "threat": "passed",
    "rate": "passed"
  },
  "license": {
    "id": "lic_a1b2c3d4",
    "type": "time_based",
    "status": "active",
    "expires_at": "2027-06-15T00:00:00Z",
    "bound_hwid": "hwid_x1y2z3w4...",
    "provided_hwid": "hwid_a1b2c3d4..."
  }
}`} lang="json" title="Validation response" />
            </>
          ),
        },
        {
          title: 'License-Based Login (Shadow Users)',
          content: (
            <>
              <p>AuthSys supports a license-based login flow where end users authenticate using only their license key. This automatically creates a <strong>shadow user</strong> — a minimal user record tied to the license:</p>
              <CodeBlock code={`// End user logs in with their license key
POST /api/v1/client/license-login
{
  "license_key": "PREMIUM-A1B2C3D4-...",
  "hwid": "hwid_x1y2z3w4..."
}

// Response:
{
  "token": "usr_sess_abc123...",
  "user": {
    "id": "shadow_uuid_...",
    "is_shadow": true,
    "license": {
      "type": "time_based",
      "expires_at": "2027-06-15T00:00:00Z"
    }
  }
}`} lang="bash" title="License-based login" />
              <Callout variant="info">
                Shadow users are read-only and cannot be modified manually. They are automatically cleaned up when the license expires. This is ideal for rapid onboarding where you want users to start with just a key.
              </Callout>
            </>
          ),
        },
        {
          title: 'Caching & Offline Mode',
          content: (
            <>
              <p>The SDK includes an optional caching layer that stores validated responses locally:</p>
              <CodeBlock code={`const client = new AuthSysClient({
  cache: {
    enabled: true,
    storage: 'file',             // 'file' | 'memory' | 'custom'
    ttlMinutes: 1440,            // 24 hours
    offlineGraceMinutes: 60,     // Allow offline use if cache exists
    encryptCache: true,          // Encrypt cache with HWID-derived key
  },
});

// Check cache status
const cacheInfo = client.getCacheInfo();
console.log('Cached until:', cacheInfo.expiresAt);
console.log('Offline mode:', cacheInfo.offlineMode);`} lang="typescript" title="caching.ts" />
              <Callout variant="warning">
                Caching reduces server load and enables offline functionality, but extends the window between license revocation and enforcement. For sensitive applications, use a short TTL or skip caching entirely.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
