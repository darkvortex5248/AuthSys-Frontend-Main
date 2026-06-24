'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function LicenseKeysOverview() {
  return (
    <DocPageLayout
      title="License Keys"
      subtitle="License keys are the core of AuthSys. They control who can use your software, for how long, and on which machines. Learn how to create, manage, and validate them."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/license-keys/creating" className="text-[var(--primary)] hover:underline font-medium">Creating Keys</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Generate license keys via the dashboard and API.</span>
                </li>
                <li>
                  <Link href="/docs/license-keys/validation" className="text-[var(--primary)] hover:underline font-medium">Validation Flow</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— How validation works end-to-end, from client request to server response.</span>
                </li>
                <li>
                  <Link href="/docs/license-keys/types" className="text-[var(--primary)] hover:underline font-medium">Key Types</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Time-based, lifetime, and usage-based license models.</span>
                </li>
                <li>
                  <Link href="/docs/license-keys/best-practices" className="text-[var(--primary)] hover:underline font-medium">Best Practices</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Recommendations for key generation, storage, and validation strategies.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'How License Keys Work',
          content: (
            <>
              <p>A license key is a cryptographically signed string that encodes licensing metadata. When a user enters their key, the SDK sends it to AuthSys servers along with the machine's hardware fingerprint. The server verifies the signature, checks the key's status and expiry, compares the HWID, and returns a signed validation result.</p>
              <Callout variant="tip">
                License keys are generated using a secure CSPRNG and signed with an HMAC-SHA256 key known only to AuthSys. This makes it impossible to forge valid keys.
              </Callout>
            </>
          ),
        },
        {
          title: 'Key Format',
          content: (
            <>
              <p>License keys follow the format <code>XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</code> (5 groups of 5 uppercase alphanumeric characters) with a checksum digit for typo detection.</p>
              <CodeBlock code={`AUTH1-4K9M2-XB7QJ-8P3W6-5VN1T`} lang="text" title="Example key" />
            </>
          ),
        },
      ]}
    />
  );
}
