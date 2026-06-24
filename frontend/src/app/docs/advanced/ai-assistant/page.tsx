'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AIAssistantPage() {
  return (
    <DocPageLayout
      title="AI Assistant & Agent"
      subtitle="AuthSys includes a built-in AI assistant powered by multiple provider backends (OpenAI, Gemini, Claude). Execute natural language commands and automate workflows directly from the dashboard."
      sections={[
        {
          title: 'Overview',
          content: (
            <>
              <p>The AI Assistant is available on <strong>Developer</strong> and higher plans. It provides two modes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Chat Mode</strong> — Ask questions about your account, license data, and analytics in natural language.</li>
                <li><strong>Agent Mode</strong> — Execute actions like creating license keys, suspending users, or sending announcements using plain English commands.</li>
              </ul>
              <Callout variant="info">
                The AI uses your configured provider (OpenAI, Gemini, or Claude). You can switch providers in the dashboard settings.
              </Callout>
            </>
          ),
        },
        {
          title: 'AI Agent Commands',
          content: (
            <>
              <p>The AI agent can execute the following types of commands:</p>
              <CodeBlock code={`// Natural language examples:
"Create 10 trial keys with 30-day expiry"
"Ban user with email abuse@example.com"
"Show me my top 5 most validated keys"
"Send an announcement to all users about maintenance"
"What's my current usage against plan limits?"`} lang="text" title="Agent commands" />
              <p>Agent commands are processed through a secure action registry that validates permissions before execution. All agent actions are logged to the audit trail.</p>
            </>
          ),
        },
        {
          title: 'Multi-Provider Support',
          content: (
            <>
              <p>AuthSys supports multiple AI providers. The admin can configure which provider to use:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>OpenAI</strong> — GPT-4o and GPT-4o-mini</li>
                <li><strong>Google Gemini</strong> — Gemini 1.5 Pro and Flash</li>
                <li><strong>Anthropic Claude</strong> — Claude 3.5 Sonnet and Haiku</li>
                <li><strong>Custom Endpoint</strong> — Any OpenAI-compatible API</li>
              </ul>
              <Callout variant="tip">
                You can test your AI configuration from the admin dashboard under AI Control before rolling it out to developers.
              </Callout>
            </>
          ),
        },
        {
          title: 'Rate Limits & Quotas',
          content: (
            <>
              <p>AI usage is subject to rate limits based on your plan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Developer</strong> — 100 AI chat requests per day</li>
                <li><strong>Seller</strong> — 500 AI chat requests per day</li>
                <li><strong>Enterprise</strong> — 2000 AI chat requests per day</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
