'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function CustomResponsesPage() {
  return (
    <DocPageLayout
      title="Custom Response Messages"
      subtitle="Customize the error and success messages that AuthSys returns to your end users through the SDK. Tailor responses to match your brand voice and provide better user guidance."
      sections={[
        {
          title: 'Response Categories',
          content: (
            <>
              <p>You can customize responses in three categories:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Initialization</strong> — Messages returned during SDK init (version check, maintenance mode, etc.)</li>
                <li><strong>Authentication</strong> — Messages for login, registration, and session management</li>
                <li><strong>General</strong> — All other SDK responses (validation results, error messages, etc.)</li>
              </ul>
              <CodeBlock code={`// Get current response messages
GET /api/v1/developer/settings/response-messages

// Update response messages
PUT /api/v1/developer/settings/response-messages
{
  "init": {
    "maintenance_mode": "Our servers are under maintenance. Please try again in 30 minutes.",
    "version_mismatch": "Please update your app to the latest version."
  },
  "auth": {
    "login_success": "Welcome back! Loading your dashboard...",
    "invalid_credentials": "The email or password you entered is incorrect."
  },
  "general": {
    "rate_limited": "Too many requests. Please wait a moment and try again."
  }
}

// Reset to defaults
DELETE /api/v1/developer/settings/response-messages`} lang="bash" title="Custom responses API" />
            </>
          ),
        },
        {
          title: 'Use Cases',
          content: (
            <>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Brand Consistency</strong> — Match your app's tone and terminology</li>
                <li><strong>Better UX</strong> — Provide actionable guidance instead of generic error codes</li>
                <li><strong>Multi-Language</strong> — Serve translated messages to different user segments</li>
                <li><strong>A/B Testing</strong> — Experiment with different messaging to improve conversion</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
