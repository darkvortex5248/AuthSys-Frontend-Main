'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function DashboardOverview() {
  return (
    <DocPageLayout
      title="Dashboard Guide"
      subtitle="The AuthSys dashboard is your command center for managing licenses, users, and security settings. This guide covers every section of the dashboard."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/dashboard/analytics" className="text-[var(--primary)] hover:underline font-medium">Analytics</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Visualize license activations, geographic distribution, and usage trends.</span>
                </li>
                <li>
                  <Link href="/docs/dashboard/audit-logs" className="text-[var(--primary)] hover:underline font-medium">Audit Logs</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Track every action taken in your account with immutable logs.</span>
                </li>
                <li>
                  <Link href="/docs/dashboard/blacklist" className="text-[var(--primary)] hover:underline font-medium">Blacklist</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Block HWIDs, IPs, or users from accessing your software.</span>
                </li>
                <li>
                  <Link href="/docs/dashboard/variables" className="text-[var(--primary)] hover:underline font-medium">Variables</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Store and manage dynamic configuration values for your app.</span>
                </li>
                <li>
                  <Link href="/docs/dashboard/team" className="text-[var(--primary)] hover:underline font-medium">Team Management</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Manage team members, roles, and permissions.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Navigating the Dashboard',
          content: (
            <>
              <p>The dashboard is organized into six primary sections accessible from the left sidebar. Each section provides a focused view into a specific aspect of your AuthSys account. The top bar shows your current plan, usage stats, and quick actions like creating a new license key.</p>
              <Callout variant="info">
                Dashboard changes take effect immediately. There is no save button — most actions are auto-saved or confirmed with a single click.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
