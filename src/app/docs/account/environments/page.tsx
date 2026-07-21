'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function EnvironmentsPage() {
  return (
    <DocPageLayout
      title="App Environments"
      subtitle="Separate your application configuration into development, staging, and production environments. Each environment has its own app secret and owner ID."
      sections={[
        {
          title: 'Creating Environments',
          content: (
            <>
              <p>Environments are managed from <strong>Settings → System → App Environments</strong> or via the API:</p>
              <CodeBlock code={`// Create an environment
POST /api/v1/developer/environments
{
  "app_id": 1,
  "name": "staging"
}

// Response includes unique credentials:
{
  "id": 1,
  "name": "staging",
  "app_secret": "as_sec_staging_a1b2c3d4...",
  "owner_id": "as_oid_staging_e5f6g7h8..."
}

// List environments
GET /api/v1/developer/environments`} lang="bash" title="Environments API" />
              <Callout variant="info">
                Each environment is fully isolated — license keys, users, variables, blacklist, and analytics are separate. This lets you test without affecting production data.
              </Callout>
            </>
          ),
        },
        {
          title: 'Managing Environments',
          content: (
            <>
              <p>Delete environments or regenerate their secrets:</p>
              <CodeBlock code={`// Regenerate environment secret
POST /api/v1/developer/environments/{env_id}/regenerate-secret
Response: { "app_secret": "as_sec_new_..." }

// Delete environment
DELETE /api/v1/developer/environments/{env_id}
Response: { "status": "deleted" }`} lang="bash" title="Manage environments" />
              <Callout variant="warning">
                Regenerating a secret invalidates all SDK clients using the old secret. Update your environment variables immediately after regeneration.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
