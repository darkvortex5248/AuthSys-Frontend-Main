'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function TwoFactorPage() {
  return (
    <DocPageLayout
      title="Two-Factor Authentication (2FA)"
      subtitle="Add an extra layer of security to your AuthSys account with TOTP-based two-factor authentication. 2FA requires both your password and a time-based code from your authenticator app."
      sections={[
        {
          title: 'Enabling 2FA',
          content: (
            <>
              <p>Enable 2FA from <strong>Settings → Account → Two-Factor Auth</strong>:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>Enable 2FA</strong></li>
                <li>Scan the QR code with Google Authenticator, Authy, or any TOTP-compatible app</li>
                <li>Enter the 6-digit code from your app to verify</li>
                <li>Save your backup codes — each can be used once if you lose access to your authenticator</li>
              </ol>
              <CodeBlock code={`// API: Setup 2FA
POST /api/v1/developer/auth/2fa/setup
Response: { "secret": "JBSWY3DPEHPK3PXP", "qr_code": "data:image/png;base64,...", "backup_codes": ["ABC123", ...] }

// API: Verify and enable
POST /api/v1/developer/auth/2fa/verify
{ "code": "123456" }
Response: { "status": "enabled" }`} lang="bash" title="2FA setup API" />
            </>
          ),
        },
        {
          title: 'Logging in with 2FA',
          content: (
            <>
              <p>Once 2FA is enabled, the login flow changes to two steps:</p>
              <CodeBlock code={`// Step 1: Login with credentials
POST /api/v1/developer/auth/login
{ "username": "you@example.com", "password": "your_password" }
// Response includes: { "requires_2fa": true, "temp_token": "tmp_..." }

// Step 2: Verify 2FA code
POST /api/v1/developer/auth/2fa/login-verify
{ "temp_token": "tmp_...", "code": "123456" }
// Response: { "access_token": "eyJ...", "token_type": "bearer" }`} lang="bash" title="2FA login flow" />
            </>
          ),
        },
        {
          title: 'Disabling 2FA',
          content: (
            <>
              <p>You can disable 2FA at any time using your password and a current 2FA code:</p>
              <CodeBlock code={`POST /api/v1/developer/auth/2fa/disable
{ "password": "your_password", "code": "123456" }
Response: { "status": "disabled" }`} lang="bash" title="Disable 2FA" />
              <Callout variant="warning">
                If you lose both your authenticator app and all backup codes, contact support for account recovery. For security, this process may take up to 48 hours.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
