'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function WebhooksGuidePage() {
  return (
    <DocPageLayout
      title="Webhooks Guide"
      subtitle="Receive real-time HTTP callbacks when events occur in your AuthSys account. Webhooks let you integrate with your own backend, Discord, Slack, or any HTTP endpoint."
      sections={[
        {
          title: 'Creating a Webhook Endpoint',
          content: (
            <>
              <p>Configure webhooks from <strong>Settings → System → Webhooks</strong> or via the API:</p>
              <CodeBlock code={`// Create webhook endpoint
POST /api/v1/developer/webhooks
{
  "url": "https://myapp.com/webhooks/authsys",
  "events": ["license.validated", "license.expired", "threat.detected"],
  "is_active": true
}

// List all endpoints
GET /api/v1/developer/webhooks

// Update endpoint
PUT /api/v1/developer/webhooks/{ep_id}
{
  "url": "https://myapp.com/webhooks/authsys-v2",
  "events": ["license.*"],
  "is_active": false
}`} lang="bash" title="Webhook CRUD" />
            </>
          ),
        },
        {
          title: 'Event Types',
          content: (
            <>
              <p>Available webhook event types:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>license.validated</code> — License key was validated</li>
                <li><code>license.activated</code> — License key was activated on a new machine</li>
                <li><code>license.deactivated</code> — License activation was removed</li>
                <li><code>license.expired</code> — License key reached its expiry date</li>
                <li><code>license.suspended</code> — License was manually suspended</li>
                <li><code>user.created</code> — New end user was created</li>
                <li><code>user.banned</code> — End user was banned</li>
                <li><code>threat.detected</code> — Security threat was identified</li>
              </ul>
              <p>Use wildcards like <code>license.*</code> to subscribe to all license events.</p>
            </>
          ),
        },
        {
          title: 'Testing & Delivery Logs',
          content: (
            <>
              <p>After creating an endpoint, send a test event and inspect delivery logs:</p>
              <CodeBlock code={`// Send test event
POST /api/v1/developer/webhooks/{ep_id}/test
Response: { "status": "sent", "delivery_id": "del_abc..." }

// View delivery logs
GET /api/v1/developer/webhooks/{ep_id}/logs
Response: [{ "event_type": "license.validated", "status": "delivered", "attempt": 1, "duration_ms": 234 }]

// Retry failed deliveries
POST /api/v1/developer/webhooks/{ep_id}/retry
Response: { "status": "queued" }`} lang="bash" title="Test & logs" />
            </>
          ),
        },
        {
          title: 'Signature Verification',
          content: (
            <>
              <p>Every webhook payload includes an <code>X-AuthSys-Signature</code> header. Verify it to ensure the request came from AuthSys:</p>
              <CodeBlock code={`function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`} lang="javascript" title="Signature verification" />
            </>
          ),
        },
      ]}
    />
  );
}
