'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function OrganizationsPage() {
  return (
    <DocPageLayout
      title="Organizations"
      subtitle="Organizations allow multiple developer accounts to work together under a shared entity. Each member retains their own account and API keys while the organization owner has oversight."
      sections={[
        {
          title: 'Creating an Organization',
          content: (
            <>
              <p>Create an organization from the Organization page in the dashboard or via the API:</p>
              <CodeBlock code={`// Create organization
POST /api/v1/developer/organization
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}

// Get organization details
GET /api/v1/developer/organization

// Update organization
PUT /api/v1/developer/organization/{org_id}
{ "name": "Acme Corporation" }`} lang="bash" title="Organizations API" />
            </>
          ),
        },
        {
          title: 'Inviting Members',
          content: (
            <>
              <p>Invite other developer accounts to join your organization:</p>
              <CodeBlock code={`// Invite a member
POST /api/v1/developer/organization/invite
{
  "email": "colleague@company.com",
  "role": "admin"
}

// The invited developer accepts:
POST /api/v1/developer/organization/invite/{member_id}/accept`} lang="bash" title="Invite members" />
              <p>Organization roles:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Owner</strong> — Full control, can manage members and delete the org</li>
                <li><strong>Admin</strong> — Can manage members and view all member data</li>
                <li><strong>Member</strong> — Can view their own data within the org context</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Organizations vs Team Management',
          content: (
            <>
              <p>Organizations and team management serve different purposes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Team Management</strong> — Multiple people share a single developer account. All team members use the same API keys and billing.</li>
                <li><strong>Organizations</strong> — Each developer has their own account. Each member has their own API keys, apps, and billing. The org owner has cross-account visibility.</li>
              </ul>
              <Callout variant="info">
                Organizations are ideal for agencies, studios, and enterprises where each developer needs isolated environments but management wants consolidated oversight.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
