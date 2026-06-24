'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function HealthMonitoringPage() {
  return (
    <DocPageLayout
      title="Health Monitoring"
      subtitle="Monitor the health and performance of your applications. AuthSys provides uptime tracking, health checks, and configurable log retention."
      sections={[
        {
          title: 'Health Dashboard',
          content: (
            <>
              <p>The health monitoring dashboard shows real-time status for each of your applications:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Uptime</strong> — Percentage of successful health checks over time</li>
                <li><strong>Logins</strong> — Number of user logins in the selected period</li>
                <li><strong>Active Users</strong> — Unique users that interacted with your app recently</li>
                <li><strong>Errors</strong> — Failed validation attempts and error counts</li>
              </ul>
              <CodeBlock code={`// Get health dashboard data
GET /api/v1/developer/health/dashboard/{app_id}
Response: { "uptime": 99.7, "logins_today": 143, "active_users": 89, "errors_today": 2 }

// Get health check records
GET /api/v1/developer/health/checks/{app_id}
Response: [{ "status": "pass", "latency_ms": 45, "checked_at": "..." }]`} lang="bash" title="Health API" />
            </>
          ),
        },
        {
          title: 'Log Retention Configuration',
          content: (
            <>
              <p>Configure how long health check logs and activity data are retained:</p>
              <CodeBlock code={`// Get current retention config
GET /api/v1/developer/health/retention/{app_id}
Response: { "retention_days": 30, "auto_cleanup": true }

// Update retention
PUT /api/v1/developer/health/retention/{app_id}
{
  "retention_days": 90,
  "auto_cleanup": true
}`} lang="bash" title="Log retention" />
              <Callout variant="info">
                Longer retention periods provide better historical data for trend analysis but consume more storage. Auto-cleanup ensures old data is purged automatically.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
