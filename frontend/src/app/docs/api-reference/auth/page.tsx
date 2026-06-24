'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function AuthAPIPage() {
  return (
    <DocPageLayout
      title="Authentication API"
      subtitle="Endpoints for managing authentication — login, register, Google OAuth, 2FA, session management, email verification, and password recovery."
      sections={[
        {
          title: 'POST /auth/login',
          content: (
            <>
              <p>Authenticate with your API key and receive a session token. This is the first call every SDK makes.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/auth/login
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "scope": "full",           // "full" | "readonly" | "licenses:validate"
  "ttl_minutes": 60          // Session TTL (default: 60, max: 1440)
}

Response 200:
{
  "session_token": "sess_eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-06-15T11:30:00Z",
  "permissions": ["licenses:read", "licenses:validate", "licenses:write"]
}

Response 401:
{
  "error": "invalid_api_key",
  "message": "The provided API key is invalid or has been revoked."
}`} lang="bash" title="POST /auth/login" />
            </>
          ),
        },
        {
          title: 'POST /auth/register',
          content: (
            <>
              <p>Register a new user account. Requires an admin API key with the <code>users:write</code> permission.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/auth/register
Content-Type: application/json
X-API-Key: as_api_ADMIN_KEY

Request Body:
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe",
  "metadata": {
    "company": "Acme Corp",
    "referral_source": "docs"
  }
}

Response 201:
{
  "user_id": "usr_a1b2c3d4",
  "email": "user@example.com",
  "created_at": "2026-06-15T10:00:00Z",
  "requires_email_verification": true
}`} lang="bash" title="POST /auth/register" />
              <Callout variant="info">
                Passwords must be at least 12 characters and contain an uppercase letter, a lowercase letter, and a number. AuthSys hashes passwords with bcrypt (cost 12).
              </Callout>
            </>
          ),
        },
        {
          title: 'POST /auth/verify',
          content: (
            <>
              <p>Verify a session token or API key without performing any action. Useful for health checks and token validation.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/auth/verify
Content-Type: application/json
X-API-Key: as_api_...
X-Session-Token: sess_eyJhbGciOiJIUzI1NiIs...

Request Body: (empty)

Response 200:
{
  "valid": true,
  "session": {
    "id": "sess_a1b2c3d4",
    "created_at": "2026-06-15T10:00:00Z",
    "expires_at": "2026-06-15T11:00:00Z",
    "permissions": ["licenses:read", "licenses:validate"]
  }
}`} lang="bash" title="POST /auth/verify" />
            </>
          ),
        },
        {
          title: 'POST /auth/session/refresh',
          content: (
            <>
              <p>Refresh an expiring session token before it expires. The SDK calls this automatically.</p>
              <CodeBlock code={"POST https://api.authsys.io/v1/auth/session/refresh\nContent-Type: application/json\nX-Session-Token: sess_eyJhbGciOiJIUzI1NiIs...\n\nRequest Body:\n{\n  \"extend_by_minutes\": 60\n}\n\nResponse 200:\n{\n  \"session_token\": \"sess_new_token_here...\",\n  \"expires_at\": \"2026-06-15T12:00:00Z\"\n}"} lang="bash" title="POST /auth/session/refresh" />
              <Callout variant="warning">
                Session tokens can only be refreshed within 10 minutes of expiry. After expiry, you must re-authenticate with your API key.
              </Callout>
            </>
          ),
        },
        {
          title: 'POST /auth/google-login',
          content: (
            <>
              <p>Authenticate or register using a Google OAuth token. If the email does not exist, a new account is created automatically.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/auth/google-login
Content-Type: application/json

{
  "google_token": "ya29.a0AfH6SMB..."
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "is_new_account": false
}`} lang="bash" title="POST /auth/google-login" />
            </>
          ),
        },
        {
          title: 'POST /auth/2fa/setup',
          content: (
            <>
              <p>Generate a TOTP secret and QR code for setting up two-factor authentication.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/2fa/setup

Response 200:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,...",
  "backup_codes": ["ABC123", "DEF456", "GHI789"]
}`} lang="bash" title="POST /auth/2fa/setup" />
            </>
          ),
        },
        {
          title: 'POST /auth/2fa/verify',
          content: (
            <>
              <p>Verify a TOTP code to confirm 2FA setup is working. After verification, 2FA is enabled on the account.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/2fa/verify
{ "code": "123456" }

Response 200: { "status": "enabled" }`} lang="bash" title="POST /auth/2fa/verify" />
            </>
          ),
        },
        {
          title: 'POST /auth/2fa/login-verify',
          content: (
            <>
              <p>Complete a login that requires 2FA. Called after the login endpoint returns <code>requires_2fa: true</code> with a <code>temp_token</code>.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/2fa/login-verify
{
  "temp_token": "tmp_abc123...",
  "code": "123456"
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}`} lang="bash" title="POST /auth/2fa/login-verify" />
            </>
          ),
        },
        {
          title: 'POST /auth/forgot-password',
          content: (
            <>
              <p>Request a password reset OTP sent to the registered email.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/forgot-password
{ "email": "user@example.com" }

Response 200: { "message": "OTP sent to email" }`} lang="bash" title="POST /auth/forgot-password" />
            </>
          ),
        },
        {
          title: 'POST /auth/reset-password',
          content: (
            <>
              <p>Reset the password using the OTP received via email.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/reset-password
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePass123!"
}

Response 200: { "message": "Password reset successfully" }`} lang="bash" title="POST /auth/reset-password" />
            </>
          ),
        },
        {
          title: 'POST /auth/change-password',
          content: (
            <>
              <p>Change the password for the currently authenticated user.</p>
              <CodeBlock code={`PUT /api/v1/developer/auth/change-password
{
  "current_password": "oldPass123!",
  "new_password": "newPass456!"
}

Response 200: { "message": "Password changed" }`} lang="bash" title="PUT /auth/change-password" />
            </>
          ),
        },
        {
          title: 'GET/PUT /auth/me',
          content: (
            <>
              <p>Get or update the current developer profile.</p>
              <CodeBlock code={`GET /api/v1/developer/auth/me
Response 200:
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "subscription_tier": "developer",
  "plan": { "name": "Developer", "price_monthly": 99 }
}

