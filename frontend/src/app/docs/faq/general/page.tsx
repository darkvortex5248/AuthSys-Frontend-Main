'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function GeneralFAQPage() {
  return (
    <DocPageLayout
      title="General FAQ"
      subtitle="Common questions about the AuthSys platform, features, and capabilities."
      sections={[
        {
          title: 'What is AuthSys?',
          content: (
            <>
              <p>AuthSys is a cloud-based license management and authentication platform. It helps software developers protect their applications from piracy, manage license keys, monitor usage, and enforce licensing policies — all through a single API and dashboard.</p>
            </>
          ),
        },
        {
          title: 'How does AuthSys differ from other licensing solutions?',
          content: (
            <>
              <p>AuthSys combines license management with enterprise-grade security features out of the box:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>HWID Locking</strong> — Bind licenses to specific machines with hardware fingerprinting.</li>
                <li><strong>Real-Time Threat Monitoring</strong> — Built-in VPN/proxy detection, brute force protection, and behavioral analysis.</li>
                <li><strong>Multi-Language SDKs</strong> — First-class SDKs for JavaScript, Python, C#, and C++ with consistent APIs.</li>
                <li><strong>Immutable Audit Logs</strong> — Every action is logged and cannot be tampered with.</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Which platforms and languages does AuthSys support?',
          content: (
            <>
              <p>AuthSys provides official SDKs for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Node.js / TypeScript (npm: <code>@authsys/node</code>)</li>
                <li>Python 3.9+ (PyPI: <code>authsys-python</code>)</li>
                <li>C# / .NET 6+ (NuGet: <code>AuthSys.SDK</code>)</li>
                <li>C++17 (GitHub: <code>authsys/authsys-cpp</code>)</li>
              </ul>
              <p>In addition to official SDKs, you can use the REST API directly from any language that supports HTTP. Community SDKs are available for Rust, Go, and Java (see GitHub).</p>
              <Callout variant="tip">
                The REST API is the foundation. If your language doesn't have an SDK, you can call the API directly with any HTTP client. Our documentation includes curl examples for every endpoint.
              </Callout>
            </>
          ),
        },
        {
          title: 'Can I use AuthSys for free?',
          content: (
            <>
              <p>Yes. The Free plan includes 500 active license keys, full API access, HWID locking, and basic analytics. It's perfect for indie developers and small projects. Paid plans remove the license cap and add advanced features like custom roles, extended audit retention, and priority support.</p>
            </>
          ),
        },
        {
          title: 'Is my data encrypted?',
          content: (
            <>
              <p>Yes. All data is encrypted in transit using TLS 1.3 and at rest using AES-256-GCM with per-row encryption keys. License keys are signed with HMAC-SHA256 to prevent forgery. See the <a href="/docs/security/encryption" className="text-[var(--primary)] hover:underline">Encryption Overview</a> for details.</p>
            </>
          ),
        },
        {
          title: 'Does AuthSys have an SLA?',
          content: (
            <>
              <p>Yes. Pro plans include a 99.9% uptime SLA. Enterprise plans include a 99.99% SLA with dedicated infrastructure and 24/7 phone support. Our historical uptime over the last 12 months is 99.97%.</p>
            </>
          ),
        },
      ]}
    />
  );
}
