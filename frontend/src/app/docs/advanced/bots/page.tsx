'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function BotsPage() {
  return (
    <DocPageLayout
      title="Discord & Telegram Bots"
      subtitle="Integrate RinoxAuth with Discord and Telegram to manage license keys directly from your chat platform. Bots run client-side — you host them yourself and they communicate with the Seller API."
      sections={[
        {
          title: 'Architecture',
          content: (
            <>
              <p>Bots are <strong>client-side</strong> applications that you download and run on your own machine or server. They use your <strong>Seller Key</strong> to call the Seller API endpoints directly — no server-side bot management is needed.</p>
              <CodeBlock code={`┌─────────────────┐         ┌──────────────┐
│  Discord/Telegram │ ◄───── │  Your Bot     │
│  (chat platform)  │        │  (your machine)│
└─────────────────┘         └──────┬───────┘
                                   │ Seller Key auth
                                   ▼
                           ┌──────────────┐
                           │  Seller API   │
                           │  (backend)    │
                           └──────────────┘`} lang="text" title="Architecture" />
            </>
          ),
        },
        {
          title: 'Getting Started',
          content: (
            <>
              <p>Both bot SDKs are located in the <code>sdk/</code> directory of the main repository:</p>
              <CodeBlock code={`sdk/
├── AuthSys-Discord-Bot-Example/   # Discord bot (discord.js, 88 commands)
├── AuthSys-Telegram-Bot-Example/  # Telegram bot (grammY, 25+ commands)
└── README.md                      # SDK overview`} lang="text" title="SDK structure" />
              <p>Before running a bot, you need:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>A <strong>Seller Key</strong> — generated from the dashboard (Sellers section)</li>
                <li>An <strong>Application ID</strong> — the app you want to manage</li>
                <li>A <strong>Bot Token</strong> — from the Discord Developer Portal or BotFather</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Discord Bot Setup',
          content: (
            <>
              <p>Navigate to <code>sdk/AuthSys-Discord-Bot-Example/</code>, install dependencies, and configure:</p>
              <CodeBlock code={`# Install dependencies
npm install

# Configure in .env or config.js
SELLER_KEY=sk_your_seller_key_here
APP_ID=your_application_id
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ...

# Start the bot
node .`} lang="bash" title="Discord bot setup" />
              <p>Available commands (88 total):</p>
              <CodeBlock code={`/genkey <type> <expiry>   — Generate a license key
/keyinfo <key>            — Look up key details
/delkey <key>             — Delete a license key
/ban <key>                — Ban/pause a key
/unban <key>              — Unban/resume a key
/blacklist <hwid/ip>      — Manage blacklist entries
/vars                     — Manage application variables
/stats                    — View application statistics
/appinfo                  — View application details
/users <action>           — Manage end users
/sessions                 — List active sessions
/whitelist                — Manage IP whitelist`} lang="bash" title="Discord bot commands" />
              <Callout variant="info">
                All commands call the Seller API using your seller key. The bot does not store any data — it proxies requests to the backend.
              </Callout>
            </>
          ),
        },
        {
          title: 'Telegram Bot Setup',
          content: (
            <>
              <p>Navigate to <code>sdk/AuthSys-Telegram-Bot-Example/</code>, install dependencies, and configure:</p>
              <CodeBlock code={`# Install dependencies
npm install

# Configure in .env or bot.ts
SELLER_KEY=sk_your_seller_key_here
APP_ID=your_application_id
TELEGRAM_TOKEN=1234567890:ABCdefGHIjklmNOPqrstUVwxyz

# Start the bot
npm start`} lang="bash" title="Telegram bot setup" />
              <p>Available commands (25+ total):</p>
              <CodeBlock code={`/create <type> <expiry>   — Generate a license key
/getinfo <key>            — Look up key details
/delkey <key>             — Delete a license key
/bankey <key>             — Ban/pause a key
/unbankey <key>           — Unban/resume a key
/getkeys                  — List recent keys
/appdetails               — View application info
/stats                    — View application statistics
/setseller <key>          — Switch seller key (runtime)`} lang="bash" title="Telegram bot commands" />
            </>
          ),
        },
        {
          title: 'Bot Security',
          content: (
            <>
              <p>Bot commands respect the permission level of the Discord role or Telegram user. Only users with appropriate roles can execute administrative commands.</p>
              <Callout variant="warning">
                Store your seller key and bot token securely. If compromised, an attacker could generate unlimited license keys. Revoke the seller key immediately from the dashboard and regenerate a new one.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
