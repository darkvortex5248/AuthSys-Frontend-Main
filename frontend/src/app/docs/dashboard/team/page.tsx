'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function TeamPage() {
  return (
    <DocPageLayout
      title="Team Management"
      subtitle="Collaborate with your team by inviting members, assigning roles, and managing permissions. The Team section gives you fine-grained control over who can access what."
      sections={[
        {
          title: 'Roles & Permissions',
          content: (
            <>
              <p>AuthSys provides four built-in roles, plus custom roles for Enterprise plans:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Owner</strong> — Full access to all features, billing, and team management. Cannot be deleted.</li>
                <li><strong>Admin</strong> — Full access except billing and team management. Can manage licenses, users, and settings.</li>
                <li><strong>Developer</strong> — Can create and validate licenses, view analytics, and manage API keys. Cannot access billing or team settings.</li>
                <li><strong>Support</strong> — Read-only access to licenses, users, and audit logs. Can reset HWID bindings and suspend licenses.</li>
              </ul>
              <Callout variant="info">
                Enterprise customers can create custom roles with granular permissions (e.g., "Can only view audit logs" or "Can only create time-based licenses").
              </Callout>
            </>
          ),
        },
        {
          title: 'Inviting Team Members',
          content: (
            <>
              <p>Invite team members from the dashboard under <strong>Settings → Team → Invite Member</strong>, or via the API:</p>
              <CodeBlock code={`curl -X POST https://api.authsys.io/v1/team/invite \\
  -H "X-API-Key: as_api_OWNER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "colleague@company.com",
    "role": "developer",
    "message": "Welcome to the AuthSys team! Here are the API keys."
  }'

Response:
{
  "invitation_id": "inv_abc123",
  "email": "colleague@company.com",
  "role": "developer",
  "status": "pending",
  "expires_at": "2026-06-22T10:00:00Z"
}`} lang="bash" title="Invite team member" />
              <p>Invitations expire after 7 days. You can resend or revoke pending invitations from the dashboard.</p>
            </>
          ),
        },
        {
          title: 'Managing Team Members',
          content: (
            <>
              <p>View and manage existing team members:</p>
              <CodeBlock code={`// List team members
curl -H "X-API-Key: as_api_OWNER_KEY" \\
  "https://api.authsys.io/v1/team"

Response:
{
  "members": [
    {
      "user_id": "usr_owner_1",
      "email": "owner@company.com",
      "name": "Alice",
      "role": "owner",
      "status": "active",
      "last_active": "2026-06-15T10:30:00Z"
    },
    {
      "user_id": "usr_dev_2",
      "email": "dev@company.com",
      "name": "Bob",
      "role": "developer",
      "status": "active",
      "last_active": "2026-06-14T15:00:00Z"
    }
  ]
}

// Change a member's role
curl -X PUT https://api.authsys.io/v1/team/usr_dev_2 \\
  -H "X-API-Key: as_api_OWNER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"role": "admin"}'

// Remove a team member
curl -X DELETE https://api.authsys.io/v1/team/usr_dev_2 \\
  -H "X-API-Key: as_api_OWNER_KEY"`} lang="bash" title="Team management" />
            </>
          ),
        },
        {
          title: 'Organizations (Multi-Account)',
          content: (
            <>
              <p>Organizations allow you to group multiple developer accounts under a single entity. This is useful for teams that need separate developer accounts but shared management.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Create an organization</strong> from the Organization page in the dashboard</li>
                <li><strong>Invite members</strong> by email — they receive an invitation to join</li>
                <li><strong>Roles within the org</strong> — Owner, Admin, Member with different permission levels</li>
                <li>Each member retains their own developer account and API keys</li>
                <li>The organization owner can view usage across all member accounts</li>
              </ul>
              <CodeBlock code={`// Create organization
POST /api/v1/developer/organization
{ "name": "My Company", "slug": "my-company" }

// Invite member
POST /api/v1/developer/organization/invite
{ "email": "colleague@company.com", "role": "admin" }

// Accept invitation
POST /api/v1/developer/organization/invite/{member_id}/accept`} lang="bash" title="Organizations API" />
              <Callout variant="info">
                Organizations are separate from team management. Team members share a single developer account, while organization members each have their own account under a shared org umbrella.
              </Callout>
            </>
          ),
        },
        {
          title: 'Audit Trail for Team Actions',
          content: (
            <>
              <p>All team management actions are recorded in the audit logs, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Invitations sent, accepted, and revoked</li>
                <li>Role changes (before and after values)</li>
                <li>Member removals</li>
                <li>Failed login attempts by team members</li>
              </ul>
              <Callout variant="warning">
                Only the Owner can delete other team members or change roles to Owner. The Owner role can be transferred by the current Owner to another member.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
