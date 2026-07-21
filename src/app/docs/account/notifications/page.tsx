'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function NotificationsPage() {
  return (
    <DocPageLayout
      title="Notifications"
      subtitle="Stay informed with platform announcements and status updates. AuthSys delivers notifications through in-app alerts, email, and webhooks."
      sections={[
        {
          title: 'Announcements',
          content: (
            <>
              <p>Platform admins can send announcements to all developers. These appear as in-app notifications and are also sent via email if enabled:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Info</strong> — General updates, new features, tips</li>
                <li><strong>Warning</strong> — Upcoming maintenance, deprecation notices</li>
                <li><strong>Critical</strong> — Security incidents, urgent downtime</li>
              </ul>
              <CodeBlock code={`// Get notifications
GET /api/v1/developer/notifications

// Get unread count
GET /api/v1/developer/notifications/unread-count
Response: { "count": 3 }

// Mark as read
PUT /api/v1/developer/notifications/read
{ "notification_ids": [1, 2, 3] }`} lang="bash" title="Notifications API" />
            </>
          ),
        },
        {
          title: 'Notification Preferences',
          content: (
            <>
              <p>Configure how you receive notifications from <strong>Settings → Account → Notifications</strong>:</p>
              <CodeBlock code={`// Get preferences
GET /api/v1/developer/auth/preferences

// Update notification preferences
PUT /api/v1/developer/auth/preferences
{
  "notifications": {
    "email": true,
    "in_app": true,
    "digest": "daily"
  }
}`} lang="bash" title="Notification preferences" />
              <Callout variant="info">
                Critical announcements are always delivered regardless of your preferences. You can choose between real-time email and daily digest.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
