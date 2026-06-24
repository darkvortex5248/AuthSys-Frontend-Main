'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function FAQOverview() {
  return (
    <DocPageLayout
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions about AuthSys, from general platform questions to billing and troubleshooting."
      sections={[
        {
          title: 'Question Categories',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/faq/general" className="text-[var(--primary)] hover:underline font-medium">General Questions</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Platform overview, features, and compatibility.</span>
                </li>
                <li>
                  <Link href="/docs/faq/troubleshooting" className="text-[var(--primary)] hover:underline font-medium">Troubleshooting</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Common issues, error codes, and solutions.</span>
                </li>
                <li>
                  <Link href="/docs/faq/billing" className="text-[var(--primary)] hover:underline font-medium">Billing & Plans</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Pricing, payment methods, refunds, and plan upgrades.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Still Have Questions?',
          content: (
            <>
              <p>If you can't find what you're looking for in the FAQ, reach out to our support team:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email: <code>support@authsys.io</code></li>
                <li>Dashboard live chat: Available 24/7 on all paid plans</li>
                <li>Discord: <code>discord.gg/authsys</code> (community support)</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
