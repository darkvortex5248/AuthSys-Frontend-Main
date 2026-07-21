'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function ScheduledActionsPage() {
  return (
    <DocPageLayout
      title="Scheduled Actions"
      subtitle="Automate repetitive tasks with scheduled actions. AuthSys can automatically expire, suspend, or notify based on your configured schedules."
      sections={[
        {
          title: 'Creating Scheduled Actions',
          content: (
            <>
              <p>Scheduled actions let you automate bulk operations on license keys and users:</p>
              <CodeBlock code={`// Create a scheduled action
POST /api/v1/developer/scheduled
{
  "app_id": 1,
  "action_type": "bulk_expire",
  "target_type": "license_keys",
  "target_filter": { "type": "time_based", "expires_before": "2026-07-01" },
  "scheduled_at": "2026-06-30T00:00:00Z"
}

// List scheduled actions
GET /api/v1/developer/scheduled

// Delete a pending action
DELETE /api/v1/developer/scheduled/{action_id}

// Execute immediately
POST /api/v1/developer/scheduled/{action_id}/execute`} lang="bash" title="Scheduled actions" />
            </>
          ),
        },
        {
          title: 'Available Action Types',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>bulk_expire</strong> — Expire matching license keys automatically</li>
                <li><strong>bulk_suspend</strong> — Suspend matching keys or users</li>
                <li><strong>bulk_notify</strong> — Send notifications to matching users or key holders</li>
              </ul>
              <Callout variant="info">
                The background scheduler runs every 60 seconds and executes due actions. All actions are logged to the audit trail.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
