'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function VariablesPage() {
  return (
    <DocPageLayout
      title="Variables"
      subtitle="Store and manage dynamic configuration values for your application directly in the AuthSys dashboard. Variables are fetched at runtime by the SDK and can be updated without redeploying your app."
      sections={[
        {
          title: 'What Are Variables?',
          content: (
            <>
              <p>Variables are key-value pairs stored on the AuthSys server and served to your application at runtime. They allow you to change application behavior without shipping a new update — perfect for feature flags, promotional messages, server URLs, and emergency toggles.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Global</strong> — Available to all instances of your app.</li>
                <li><strong>User-Specific</strong> — Scoped to a specific user or license key.</li>
                <li><strong>A/B Test</strong> — Served to a percentage of your user base.</li>
              </ul>
              <p><strong>User-scoped variables</strong> allow you to set values for individual users. Create a variable with <code>scope: "user"</code> and specify the user ID. User-scoped values override global values for that user.</p>
              <Callout variant="info">
                Variables are cached by the SDK for 5 minutes by default. Changes made in the dashboard are reflected in your app within the cache TTL.
              </Callout>
            </>
          ),
        },
        {
          title: 'Creating Variables',
          content: (
            <>
              <p>Variables can be created in the dashboard under <strong>Settings → Variables</strong>, or via the API:</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/variables \\
  -H "X-API-Key: as_api_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "MAINTENANCE_MODE",
    "value": "false",
    "type": "boolean",
    "scope": "global",
    "description": "Enable maintenance mode — blocks all app access",
    "metadata": {
      "owner": "devops",
      "ticket": "OPS-456"
    }
  }'

Response:
{
  "id": "var_abc123",
  "key": "MAINTENANCE_MODE",
  "value": "false",
  "type": "boolean",
  "scope": "global",
  "created_at": "2026-06-15T10:00:00Z"
}`} lang="bash" title="Create variable" />
            </>
          ),
        },
        {
          title: 'Fetching Variables in Your App',
          content: (
            <>
              <p>Use the SDK to fetch variables at runtime:</p>
              <CodeBlock code={`// Fetch all global variables
const vars = await client.getVariables();
if (vars.MAINTENANCE_MODE === 'true') {
  showMaintenanceBanner();
}

// Fetch user-specific variable
const userVar = await client.getVariable('FEATURE_FLAG_NEW_UI', {
  userId: 'usr_x1y2z3w4',
});
if (userVar.value === 'enabled') {
  enableNewUI();
}

// Type-safe variable access (TypeScript)
type AppVars = {
  MAINTENANCE_MODE: boolean;
  MAX_UPLOAD_SIZE_MB: number;
  WELCOME_MESSAGE: string;
  FEATURE_FLAG_NEW_UI: 'enabled' | 'disabled';
};

const vars = await client.getVariables<AppVars>();
console.log(vars.MAX_UPLOAD_SIZE_MB); // typed as number`} lang="typescript" title="fetch-variables.ts" />
            </>
          ),
        },
        {
          title: 'Use Cases',
          content: (
            <>
              <p>Variables are versatile. Here are some common use cases:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Feature Flags</strong> — Roll out new features gradually without redeploying.</li>
                <li><strong>Emergency Kill Switch</strong> — Immediately disable certain app functionality if a critical bug is discovered.</li>
                <li><strong>Promotional Messages</strong> — Update in-app banners, discount codes, and announcements in real time.</li>
                <li><strong>Configuration Tuning</strong> — Adjust timeouts, rate limits, and thresholds without patching.</li>
                <li><strong>A/B Testing</strong> — Serve different variable values to different user segments.</li>
              </ul>
              <Callout variant="tip">
                Use variables for <strong>non-sensitive</strong> configuration only. Never store secrets, API keys, or cryptographic material in variables — use the API keys section for that.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
