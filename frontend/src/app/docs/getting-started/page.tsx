'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function GettingStartedOverview() {
  return (
    <DocPageLayout
      title="Getting Started"
      subtitle="Learn how to integrate AuthSys into your project from scratch. These guides walk you through account creation, SDK installation, and your first license validation."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/getting-started/installation" className="text-[var(--primary)] hover:underline font-medium">Installation & Setup</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Create your account, generate API keys, and configure your environment for Node.js, Python, and C#.</span>
                </li>
                <li>
                  <Link href="/docs/getting-started/quickstart" className="text-[var(--primary)] hover:underline font-medium">Quickstart Guide</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— A 5-minute integration walkthrough with end-to-end code examples.</span>
                </li>
                <li>
                  <Link href="/docs/getting-started/authentication" className="text-[var(--primary)] hover:underline font-medium">Authentication</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Understand API key authentication, JWT tokens, and session management.</span>
                </li>
                <li>
                  <Link href="/docs/getting-started/first-app" className="text-[var(--primary)] hover:underline font-medium">Your First App</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Build a complete license-protected application step by step.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Integration Overview',
          content: (
            <>
              <p>AuthSys provides a unified licensing platform that protects your software through hardware-bound license keys, real-time validation, and threat monitoring. The typical integration involves four steps:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Account Setup</strong> — Register on the AuthSys dashboard and generate your API credentials.</li>
                <li><strong>SDK Installation</strong> — Add the AuthSys SDK to your project via npm, pip, NuGet, or CMake.</li>
                <li><strong>License Validation</strong> — Call the validate endpoint on startup to check the user's license.</li>
                <li><strong>Security Hardening</strong> — Enable HWID locking, anti-tamper checks, and threat monitoring.</li>
              </ol>
              <Callout variant="info">
                All SDKs communicate over TLS 1.3 and use signed requests. Your API secret is never exposed to end users.
              </Callout>
            </>
          ),
        },
        {
          title: 'Prerequisites',
          content: (
            <>
              <p>Before you begin, make sure you have the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>An AuthSys account (<Link href="/register" className="text-[var(--primary)] hover:underline">register free</Link>)</li>
                <li>Node.js 18+ / Python 3.9+ / .NET 6+ / C++17 (depending on your target)</li>
                <li>A valid license key from the dashboard (use the trial key for testing)</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
