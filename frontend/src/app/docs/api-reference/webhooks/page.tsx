'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function WebhooksAPIPage() {
  return (
    <DocPageLayout
      title="Webhooks"
      subtitle="AuthSys can send real-time HTTP callbacks (webhooks) to your server when events occur — license validations, activations, threat detections, and more."
      sections={[
        {
          title: 'Setting Up a Webhook',
          content: (
            <>
              <p>Configure webhooks in the dashboard under <strong>Settings → Webhooks</strong>. You can specify the target URL, the events to subscribe to, and a secret for signature verification.</p>
              <CodeBlock code={`// Register a webhook via API
curl -X POST https://api.authsys.io/v1/webhooks \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://myapp.com/api/authsys-webhook",
    "secret": "whsec_my_webhook_secret",
    "events": [
      "license.validated",
      "license.activated",
      "license.deactivated",
      "license.expired",
      "threat.detected",
      "user.created"
    ],
    "active": true
  }'`} lang="bash" title="Register webhook" />
              <Callout variant="tip">
                Use a strong, random webhook secret (minimum 32 characters). The secret is used to sign payloads so you can verify they came from AuthSys.
              </Callout>
            </>
          ),
        },
        {
          title: 'Payload Verification',
          content: (
            <>
              <p>Every webhook request includes an <code>X-AuthSys-Signature</code> header. Verify it using your webhook secret:</p>
              <CodeBlock code={`// Node.js webhook verification
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware example
app.post('/api/authsys-webhook', (req, res) => {
  const signature = req.headers['x-authsys-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process the event
  const event = req.body;
  handleEvent(event.type, event.payload);

  res.status(200).json({ received: true });
});`} lang="typescript" title="webhook-verification.ts" />
              <Callout variant="danger">
                Always verify the webhook signature before processing the payload. Without verification, attackers can send fake events to your server.
              </Callout>
            </>
          ),
        },
        {
          title: 'Event Types & Payloads',
          content: (
            <>
              <p>AuthSys emits the following webhook event types:</p>
              <CodeBlock code={`// license.validated — Fired on every successful validation
{
  "type": "license.validated",
  "payload": {
    "license_id": "lic_a1b2c3d4",
    "license_key": "PREMIUM-...",
    "hwid": "hwid_...",
    "valid": true,
    "timestamp": "2026-06-15T10:30:00Z"
  }
}

// license.activated — Fired on license activation
{
  "type": "license.activated",
  "payload": {
    "license_id": "lic_a1b2c3d4",
    "activation_id": "act_p1q2r3s4",
    "hwid": "hwid_...",
    "timestamp": "2026-06-15T10:30:00Z"
  }
}

// license.expired — Fired when a license expires
{
  "type": "license.expired",
  "payload": {
    "license_id": "lic_a1b2c3d4",
    "license_key": "PREMIUM-...",
    "expired_at": "2026-06-15T00:00:00Z",
    "timestamp": "2026-06-15T00:00:01Z"
  }
}

// threat.detected — Fired when a security threat is identified
{
  "type": "threat.detected",
  "payload": {
    "threat_type": "brute_force",
    "severity": "high",
    "source_ip": "198.51.100.42",
    "details": {
      "attempts": 47,
      "target": "license:ACTIVATE-ABCDE",
      "blocked": true
    },
    "timestamp": "2026-06-15T08:23:19Z"
  }
}`} lang="json" title="Event payloads" />
            </>
          ),
        },
        {
          title: 'Testing & Debugging',
          content: (
            <>
              <p>Send a test webhook event to verify your endpoint is configured correctly:</p>
              <CodeBlock code={`// Send test event
POST /api/v1/developer/webhooks/{ep_id}/test
Response 200: { "status": "sent", "delivery_id": "del_abc..." }

// View delivery logs
GET /api/v1/developer/webhooks/{ep_id}/logs
Response 200:
[
  {
    "id": "del_abc...",
    "event_type": "license.validated",
    "status": "delivered",
    "attempt": 1,
    "duration_ms": 234,
    "created_at": "2026-06-15T10:30:00Z"
  }
]

// Retry a failed delivery
POST /api/v1/developer/webhooks/{ep_id}/retry
Response 200: { "status": "queued", "delivery_id": "del_def..." }`} lang="bash" title="Webhook testing" />
            </>
          ),
        },
        {
          title: 'Retry Policy',
          content: (
            <>
              <p>If your webhook endpoint does not respond with a 2xx status within 10 seconds, AuthSys retries the delivery:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Retry 1: 30 seconds delay</li>
                <li>Retry 2: 2 minutes delay</li>
                <li>Retry 3: 10 minutes delay</li>
                <li>Retry 4: 1 hour delay</li>
                <li>Retry 5: 6 hours delay (final attempt)</li>
              </ul>
              <p>After 5 failed attempts, the webhook is marked as <code>failing</code> and you receive a dashboard notification. You can manually retry from the dashboard once the issue is resolved.</p>
              <Callout variant="info">
                Your webhook handler should respond with a 200 status as soon as it has received the event, even if processing is asynchronous. This prevents unnecessary retries.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
