'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function CustomDomainsPage() {
  return (
    <DocPageLayout
      title="Custom Domains & SSL"
      subtitle="Serve AuthSys from your own domain. Custom domains give your users a branded experience and are fully secured with automatic SSL certificates."
      sections={[
        {
          title: 'Adding a Custom Domain',
          content: (
            <>
              <p>Add a custom domain from <strong>Settings → System → Custom Domains</strong> or via the API:</p>
              <CodeBlock code={`// Add a custom domain
POST /api/v1/developer/domains
{
  "domain": "license.yourdomain.com"
}

// Response includes DNS verification records:
{
  "id": 1,
  "domain": "license.yourdomain.com",
  "verification": {
    "type": "TXT",
    "name": "_authsys.license.yourdomain.com",
    "value": "authsys-verify=abc123def456"
  },
  "status": "pending_verification"
}`} lang="bash" title="Add custom domain" />
              <Callout variant="warning">
                You must add the DNS TXT record to prove domain ownership before the domain becomes active. SSL certificates are provisioned automatically after verification.
              </Callout>
            </>
          ),
        },
        {
          title: 'Domain Verification',
          content: (
            <>
              <p>After adding the DNS record, verify ownership:</p>
              <CodeBlock code={`// Trigger verification
POST /api/v1/developer/domains/{domain_id}/verify

// Response
{ "status": "verified", "ssl_provisioning": "in_progress" }`} lang="bash" title="Verify domain" />
              <p>SSL certificates are provisioned automatically via Let's Encrypt within minutes of verification. You can toggle SSL on/off if needed:</p>
              <CodeBlock code={`// Toggle SSL
PUT /api/v1/developer/domains/{domain_id}/ssl
{ "ssl_enabled": true }`} lang="bash" title="Toggle SSL" />
            </>
          ),
        },
        {
          title: 'Removing a Domain',
          content: (
            <>
              <p>Delete a custom domain when it is no longer needed:</p>
              <CodeBlock code={`DELETE /api/v1/developer/domains/{domain_id}
Response: { "status": "deleted" }`} lang="bash" title="Delete domain" />
              <Callout variant="info">
                Removing a domain also deletes the SSL certificate. Any API calls using the custom domain will stop working immediately.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
