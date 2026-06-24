'use client';

import Link from 'next/link';
import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { Callout } from '@/components/docs/callout';

export default function AdvancedFeaturesOverview() {
  return (
    <DocPageLayout
      title="Advanced Features"
      subtitle="Extend your AuthSys integration with AI assistance, chat bots, custom domains, organizations, and more. These features are available on Developer and higher plans."
      sections={[
        {
          title: 'In This Section',
          content: (
            <>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <Link href="/docs/advanced/ai-assistant" className="text-[var(--primary)] hover:underline font-medium">AI Assistant</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Use natural language to interact with your license data and execute commands.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/bots" className="text-[var(--primary)] hover:underline font-medium">Discord & Telegram Bots</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Manage license keys directly from your chat platform.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/chat-rooms" className="text-[var(--primary)] hover:underline font-medium">In-App Live Chat</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Add real-time chat to your application for end users.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/custom-domains" className="text-[var(--primary)] hover:underline font-medium">Custom Domains</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Serve AuthSys from your own branded domain with automatic SSL.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/webhooks" className="text-[var(--primary)] hover:underline font-medium">Webhooks Guide</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Receive real-time events from AuthSys in your backend.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/organizations" className="text-[var(--primary)] hover:underline font-medium">Organizations</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Group multiple developer accounts under a shared organization.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/seller-api" className="text-[var(--primary)] hover:underline font-medium">Seller API</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Let third-party sellers generate license keys on your behalf.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/custom-responses" className="text-[var(--primary)] hover:underline font-medium">Custom Responses</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Brand your SDK response messages to match your app.</span>
                </li>
                <li>
                  <Link href="/docs/advanced/scheduled-actions" className="text-[var(--primary)] hover:underline font-medium">Scheduled Actions</Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">— Automate bulk operations like expiry and notifications.</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Plan Availability',
          content: (
            <>
              <p>Advanced features are available on the following plans:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Developer</strong> — AI Assistant, Webhooks, Bots, Custom Responses</li>
                <li><strong>Seller</strong> — Everything in Developer + Seller API, Chat Rooms, Scheduled Actions</li>
                <li><strong>Enterprise</strong> — Everything + Organizations, Custom Domains, Unlimited everything</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
