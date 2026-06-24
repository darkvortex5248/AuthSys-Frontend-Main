'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function BillingFAQPage() {
  return (
    <DocPageLayout
      title="Billing & Plans FAQ"
      subtitle="Questions about pricing, payment methods, refunds, and plan upgrades."
      sections={[
        {
          title: 'What plans does AuthSys offer?',
          content: (
            <>
              <p>AuthSys offers three plans:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Free</strong> — 500 active license keys, basic analytics, HWID locking, community support. No credit card required.</li>
                <li><strong>Pro</strong> — $49/month — 10,000 active license keys, advanced analytics, 1-year audit retention, email support, 99.9% SLA.</li>
                <li><strong>Enterprise</strong> — Custom pricing — Unlimited license keys, custom roles, 7-year audit retention, phone support, dedicated infrastructure, 99.99% SLA, SSO/SAML.</li>
              </ul>
              <Callout variant="info">
                All plans include full API access, all SDKs, real-time threat monitoring, and webhook support. You can switch plans at any time. Payment is processed through Stripe (cards) or manual methods (bKash, Nagad, Crypto) in select regions.
              </Callout>
            </>
          ),
        },
        {
          title: 'What payment methods do you accept?',
          content: (
            <>
              <p>We accept the following payment methods:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Credit/Debit cards (Visa, Mastercard, American Express, Discover)</li>
                <li>PayPal</li>
                <li>Bank transfers (Enterprise plans only, annual billing)</li>
                <li>Cryptocurrency (Enterprise plans, by arrangement)</li>
              </ul>
              <p>All prices are in USD. Enterprise invoices support NET-30 payment terms.</p>
            </>
          ),
        },
        {
          title: 'Can I get a refund?',
          content: (
            <>
              <p>Yes. We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied within the first 14 days, contact support for a full refund — no questions asked.</p>
              <p>After the 14-day window, refunds are handled on a case-by-case basis. Partial refunds may be issued for unused time on annual plans.</p>
              <Callout variant="warning">
                Refunds result in the immediate suspension of all active license keys associated with your account. Export your data before requesting a refund.
              </Callout>
            </>
          ),
        },
        {
          title: 'How do I upgrade or downgrade my plan?',
          content: (
            <>
              <p>Plan changes can be made from the dashboard under <strong>Settings → Billing → Change Plan</strong>.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Upgrading</strong> — Changes take effect immediately. You are charged the prorated difference for the remainder of the billing cycle.</li>
                <li><strong>Downgrading</strong> — Changes take effect at the end of the current billing cycle. No refunds for the current period.</li>
              </ul>
              <p>When downgrading, ensure your active license count is within the new plan's limit. If you exceed the limit, you will be prompted to suspend or delete keys before the downgrade completes.</p>
            </>
          ),
        },
        {
          title: 'What happens if my payment fails?',
          content: (
            <>
              <p>If a payment fails, we follow this process:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Day 0</strong> — Payment attempt fails. We send an email notification.</li>
                <li><strong>Day 3</strong> — Second payment attempt. Email reminder sent.</li>
                <li><strong>Day 7</strong> — Third payment attempt. Dashboard banner shown.</li>
                <li><strong>Day 14</strong> — Account downgraded to Free plan. License keys with more activations than the Free plan allows are suspended.</li>
              </ol>
              <p>You can update your payment method at any time from the billing page. Once payment succeeds, any suspended licenses are automatically reactivated.</p>
              <Callout variant="tip">
                Enable the <code>billing.payment_failed</code> webhook to receive real-time alerts when a payment fails, allowing you to proactively reach out to your customers.
              </Callout>
            </>
          ),
        },
        {
          title: 'Can I cancel my account?',
          content: (
            <>
              <p>Yes. To cancel your account, go to <strong>Settings → Billing → Cancel Account</strong>. Cancellation is immediate and non-reversible. All license keys will be revoked, and audit data will be deleted after the retention period.</p>
              <p>Before canceling, we recommend exporting any data you need:</p>
              <CodeBlock code={`# Export all license data before canceling
curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/licenses/export?format=json" \\
  -o my-licenses.json

curl -H "X-API-Key: as_api_..." \\
  "https://api.authsys.io/v1/audit-logs/export?format=json&start=2020-01-01" \\
  -o my-audit-logs.json`} lang="bash" title="Export before canceling" />
            </>
          ),
        },
      ]}
    />
  );
}
