'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function EncryptionPage() {
  return (
    <DocPageLayout
      title="Encryption Overview"
      subtitle="AuthSys uses industry-standard encryption algorithms at every layer — in transit, at rest, and for license key signing. This page documents the cryptographic primitives used by the platform."
      sections={[
        {
          title: 'Encryption in Transit',
          content: (
            <>
              <p>All API traffic is encrypted using <strong>TLS 1.3</strong> with X25519 key exchange and AES-256-GCM cipher suites. The minimum supported TLS version is 1.2; connections using TLS 1.0 or 1.1 are rejected at the network edge.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cipher: <code>TLS_AES_256_GCM_SHA384</code></li>
                <li>Key Exchange: <code>X25519</code> (ECDHE)</li>
                <li>Certificate: ECDSA P-384 signed by our internal CA</li>
              </ul>
              <Callout variant="tip">
                All SDKs verify the server certificate against a pinned public key. This prevents man-in-the-middle attacks even if a CA is compromised.
              </Callout>
            </>
          ),
        },
        {
          title: 'Encryption at Rest',
          content: (
            <>
              <p>Sensitive data stored in AuthSys databases is encrypted using <strong>AES-256-GCM</strong> with per-row encryption keys. The key hierarchy is:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Master Key</strong> — Stored in a hardware security module (HSM), rotated quarterly.</li>
                <li><strong>Table Keys</strong> — Derived from the master key, unique per database table.</li>
                <li><strong>Row Keys</strong> — Random 256-bit keys generated per row, encrypted with the table key.</li>
              </ol>
              <CodeBlock code={`// Pseudocode for row-level encryption
function encryptRow(plaintext: Buffer, rowKey: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', rowKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}`} lang="typescript" title="row-encryption.ts" />
            </>
          ),
        },
        {
          title: 'License Key Signing',
          content: (
            <>
              <p>License keys are cryptographically signed to prevent forgery. The signing process uses <strong>HMAC-SHA256</strong> with a secret key known only to the AuthSys signing service.</p>
              <CodeBlock code={`// Verification pseudocode (for reference)
function verifyLicenseKey(key: string, signature: string): boolean {
  const payload = key.split('-').slice(0, -1).join('-');
  const expected = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 8);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`} lang="typescript" title="key-verification.ts" />
            </>
          ),
        },
        {
          title: 'Hashing Algorithms',
          content: (
            <>
              <p>AuthSys uses the following hash functions across the platform:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>SHA-256</strong> — HWID fingerprinting, checksums, and general integrity.</li>
                <li><strong>bcrypt</strong> — Password hashing (cost factor 12, salt auto-generated).</li>
                <li><strong>Argon2id</strong> — API secret derivation (available in Enterprise plan).</li>
              </ul>
              <CodeBlock code={`// PW hashing example using bcrypt
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash(userPassword, 12);
const match = await bcrypt.compare(inputPassword, hash);`} lang="typescript" title="password-hashing.ts" />
            </>
          ),
        },
      ]}
    />
  );
}
