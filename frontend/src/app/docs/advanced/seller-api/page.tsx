'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function SellerAPIPage() {
  return (
    <DocPageLayout
      title="Seller API"
      subtitle="The Seller API lets third-party sellers generate license keys on your behalf without accessing your dashboard. Each seller has a scoped API key with limited permissions."
      sections={[
        {
          title: 'Creating a Seller Account',
          content: (
            <>
              <p>Create seller accounts from the dashboard or via the API:</p>
              <CodeBlock code={`// Create a seller
POST /api/v1/developer/sellers
{
  "name": "Reseller XYZ",
  "plan_id": 2
}

// Response includes the seller's API key:
{
  "id": 1,
  "name": "Reseller XYZ",
  "seller_key": "seller_a1b2c3d4e5f6g7h8i9j0",
  "plan": { "id": 2, "name": "Developer" },
  "created_at": "2026-06-23T10:00:00Z"
}

// List all sellers
GET /api/v1/developer/sellers`} lang="bash" title="Seller accounts" />
              <Callout variant="warning">
                The seller key is shown only once at creation. Store it securely and share it with the seller through a secure channel.
              </Callout>
            </>
          ),
        },
        {
          title: 'Generating Keys as a Seller',
          content: (
            <>
              <p>Sellers can generate license keys using their own API key without ever seeing the main dashboard:</p>
              <CodeBlock code={`// Seller generates a key
POST /api/v1/developer/sellers/generate-key
{
  "seller_key": "seller_a1b2c3d4...",
  "type": "time_based",
  "prefix": "RESELLER",
  "duration_days": 365,
  "max_activations": 3
}

Response:
{
  "key": "RESELLER-A1B2C3D4-E5F6G7H8-I9J0K1L2",
  "type": "time_based",
  "expires_at": "2027-06-23T00:00:00Z",
  "seller": "Reseller XYZ",
  "seller_tag": "seller:xyz"
}`} lang="bash" title="Seller key generation" />
              <p>Keys generated through the seller API include a <code>seller_tag</code> in their metadata for tracking and commission calculations.</p>
            </>
          ),
        },
        {
          title: 'Seller Limitations',
          content: (
            <>
              <p>Seller API keys have strict limitations:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Can only <strong>generate</strong> keys — cannot view, modify, or revoke existing keys</li>
                <li>Keys are generated within the plan limits of the seller's assigned plan</li>
                <li>Each generated key is tagged with the seller ID for tracking</li>
                <li>Seller keys cannot generate other seller accounts</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
