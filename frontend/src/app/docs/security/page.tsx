'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function SecurityOverview() {
  return (
    <DocPageLayout
      title="Security"
      subtitle="AuthSys employs a defense-in-depth approach to protect your software from piracy, tampering, and unauthorized access. Learn about our security architecture and how to configure it."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/security/hwid" className="text-[var(--primary)] hover:underline font-medium">HWID Locking</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Bind licenses to specific machines using hardware fingerprinting.</span>
                </li>
                <li>
                  <Link href="/docs/security/encryption" className="text-[var(--primary)] hover:underline font-medium">Encryption Overview</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— AES-256, RSA, and hashing algorithms used throughout the platform.</span>
                </li>
                <li>
                  <Link href="/docs/security/anti-tamper" className="text-[var(--primary)] hover:underline font-medium">Anti-Tamper</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Integrity verification, code obfuscation, and runtime protection.</span>
                </li>
                <li>
                  <Link href="/docs/security/threat-monitoring" className="text-[var(--primary)] hover:underline font-medium">Threat Monitoring</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Real-time detection of VPNs, proxies, brute force attacks, and anomalous behavior.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Security Philosophy',
          content: (
            <>
              <p>AuthSys follows a zero-trust architecture. Every request is authenticated, every payload is signed, and every license validation is performed server-side. The client SDK acts as a secure messenger — it never makes trust decisions locally.</p>
              <Callout variant="tip">
                Security is layered. Enable HWID locking <em>and</em> anti-tamper <em>and</em> threat monitoring for maximum protection. Each layer raises the bar for attackers.
              </Callout>
            </>
          ),
        },
        {
          title: 'Security Checklist',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Always validate server-side.</strong> Client-side validation can be bypassed — always call the AuthSys API to verify license status.</li>
                <li><strong>Use HWID binding</strong> to prevent license sharing across machines.</li>
                <li><strong>Enable tamper detection</strong> to detect debuggers, modified binaries, and virtualized environments.</li>
                <li><strong>Set up webhook alerts</strong> for suspicious activity like rapid-fire validation attempts.</li>
                <li><strong>Rotate API keys regularly</strong> through the dashboard settings page.</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
