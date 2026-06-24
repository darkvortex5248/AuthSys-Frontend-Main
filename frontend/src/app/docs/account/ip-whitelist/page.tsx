'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function IPWhitelistPage() {
  return (
    <DocPageLayout
      title="IP Whitelist"
      subtitle="Control which IP addresses and CIDR ranges can access your AuthSys account. IP whitelisting adds a network-level security layer to protect your API keys."
      sections={[
        {
          title: 'Adding Whitelist Rules',
          content: (
            <>
              <p>Manage IP whitelist rules from <strong>Settings → Security → IP Whitelist</strong> or via the API:</p>
              <CodeBlock code={`// Add a whitelist rule
POST /api/v1/developer/security/ipwhitelist
{
  "rule_type": "ip",
  "value": "203.0.113.0/24",
  "is_blocklist": false
}

// Add a blocklist rule
POST /api/v1/developer/security/ipwhitelist
{
  "rule_type": "range",
  "value": "198.51.100.0-198.51.100.255",
  "is_blocklist": true
}

// List all rules
GET /api/v1/developer/security/ipwhitelist`} lang="bash" title="IP whitelist" />
            </>
          ),
        },
        {
          title: 'Managing Rules',
          content: (
            <>
              <p>Toggle rules on/off or delete them as needed:</p>
              <CodeBlock code={`// Toggle a rule
PUT /api/v1/developer/security/ipwhitelist/{rule_id}/toggle
Response: { "is_active": false }

// Delete a rule
DELETE /api/v1/developer/security/ipwhitelist/{rule_id}`} lang="bash" title="Manage rules" />
              <Callout variant="warning">
                Whitelist rules are strict — if you whitelist an IP range, all other IPs are blocked. Blocklist rules only block specific IPs. You can mix both types.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
