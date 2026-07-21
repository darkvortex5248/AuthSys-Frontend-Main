'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function AccountSettingsOverview() {
  return (
    <DocPageLayout
      title="Account Settings"
      subtitle="Manage your account security, API keys, notifications, and application-level configurations. These settings help you customize AuthSys to your workflow."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/account/two-factor" className="text-[var(--primary)] hover:underline font-medium">Two-Factor Auth</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Add TOTP-based 2FA to protect your account.</span>
                </li>
                <li>
                  <Link href="/docs/account/api-keys" className="text-[var(--primary)] hover:underline font-medium">API Key Management</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Create and manage scoped API keys with granular permissions.</span>
                </li>
                <li>
                  <Link href="/docs/account/ip-whitelist" className="text-[var(--primary)] hover:underline font-medium">IP Whitelist</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Restrict access to trusted IP addresses and CIDR ranges.</span>
                </li>
                <li>
                  <Link href="/docs/account/notifications" className="text-[var(--primary)] hover:underline font-medium">Notifications</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Configure how you receive platform announcements and alerts.</span>
                </li>
                <li>
                  <Link href="/docs/account/backups" className="text-[var(--primary)] hover:underline font-medium">App Backup & Restore</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Create and restore app configuration snapshots.</span>
                </li>
                <li>
                  <Link href="/docs/account/environments" className="text-[var(--primary)] hover:underline font-medium">App Environments</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Separate development, staging, and production configs.</span>
                </li>
                <li>
                  <Link href="/docs/account/health" className="text-[var(--primary)] hover:underline font-medium">Health Monitoring</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Track uptime, errors, and configure log retention.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Security Best Practices',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-2">
                <li>Enable <strong>2FA</strong> on all accounts with access to production API keys</li>
                <li>Create <strong>scoped API keys</strong> with the minimum permissions needed</li>
                <li>Use <strong>IP whitelisting</strong> to restrict dashboard access to your office or VPN</li>
                <li>Rotate API keys <strong>every 90 days</strong> as a security best practice</li>
                <li>Configure <strong>health monitoring alerts</strong> to detect issues early</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
