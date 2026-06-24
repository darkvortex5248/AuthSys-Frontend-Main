'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function UsersAPIPage() {
  return (
    <DocPageLayout
      title="Users API"
      subtitle="Endpoints for managing your customer user base — create, read, update, delete, and search users, plus manage their license assignments."
      sections={[
        {
          title: 'POST /users',
          content: (
            <>
              <p>Create a new user in your AuthSys account. Users can be assigned licenses and have their own metadata.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/users
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "email": "customer@example.com",
  "name": "Jane Smith",
  "metadata": {
    "company": "Acme Inc.",
    "plan": "enterprise"
  }
}

Response 201:
{
  "user_id": "usr_x1y2z3w4",
  "email": "customer@example.com",
  "name": "Jane Smith",
  "status": "active",
  "created_at": "2026-06-15T10:00:00Z",
  "metadata": {
    "company": "Acme Inc.",
    "plan": "enterprise"
  }
}`} lang="bash" title="POST /users" />
            </>
          ),
        },
        {
          title: 'GET /users/:id & GET /users',
          content: (
            <>
              <p>Retrieve a specific user by ID or list all users with pagination and search.</p>
              <CodeBlock code={`# Get single user
GET https://api.authsys.io/v1/users/usr_x1y2z3w4

Response 200:
{
  "user_id": "usr_x1y2z3w4",
  "email": "customer@example.com",
  "name": "Jane Smith",
  "status": "active",
  "licenses": [
    {
      "license_id": "lic_a1b2c3d4e5f6",
      "key": "PREMIUM-...",
      "type": "time_based",
      "status": "active"
    }
  ],
  "created_at": "2026-06-15T10:00:00Z"
}

# List users with search
GET https://api.authsys.io/v1/users?search=jane&status=active&page=1&per_page=20

Response 200:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5,
    "total_pages": 1
  }
}`} lang="bash" title="GET endpoints" />
            </>
          ),
        },
        {
          title: 'PUT /users/:id',
          content: (
            <>
              <p>Update user information, status, or metadata.</p>
              <CodeBlock code={`PUT https://api.authsys.io/v1/users/usr_x1y2z3w4
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "name": "Jane Smith-Jones",
  "status": "suspended",
  "metadata": {
    "company": "Acme Corp",
    "plan": "enterprise",
    "suspended_reason": "payment_failed"
  }
}

Response 200:
{
  "user_id": "usr_x1y2z3w4",
  "status": "suspended",
  "updated_at": "2026-06-15T11:00:00Z",
  "metadata": {
    "company": "Acme Corp",
    "plan": "enterprise",
    "suspended_reason": "payment_failed"
  }
}`} lang="bash" title="PUT /users/:id" />
              <Callout variant="warning">
                Suspending a user does not automatically revoke their license keys. Use the <code>POST /licenses/:id/suspend</code> endpoint or the dashboard to suspend licenses associated with the user.
              </Callout>
            </>
          ),
        },
        {
          title: 'DELETE /users/:id',
          content: (
            <>
              <p>Delete a user and optionally their associated licenses.</p>
              <CodeBlock code={`DELETE https://api.authsys.io/v1/users/usr_x1y2z3w4
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "revoke_licenses": true,     // Also revoke all licenses assigned to this user
  "reason": "GDPR deletion request"
}

Response 200:
{
  "deleted": true,
  "user_id": "usr_x1y2z3w4",
  "licenses_revoked": 3
}`} lang="bash" title="DELETE /users/:id" />
              <Callout variant="info">
                Deleted users are soft-deleted and retained in audit logs for 90 days. Use the <code>reason</code> field to document why the account was removed.
              </Callout>
            </>
          ),
        },
        {
          title: 'POST /users/bulk-create',
          content: (
            <>
              <p>Create up to 1000 users in a single request.</p>
              <CodeBlock code={`POST /api/v1/developer/users/bulk-create
{
  "app_id": 1,
  "users": [
    { "username": "user1", "email": "user1@example.com" },
    { "username": "user2", "email": "user2@example.com" }
  ]
}

Response 200: { "created": 2, "users": [...] }`} lang="bash" title="POST /users/bulk-create" />
            </>
          ),
        },
        {
          title: 'POST /users/:id/ban & /users/:id/unban',
          content: (
            <>
              <p>Ban or unban a user. Banning with a duration automatically lifts the ban after the specified time.</p>
              <CodeBlock code={`// Ban temporarily for 24 hours
POST /api/v1/developer/users/{user_id}/ban
{ "duration_hours": 24, "reason": "Abuse detected" }

// Unban
POST /api/v1/developer/users/{user_id}/unban`} lang="bash" title="Ban/Unban" />
            </>
          ),
        },
        {
          title: 'POST /users/:id/hwid-reset',
          content: (
            <>
              <p>Reset the HWID binding for a specific user, allowing them to activate on a new machine.</p>
              <CodeBlock code={`POST /api/v1/developer/users/{user_id}/hwid-reset
Response 200: { "status": "hwid_reset" }`} lang="bash" title="POST /users/:id/hwid-reset" />
            </>
          ),
        },
        {
          title: 'POST /users/:id/licenses',
          content: (
            <>
              <p>Assign an existing license key to a user.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/users/usr_x1y2z3w4/licenses
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "license_id": "lic_a1b2c3d4e5f6"
}

Response 200:
{
  "assigned": true,
  "user_id": "usr_x1y2z3w4",
  "license_id": "lic_a1b2c3d4e5f6"
}`} lang="bash" title="POST /users/:id/licenses" />
            </>
          ),
        },
      ]}
    />
  );
}