PUT /api/v1/developer/auth/me
{ "username": "newusername" }`} lang="bash" title="GET/PUT /auth/me" />
            </>
          ),
        },
        {
          title: 'GET/PUT /auth/preferences',
          content: (
            <>
              <p>Get or update UI preferences such as theme, accent color, and sidebar configuration.</p>
              <CodeBlock code={`GET /api/v1/developer/auth/preferences
Response 200:
{
  "theme": "dark",
  "accent": "blue",
  "sidebar": "expanded",
  "notifications": { "email": true, "in_app": true }
}

PUT /api/v1/developer/auth/preferences
{ "theme": "light", "accent": "purple" }`} lang="bash" title="GET/PUT /auth/preferences" />
            </>
          ),
        },
        {
          title: 'POST /auth/verify-email',
          content: (
            <>
              <p>Verify the email address using the OTP sent during registration.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/verify-email
{ "otp": "123456" }

Response 200: { "status": "verified" }`} lang="bash" title="POST /auth/verify-email" />
            </>
          ),
        },
        {
          title: 'POST /auth/delete-account',
          content: (
            <>
              <p>Permanently delete the current account and all associated data. This action cannot be undone.</p>
              <CodeBlock code={`POST /api/v1/developer/auth/delete-account
{ "password": "current_password" }

Response 200: { "message": "Account deleted" }`} lang="bash" title="POST /auth/delete-account" />
            </>
          ),
        },
        {
          title: 'POST /auth/logout',
          content: (
            <>
              <p>Revoke the current session token immediately.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/auth/logout
X-Session-Token: sess_eyJhbGciOiJIUzI1NiIs...

Response 200:
{
  "message": "Session revoked successfully."
}`} lang="bash" title="POST /auth/logout" />
            </>
          ),
        },
      ]}
    />
  );
}
