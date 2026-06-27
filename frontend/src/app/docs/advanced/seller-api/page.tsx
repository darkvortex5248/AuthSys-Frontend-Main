'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function SellerAPIPage() {
  return (
    <DocPageLayout
      title="Seller API"
      subtitle="The Seller API lets authorized sellers manage applications, license keys, users, and more. All requests are authenticated via the <code>seller-key</code> HTTP header."
      sections={[
        {
          title: 'Authentication',
          content: (
            <>
              <p>Every request requires a valid seller key sent as an HTTP header:</p>
              <CodeBlock code={`seller-key: sk_your_seller_key_here`} lang="bash" title="Authentication header" />
              <Callout variant="warning">
                The seller key is generated from the dashboard under <strong>Sellers</strong>. It acts as both authentication and authorization — keep it secret.
              </Callout>
            </>
          ),
        },
        {
          title: 'Key Management',
          content: (
            <>
              <p className="font-semibold mt-2">Generate a License Key</p>
              <CodeBlock code={`POST /api/v1/developer/sellers/generate-key
Headers: seller-key: sk_xxx
Body:    app_id=123&duration=30

{
  "status": "success",
  "key": "SELL-A1B2C3D4E5F6G7H8"
}`} lang="bash" title="Generate key" />
              <p className="font-semibold mt-4">Get Key Info</p>
              <CodeBlock code={`POST /api/v1/developer/sellers/key-info
Headers: seller-key: sk_xxx
Body:    key_value=SELL-A1B2C3D4E5F6G7H8

{
  "status": "success",
  "key": "SELL-A1B2C3D4E5F6G7H8",
  "key_type": "time",
  "is_paused": false,
  "duration_days": 30,
  "created_at": "2026-06-27T00:00:00",
  "expires_at": "2026-07-27T00:00:00",
  "seller_tag": "Reseller XYZ"
}`} lang="bash" title="Key info" />
              <p className="font-semibold mt-4">List Keys</p>
              <CodeBlock code={`POST /api/v1/developer/sellers/list-keys
Headers: seller-key: sk_xxx
Body:    app_id=123&limit=10`} lang="bash" title="List keys" />
              <p className="font-semibold mt-4">Delete / Ban / Unban Keys</p>
              <CodeBlock code={`POST /api/v1/developer/sellers/delete-key
POST /api/v1/developer/sellers/ban-key
POST /api/v1/developer/sellers/unban-key
POST /api/v1/developer/sellers/verify-key
Body:    key_value=SELL-A1B2C3D4E5F6G7H8`} lang="bash" title="Key actions" />
            </>
          ),
        },
        {
          title: 'User Management',
          content: (
            <>
              <CodeBlock code={`POST /api/v1/developer/sellers/add-user
  Body: app_id=123&username=johndoe&password=xxx&subscription=premium&expiry=365

POST /api/v1/developer/sellers/user-info
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/list-users
  Body: app_id=123&limit=10

POST /api/v1/developer/sellers/delete-user
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/ban-user
  Body: app_id=123&username=johndoe&reason=abuse

POST /api/v1/developer/sellers/unban-user
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/reset-hwid
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/extend-user
  Body: app_id=123&username=johndoe&days=30

POST /api/v1/developer/sellers/pause-user
POST /api/v1/developer/sellers/unpause-user
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/edit-username
  Body: app_id=123&username=johndoe&new_username=janedoe

POST /api/v1/developer/sellers/edit-email
  Body: app_id=123&username=johndoe&email=john@example.com

POST /api/v1/developer/sellers/reset-password
  Body: app_id=123&username=johndoe&new_password=xxx

POST /api/v1/developer/sellers/subtract
  Body: app_id=123&username=johndoe&days=7

POST /api/v1/developer/sellers/user-data
  Body: app_id=123&username=johndoe

POST /api/v1/developer/sellers/set-user-variable
  Body: app_id=123&username=johndoe&key=coins&value=100

POST /api/v1/developer/sellers/delete-user-variable
  Body: app_id=123&username=johndoe&key=coins

POST /api/v1/developer/sellers/delete-all-users
  Body: app_id=123

POST /api/v1/developer/sellers/delete-expired-users
  Body: app_id=123`} lang="bash" title="User management endpoints" />
            </>
          ),
        },
        {
          title: 'Application Info & Stats',
          content: (
            <>
              <CodeBlock code={`POST /api/v1/developer/sellers/app-details
  Body: app_id=123

  { "status": "success", "appdetails": { "name": "MyApp", "ownerid": "1", "secret": "...", "version": "1.0", "app_id": 123 } }

POST /api/v1/developer/sellers/app-stats
  Body: app_id=123

  { "status": "success", "app_id": 123, "total_users": 42, "total_keys": 100, "unused": 30, "used": 60, "paused": 10, ... }`} lang="bash" title="App endpoints" />
            </>
          ),
        },
        {
          title: 'Blacklist, Variables, Webhooks',
          content: (
            <>
              <CodeBlock code={`// Blacklist
POST /api/v1/developer/sellers/list-blacklists  Body: app_id=123
POST /api/v1/developer/sellers/add-blacklist     Body: app_id=123&value=hwid_xxx&type=hwid&reason=cheat
POST /api/v1/developer/sellers/delete-blacklist   Body: id=5
POST /api/v1/developer/sellers/delete-all-blacklists  Body: app_id=123

// Variables
POST /api/v1/developer/sellers/list-variables    Body: app_id=123
POST /api/v1/developer/sellers/add-variable      Body: app_id=123&key_name=welcome_msg&key_value=Hello&is_global=true
POST /api/v1/developer/sellers/delete-variable   Body: id=5
POST /api/v1/developer/sellers/delete-all-variables  Body: app_id=123

// Webhooks
POST /api/v1/developer/sellers/list-webhooks     Body: app_id=123
POST /api/v1/developer/sellers/delete-webhook    Body: id=5
POST /api/v1/developer/sellers/delete-all-webhooks  Body: app_id=123`} lang="bash" title="Configuration endpoints" />
            </>
          ),
        },
        {
          title: 'Sessions, Chats & IP Whitelist',
          content: (
            <>
              <CodeBlock code={`// Sessions
POST /api/v1/developer/sellers/list-sessions     Body: app_id=123
POST /api/v1/developer/sellers/kill-session      Body: session_id=5
POST /api/v1/developer/sellers/kill-all-sessions Body: app_id=123

// Chat Channels
POST /api/v1/developer/sellers/list-chats        Body: app_id=123
POST /api/v1/developer/sellers/add-channel       Body: app_id=123&name=general
POST /api/v1/developer/sellers/delete-channel    Body: room_id=5

// IP Whitelist
POST /api/v1/developer/sellers/list-whitelists   Body: app_id=123
POST /api/v1/developer/sellers/add-whitelist     Body: app_id=123&value=192.168.1.1&rule_type=ip
POST /api/v1/developer/sellers/delete-whitelist  Body: id=5`} lang="bash" title="More endpoints" />
            </>
          ),
        },
        {
          title: 'Validation Endpoints (No app_id needed)',
          content: (
            <>
              <p>These endpoints only require the seller key — useful for initial setup and verification:</p>
              <CodeBlock code={`POST /api/v1/developer/sellers/verify-seller-key
POST /api/v1/developer/sellers/verify-seller
Headers: seller-key: sk_xxx

{ "status": "success", "seller": "Reseller XYZ", "developer": "admin", "created_at": "2026-06-27T00:00:00" }`} lang="bash" title="Verification" />
            </>
          ),
        },
      ]}
    />
  );
}
