'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AuthenticationPage() {
  return (
    <DocPageLayout
      title="Authentication"
      subtitle="AuthSys uses a multi-layered authentication model. API keys authenticate your application, JWT tokens authenticate sessions, Google OAuth for social login, and TOTP two-factor authentication for enhanced security."
      sections={[
        {
          title: 'API Key Authentication',
          content: (
            <>
              <p>Every API request must include your secret API key in the <code>X-API-Key</code> header. API keys are generated from the dashboard and can be scoped to specific permissions (read-only, write, admin).</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/auth/verify \\
  -H "X-API-Key: as_api_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"license_key": "ABCDE-12345-FGHIJ-67890"}'`} lang="bash" title="API key example" />
              <Callout variant="warning">
                API keys are secrets. If your key is exposed in client-side code, an attacker can use it to validate or revoke licenses. Always proxy API calls through your backend.
              </Callout>
            </>
          ),
        },
        {
          title: 'JWT Session Tokens',
          content: (
            <>
              <p>After authenticating with an API key, the SDK receives a short-lived JWT session token (<code>sess_*</code>). This token is used for subsequent requests and automatically refreshed before expiry.</p>
              <CodeBlock code={`// JWT payload structure
{
  "sub": "sess_abc123def456",
  "app_id": "app_xyz789",
  "permissions": ["licenses:read", "licenses:validate"],
  "iat": 1749999999,
  "exp": 1750003599,
  "iss": "authsys.io"
}`} lang="json" title="decoded JWT" />
              <p>Tokens expire after 60 minutes by default. The SDK handles automatic refresh — you do not need to manage token lifecycle manually.</p>
            </>
          ),
        },
        {
          title: 'HMAC Request Signing',
          content: (
            <>
              <p>For enhanced security, AuthSys supports optional HMAC-SHA256 request signing. When enabled, every request includes an <code>X-Signature</code> header computed from the request body and your API secret.</p>
              <CodeBlock code={`function signRequest(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return hmac.digest('hex');
}

// Usage
const body = JSON.stringify({ license_key: 'ABCDE-12345' });
const signature = signRequest(body, process.env.AUTHSYS_API_KEY!);

fetch('https://api.authsys.io/v1/licenses/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.AUTHSYS_API_KEY!,
    'X-Signature': signature,
    'Content-Type': 'application/json',
  },
  body,
});`} lang="typescript" title="hmac-signing.ts" />
              <Callout variant="info">
                HMAC signing is recommended for server-to-server integrations. It prevents replay attacks and ensures payload integrity.
              </Callout>
            </>
          ),
        },
        {
          title: 'Google OAuth (Social Login)',
          content: (
            <>
              <p>AuthSys supports one-click login via Google OAuth. This is ideal for applications where you want to reduce password fatigue and increase conversion rates.</p>
              <CodeBlock code={`// Client-side redirect
window.location.href = 'https://api.authsys.io/v1/auth/google-login';

// On success, the browser redirects back with a session cookie
// The SDK restores the session automatically
const session = await client.restoreSession();`} lang="typescript" title="google-oauth.ts" />
              <Callout variant="info">
                Google OAuth creates a new developer account if the email does not exist yet. The account is automatically assigned the Free plan and can be upgraded from the billing page.
              </Callout>
            </>
          ),
        },
        {
          title: 'Two-Factor Authentication (2FA)',
          content: (
            <>
              <p>Protect your account with TOTP-based two-factor authentication. Once enabled, login requires both your password and a 6-digit code from your authenticator app.</p>
              <p>Setup is done from the dashboard under <strong>Settings → Account → Two-Factor Auth</strong>:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>Enable 2FA</strong> — a QR code and backup codes are displayed</li>
                <li>Scan the QR code with Google Authenticator, Authy, or any TOTP app</li>
                <li>Enter the 6-digit code from your app to verify setup</li>
                <li>Save your backup codes in a secure location — each code can be used once if you lose access to your authenticator app</li>
              </ol>
              <p>During login, after entering your password, you will be prompted for the 2FA code:</p>
              <CodeBlock code={`# Standard login flow
POST /api/v1/developer/auth/login
{
  "username": "you@example.com",
  "password": "your_password"
}
# Response: { "requires_2fa": true, "temp_token": "tmp_..." }

# Second step — verify 2FA
POST /api/v1/developer/auth/2fa/login-verify
{
  "temp_token": "tmp_...",
  "code": "123456"
}
# Response: { "access_token": "eyJ...", "token_type": "bearer" }`} lang="bash" title="2FA login flow" />
              <Callout variant="warning">
                If you lose both your authenticator app and all backup codes, account recovery requires contacting support. Enable 2FA only after saving your backup codes.
              </Callout>
            </>
          ),
        },
        {
          title: 'Session Management',
          content: (
            <>
              <p>Sessions are managed automatically via httpOnly cookies, but you can control them manually through the API:</p>
              <CodeBlock code={`// List active sessions
const sessions = await client.listSessions();

// Revoke a specific session (forces re-authentication)
await client.revokeSession('sess_abc123def456');

// Revoke all sessions (e.g. after password change)
await client.revokeAllSessions();

// Check if current session is still valid
const isValid = await client.checkSession();`} lang="typescript" title="session-management.ts" />
              <p>Sessions automatically expire after 24 hours of inactivity. The <strong>Remember Me</strong> option extends this to 30 days using a persistent httpOnly cookie.</p>
            </>
          ),
        },
      ]}
    />
  );
}
