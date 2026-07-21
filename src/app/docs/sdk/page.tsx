'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function SDKOverview() {
  return (
    <DocPageLayout
      title="SDK Integration"
      subtitle="AuthSys provides native SDKs for the most popular programming languages. Each SDK wraps the REST API with idiomatic functions for license validation, activation, and device management."
      sections={[
        {
          title: 'Available SDKs',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/sdk/javascript" className="text-[var(--primary)] hover:underline font-medium">JavaScript / TypeScript</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Node.js, browsers, and Electron via npm.</span>
                </li>
                <li>
                  <Link href="/docs/sdk/python" className="text-[var(--primary)] hover:underline font-medium">Python</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— PyPI package for Python 3.9+.</span>
                </li>
                <li>
                  <Link href="/docs/sdk/csharp" className="text-[var(--primary)] hover:underline font-medium">C# / .NET</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— NuGet package for .NET 6+ and .NET Framework 4.8+.</span>
                </li>
                <li>
                  <Link href="/docs/sdk/cpp" className="text-[var(--primary)] hover:underline font-medium">C++</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— CMake-based library for Windows, macOS, and Linux.</span>
                </li>
                <li>
                  <Link href="/docs/sdk/device-activation" className="text-[var(--primary)] hover:underline font-medium">Device Activation</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— No-login kill-switch SDK for desktop EXEs (15 languages).</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'SDK Architecture',
          content: (
            <>
              <p>Every SDK follows the same architecture:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Initialization</strong> — Configure the client with your API key and optional settings.</li>
                <li><strong>Authentication</strong> — Authenticate with the AuthSys backend to receive a session token.</li>
                <li><strong>Validation</strong> — Validate license keys locally or remotely with HWID binding.</li>
                <li><strong>Event Reporting</strong> — Send heartbeat and usage data to the dashboard.</li>
              </ol>
              <Callout variant="info">
                All SDKs are open-source and available on GitHub. You can audit the source code before integrating.
              </Callout>
            </>
          ),
        },
        {
          title: 'Common Methods',
          content: (
            <>
              <p>All SDKs expose these core methods:</p>
              <CodeBlock code={`# Method signatures (pseudocode)
client.initialize(apiKey: string, options?: ClientOptions): void
client.authenticate(): Promise<Session>
client.validate(licenseKey: string): Promise<ValidationResult>
client.activate(licenseKey: string, hwid?: string): Promise<ActivationResult>
client.deactivate(licenseKey: string): Promise<void>
client.getLicense(licenseKey: string): Promise<LicenseInfo>
client.reportHeartbeat(): Promise<void>`} lang="typescript" title="core-methods.ts" />
            </>
          ),
        },
      ]}
    />
  );
}
