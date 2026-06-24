'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AuditLogsPage() {
  return (
    <DocPageLayout
      title="Audit Logs"
      subtitle="Every action taken in your AuthSys account is recorded in an immutable audit trail. Audit logs help you track changes, investigate incidents, and maintain compliance."
      sections={[
        {
          title: 'What Gets Logged',
          content: (
            <>
              <p>AuthSys logs the following categories of events:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>License Events</strong> — Creation, validation, activation, deactivation, suspension, revocation, deletion.</li>
                <li><strong>User Events</strong> — Account creation, updates, suspension, deletion.</li>
                <li><strong>API Events</strong> — API key generation, rotation, revocation.</li>
                <li><strong>Security Events</strong> — Failed authentication, rate limit breaches, threat detections.</li>
                <li><strong>Settings Changes</strong> — Configuration updates, webhook changes, team member changes.</li>
              </ul>
              <CodeBlock code={`// Sample audit log entry
{
  "id": "audit_abc123def456",
  "action": "license.created",
  "actor": {
    "type": "api_key",
    "id": "key_admin_key_1",
    "name": "Production API Key"
  },
  "target": {
    "type": "license",
    "id": "lic_a1b2c3d4e5f6",
    "key": "PREMIUM-..."
  },
  "changes": {
    "type": "time_based",
    "duration_days": 365,
    "hwid_locked": true
  },
  "ip_address": "203.0.113.42",
  "user_agent": "AuthSys-SDK/2.1.0 Node.js/22",
  "timestamp": "2026-06-15T10:30:00Z"
}`} lang="json" title="Audit log entry" />
            </>
          ),
        },
        {
          title: 'Searching & Filtering',
          content: (
            <>
              <p>The audit logs page includes powerful search and filtering capabilities:</p>
              <CodeBlock code={`// Search audit logs via API
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/audit-logs? \\
    action=license.created& \\
    actor_type=api_key& \\
    start_date=2026-06-01& \\
    end_date=2026-06-15& \\
    search=lic_a1b2c3d4& \\
    page=1& \\
    per_page=50"

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 12,
    "total_pages": 1
  }
}`} lang="bash" title="Search audit logs" />
                  <p>You can also clear activity logs for an app directly from the analytics page. This removes all log entries for that app but does not affect license validation or user data.</p>
              <CodeBlock code={`DELETE https://api.authsys.io/v1/analytics/{app_id}/logs
Response: { "status": "cleared", "deleted_count": 1523 }`} lang="bash" title="Clear app logs" />
              <Callout variant="tip">
                Use the search field to find logs related to a specific license key, user ID, or API key. The search index includes all fields in the log entry.
              </Callout>
            </>
          ),
        },
        {
          title: 'Retention Policy',
          content: (
            <>
              <p>Audit log retention depends on your plan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Free</strong> — 30 days</li>
                <li><strong>Pro</strong> — 1 year</li>
                <li><strong>Enterprise</strong> — 7 years (configurable)</li>
              </ul>
              <p>Logs are write-once, read-many. They cannot be edited or deleted before the retention period ends. Enterprise customers can export logs to their own SIEM system via webhook or S3 integration.</p>
            </>
          ),
        },
        {
          title: 'Exporting Audit Logs',
          content: (
            <>
              <p>Export audit logs as CSV or JSON for external analysis or compliance:</p>
              <CodeBlock code={`# Export as JSON
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/audit-logs/export?format=json&start=2026-01-01&end=2026-06-15" \\
  -o audit-logs.json

# Export as CSV
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/audit-logs/export?format=csv&start=2026-01-01&end=2026-06-15" \\
  -o audit-logs.csv`} lang="bash" title="Export audit logs" />
            </>
          ),
        },
      ]}
    />
  );
}
