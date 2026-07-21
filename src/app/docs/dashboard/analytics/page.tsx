'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AnalyticsPage() {
  return (
    <DocPageLayout
      title="Analytics"
      subtitle="Visualize your license ecosystem with real-time charts and metrics. The Analytics section helps you understand activation trends, geographic distribution, and usage patterns."
      sections={[
        {
          title: 'Dashboard Overview',
          content: (
            <>
              <p>The Analytics dashboard provides a high-level summary of your account:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Total Licenses</strong> — Active, expired, suspended, and revoked counts.</li>
                <li><strong>Activations Today</strong> — Number of new activations in the last 24 hours.</li>
                <li><strong>Active Users</strong> — Unique HWIDs that validated in the last 7 days.</li>
                <li><strong>Validation Volume</strong> — Total validation requests per minute/hour/day.</li>
                <li><strong>Failure Rate</strong> — Percentage of failed validations (by reason).</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Geographic Distribution',
          content: (
            <>
              <p>The geographic map shows where your users are located based on their IP addresses. This data is anonymized and aggregated — individual user IPs are not stored.</p>
              <CodeBlock code={`// Fetch geographic analytics via API
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/analytics/geography?start_date=2026-01-01&end_date=2026-06-15"

Response:
{
  "total_countries": 47,
  "total_regions": 183,
  "top_countries": [
    {"country": "US", "validations": 124500, "percentage": 42.3},
    {"country": "DE", "validations": 32100, "percentage": 10.9},
    {"country": "GB", "validations": 28900, "percentage": 9.8},
    {"country": "JP", "validations": 15400, "percentage": 5.2}
  ]
}`} lang="bash" title="Geographic analytics" />
              <Callout variant="info">
                Use geographic data to identify unexpected usage patterns — a sudden spike from a country where you have no customers may indicate credential stuffing or a leaked license key.
              </Callout>
            </>
          ),
        },
        {
          title: 'Usage Tracking & Plan Limits',
          content: (
            <>
              <p>The analytics dashboard also shows your current usage against plan limits. This includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>App count</strong> vs max apps allowed</li>
                <li><strong>License keys</strong> vs max keys per month</li>
                <li><strong>API requests</strong> this month vs plan allowance</li>
                <li><strong>Team members</strong> vs max staff</li>
              </ul>
              <CodeBlock code={`// Fetch current usage via API
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/developer/usage/current"

Response:
{
  "apps": {"current": 3, "limit": 20},
  "keys": {"current": 145, "limit": 10000},
  "api_calls_this_month": 28400,
  "logins_this_month": 1203,
  "plan_tier": "developer"
}`} lang="bash" title="Usage tracking" />
              <Callout variant="tip">
                Usage data refreshes in real-time. If you are approaching a limit, upgrade your plan from the billing page to avoid service interruptions.
              </Callout>
            </>
          ),
        },
        {
          title: 'Exporting Data',
          content: (
            <>
              <p>All analytics data can be exported as CSV for external analysis:</p>
              <CodeBlock code={`// Export activation data
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/analytics/export?type=activations&format=csv&start=2026-01-01" \\
  -o activations.csv

// Export validation logs
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/analytics/export?type=validations&format=csv&start=2026-01-01" \\
  -o validations.csv`} lang="bash" title="Export CSV" />
            </>
          ),
        },
        {
          title: 'Custom Date Ranges',
          content: (
            <>
              <p>Compare metrics across custom date ranges using the date picker in the dashboard:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Presets</strong> — Today, Last 7 Days, Last 30 Days, Last Quarter, Last Year.</li>
                <li><strong>Custom Range</strong> — Select any start and end date.</li>
                <li><strong>Comparison</strong> — Toggle to show the previous period as a dotted overlay.</li>
              </ul>
              <Callout variant="tip">
                Enable <strong>comparison mode</strong> to spot trends. If activations dropped 40% compared to last month, investigate whether a distribution channel changed or a license key was leaked.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
