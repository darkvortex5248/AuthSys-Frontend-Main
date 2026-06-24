'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function APIReferenceOverview() {
  return (
    <DocPageLayout
      title="API Reference"
      subtitle="The AuthSys REST API is the foundation of the platform. Every SDK wraps these endpoints. All requests require authentication and are rate-limited per API key."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/api-reference/auth" className="text-[var(--primary)] hover:underline font-medium">Authentication</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Login, register, verify, and session endpoints.</span>
                </li>
                <li>
                  <Link href="/docs/api-reference/license-keys" className="text-[var(--primary)] hover:underline font-medium">License Keys</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Full CRUD for license keys: create, validate, activate, deactivate, list, update, delete.</span>
                </li>
                <li>
                  <Link href="/docs/api-reference/users" className="text-[var(--primary)] hover:underline font-medium">Users</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— User management endpoints for your customer base.</span>
                </li>
                <li>
                  <Link href="/docs/api-reference/webhooks" className="text-[var(--primary)] hover:underline font-medium">Webhooks</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Webhook event types, payload schemas, and signing verification.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Base URL',
          content: (
            <>
              <p>All API endpoints are hosted at:</p>
              <CodeBlock code="https://api.authsys.io/v1" lang="text" title="Base URL" />
              <Callout variant="warning">
                The base URL changed from <code>https://api.authsys.com/v1</code> to <code>https://api.authsys.io/v1</code> in March 2026. Update your integrations if you are using the old endpoint.
              </Callout>
            </>
          ),
        },
        {
          title: 'Authentication',
          content: (
            <>
              <p>Every request must include an <code>X-API-Key</code> header with your secret API key. Optionally, include an <code>X-Session-Token</code> header for authenticated session requests.</p>
              <CodeBlock code={`curl -H "X-API-Key: as_api_YOUR_SECRET_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.authsys.io/v1/licenses/validate`} lang="bash" title="curl example" />
              <Callout variant="danger">
                Never expose your API secret key in client-side code. Use server-side proxies or the SDK's secure mode.
              </Callout>
            </>
          ),
        },
        {
          title: 'Rate Limits',
          content: (
            <>
              <p>Rate limits vary by plan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Free: 10 req/s</li>
                <li>Pro: 100 req/s</li>
                <li>Enterprise: 1000 req/s (customizable)</li>
              </ul>
              <p>Rate limit headers are returned in every response (<code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>).</p>
            </>
          ),
        },
      ]}
    />
  );
}
