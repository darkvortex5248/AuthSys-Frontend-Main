'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function APIKeysPage() {
  return (
    <DocPageLayout
      title="API Key Management"
      subtitle="API keys authenticate your applications and SDKs with AuthSys. Manage scoped keys with granular permissions for different use cases and environments."
      sections={[
        {
          title: 'Creating API Keys',
          content: (
            <>
              <p>API keys are managed from <strong>Settings → Security → API Keys</strong> or via the API:</p>
              <CodeBlock code={`// Create an API key
POST /api/v1/developer/security/apikeys
{
  "name": "Production Server",
  "scopes": ["licenses:read", "licenses:validate"]
}

// Response: { "id": 1, "key": "as_api_a1b2c3d4...", "scopes": [...], "created_at": "..." }

// List API keys
GET /api/v1/developer/security/apikeys

// Available scopes
GET /api/v1/developer/security/apikeys/scopes`} lang="bash" title="API key management" />
              <Callout variant="warning">
                The API key secret is shown only once at creation. Store it securely in a vault or environment variable. Never commit it to version control.
              </Callout>
            </>
          ),
        },
        {
          title: 'Managing Keys',
          content: (
            <>
              <p>Toggle, delete, or revoke API keys as needed:</p>
              <CodeBlock code={`// Toggle key active/inactive
PUT /api/v1/developer/security/apikeys/{key_id}/toggle
Response: { "is_active": false }

// Delete API key
DELETE /api/v1/developer/security/apikeys/{key_id}

// Revoke all keys (emergency)
POST /api/v1/developer/security/revoke-all-keys
Response: { "revoked_count": 5 }`} lang="bash" title="Key management" />
            </>
          ),
        },
        {
          title: 'Available Scopes',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>licenses:read</code> — View license keys and their metadata</li>
                <li><code>licenses:write</code> — Create, update, and delete license keys</li>
                <li><code>licenses:validate</code> — Validate license keys (most common)</li>
                <li><code>users:read</code> — View end users</li>
                <li><code>users:write</code> — Create, update, and delete users</li>
                <li><code>analytics:read</code> — View analytics data</li>
                <li><code>webhooks:write</code> — Manage webhook endpoints</li>
                <li><code>admin</code> — Full access (use sparingly)</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
