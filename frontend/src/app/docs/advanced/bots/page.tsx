'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function BotsPage() {
  return (
    <DocPageLayout
      title="Discord & Telegram Bots"
      subtitle="Integrate AuthSys with Discord and Telegram to manage license keys directly from your chat platform. Let your team generate, check, and manage keys without opening the dashboard."
      sections={[
        {
          title: 'Setting Up a Discord Bot',
          content: (
            <>
              <p>Configure your Discord bot from the dashboard under <strong>Discord Bot</strong> or via the API:</p>
              <CodeBlock code={`// Configure Discord bot
POST /api/v1/developer/bots/config
{
  "platform": "discord",
  "token": "MTIzNDU2Nzg5MDEyMzQ1Njc4OQ...",
  "guild_id": "123456789012345678",
  "prefix": "!"
}

// Available slash commands (auto-registered)
// /genkey <type> <duration> — Generate a new license key
// /keyinfo <key> — Get information about a key
// /pausekey <key> — Pause a license key
// /resumekey <key> — Resume a paused key
// /delkey <key> — Delete a license key`} lang="bash" title="Discord bot setup" />
              <Callout variant="info">
                The bot automatically registers slash commands with Discord. Make sure your bot has the applications.commands scope enabled in the Discord Developer Portal.
              </Callout>
            </>
          ),
        },
        {
          title: 'Setting Up a Telegram Bot',
          content: (
            <>
              <p>Telegram bot setup follows a similar pattern:</p>
              <CodeBlock code={`// Configure Telegram bot
POST /api/v1/developer/bots/config
{
  "platform": "telegram",
  "token": "1234567890:ABCdefGHIjklmNOPqrstUVwxyz",
  "prefix": "/"
}

// Available commands:
// /start — Welcome message with usage info
// /genkey — Generate a license key
// /keyinfo <key> — Look up a key
// /pause <key> — Pause a key`} lang="bash" title="Telegram bot setup" />
            </>
          ),
        },
        {
          title: 'Bot Security',
          content: (
            <>
              <p>Bot commands respect the permission level of the Discord role or Telegram user that issued them. Only users with the appropriate role in your server can execute administrative commands.</p>
              <Callout variant="warning">
                Store your bot token securely. If compromised, an attacker could generate unlimited license keys. Revoke and regenerate the token immediately from your bot platform dashboard.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
