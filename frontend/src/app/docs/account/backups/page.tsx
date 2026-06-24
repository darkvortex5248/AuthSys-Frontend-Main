'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AppBackupsPage() {
  return (
    <DocPageLayout
      title="App Backup & Restore"
      subtitle="Create snapshots of your application configuration for safekeeping. Backups include app settings, webhooks, IP rules, blacklist entries, and variables."
      sections={[
        {
          title: 'Creating a Backup',
          content: (
            <>
              <p>Create a backup from <strong>Settings → System → Backups</strong> or via the API:</p>
              <CodeBlock code={`// Create a backup
POST /api/v1/developer/backups
{
  "app_id": 1,
  "name": "Pre-update snapshot"
}

// List backups
GET /api/v1/developer/backups

// Get backup details
GET /api/v1/developer/backups/{backup_id}`} lang="bash" title="Backup API" />
              <Callout variant="info">
                Backups capture a complete snapshot of your app config, webhook endpoints, IP whitelist rules, blacklist entries, global variables, and log retention settings. License keys and end users are NOT included.
              </Callout>
            </>
          ),
        },
        {
          title: 'Restoring from a Backup',
          content: (
            <>
              <p>Restore a backup to revert your app configuration to a previous state:</p>
              <CodeBlock code={`// Restore backup
POST /api/v1/developer/backups/{backup_id}/restore
Response: { "status": "restored", "app_id": 1 }`} lang="bash" title="Restore backup" />
              <Callout variant="warning">
                Restoring a backup overwrites your current app configuration. This action cannot be undone. Consider creating a fresh backup before restoring.
              </Callout>
            </>
          ),
        },
        {
          title: 'Deleting Backups',
          content: (
            <>
              <p>Remove old backups that are no longer needed:</p>
              <CodeBlock code={`DELETE /api/v1/developer/backups/{backup_id}
Response: { "status": "deleted" }`} lang="bash" title="Delete backup" />
            </>
          ),
        },
      ]}
    />
  );
}
