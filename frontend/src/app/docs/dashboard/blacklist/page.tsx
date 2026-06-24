'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function BlacklistPage() {
  return (
    <DocPageLayout
      title="Blacklist Management"
      subtitle="Block HWIDs, IP addresses, users, or license keys from accessing your software. The blacklist is checked during every validation request."
      sections={[
        {
          title: 'Blacklist Types',
          content: (
            <>
              <p>AuthSys supports four blacklist target types:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>HWID</strong> — Block a specific machine fingerprint. Useful after detecting abuse or hardware theft.</li>
                <li><strong>IP Address</strong> — Block individual IPs or CIDR ranges. Automatically populated by the threat monitoring engine.</li>
                <li><strong>User</strong> — Block a user account. All licenses assigned to that user are also blocked.</li>
                <li><strong>License Key</strong> — Block a specific license key (equivalent to revoking it).</li>
              </ul>
              <Callout variant="warning">
                Blacklisting an IP address can affect multiple users behind a NAT or corporate proxy. Use HWID or user-level blacklisting for precise targeting.
              </Callout>
            </>
          ),
        },
        {
          title: 'Adding Blacklist Entries',
          content: (
            <>
              <CodeBlock code={`// Add HWID to blacklist via API
curl -X POST https://api.authsys.io/v1/blacklist \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "hwid",
    "value": "hwid_a1b2c3d4e5f6g7h8i9j0...",
    "reason": "License abuse detected — multiple activations across 50 machines",
    "expires_at": null,                 // null = permanent
    "metadata": {
      "reported_by": "support_team",
      "ticket_id": "TKT-12345"
    }
  }'

Response:
{
  "id": "bl_abc123def",
  "type": "hwid",
  "value": "hwid_a1b2c3d4e5f6g7h8i9j0...",
  "active": true,
  "created_at": "2026-06-15T10:30:00Z"
}`} lang="bash" title="Add to blacklist" />
            </>
          ),
        },
        {
          title: 'Temporary vs. Permanent Bans',
          content: (
            <>
              <p>Blacklist entries can be temporary (with automatic expiry) or permanent:</p>
              <CodeBlock code={`// Temporary ban — expires after 24 hours
curl -X POST https://api.authsys.io/v1/blacklist \\
  -d '{
    "type": "ip",
    "value": "198.51.100.42",
    "reason": "Brute force attack detected",
    "expires_at": "2026-06-16T10:30:00Z"
  }'

// Permanent ban
curl -X POST https://api.authsys.io/v1/blacklist \\
  -d '{
    "type": "hwid",
    "value": "hwid_...",
    "reason": "Confirmed fraud",
    "expires_at": null
  }'`} lang="bash" title="Temporary vs permanent" />
              <Callout variant="info">
                Temporary bans are ideal for automated threat responses (e.g., rate limiting, brute force). Permanent bans should be reserved for confirmed fraud cases after manual review.
              </Callout>
            </>
          ),
        },
        {
          title: 'IP Whitelist (Allowlist)',
          content: (
            <>
              <p>In addition to the blacklist, AuthSys supports IP whitelisting. Whitelist rules allow only specified IPs or CIDR ranges to access your application — everything else is blocked by default.</p>
              <CodeBlock code={`// Add IP whitelist rule
POST /api/v1/developer/security/ipwhitelist
{
  "rule_type": "ip",
  "value": "203.0.113.0/24",
  "is_blocklist": false
}

// Toggle a rule on/off
PUT /api/v1/developer/security/ipwhitelist/{rule_id}/toggle`} lang="bash" title="IP whitelist" />
              <Callout variant="warning">
                IP whitelisting is strict — if you whitelist an IP range, all other IPs are automatically blocked. Use with caution, especially if your users have dynamic IPs.
              </Callout>
            </>
          ),
        },
        {
          title: 'Managing the Blacklist',
          content: (
            <>
              <p>View, search, and remove blacklist entries from the dashboard or API:</p>
              <CodeBlock code={`// List all active blacklist entries
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/blacklist?type=hwid&active=true&page=1&per_page=50"

// Remove a blacklist entry
curl -X DELETE https://api.authsys.io/v1/blacklist/bl_abc123def \\
  -H "X-API-Key: as_api_..."

// Bulk remove expired entries
curl -X POST https://api.authsys.io/v1/blacklist/cleanup \\
  -H "X-API-Key: as_api_..." \\
  -d '{"remove_expired": true}'`} lang="bash" title="Blacklist management" />
            </>
          ),
        },
      ]}
    />
  );
}
