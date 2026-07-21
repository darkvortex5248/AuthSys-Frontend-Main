'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function LicenseKeysAPIPage() {
  return (
    <DocPageLayout
      title="License Keys API"
      subtitle="Full CRUD API for managing license keys — create, validate, activate, deactivate, list, update, and delete."
      sections={[
        {
          title: 'POST /licenses',
          content: (
            <>
              <p>Create a new license key. Requires an API key with the <code>licenses:write</code> permission.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/licenses
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "type": "time_based",                   // "time_based" | "lifetime" | "uses_based"
  "duration_days": 365,                    // Required for time_based
  "max_activations": 3,                    // Max HWID activations
  "max_uses": null,                        // Required for uses_based
  "hwid_locked": true,
  "metadata": {
    "tier": "premium",
    "product": "my-app-v2"
  },
  "expires_at": null                       // Override expiry (ISO 8601)
}

Response 201:
{
  "id": "lic_a1b2c3d4e5f6",
  "key": "PREMIUM-A1B2C3D4-E5F6G7H8-I9J0K1L2-M3N4O5P6",
  "type": "time_based",
  "status": "active",
  "expires_at": "2027-06-15T10:00:00Z",
  "created_at": "2026-06-15T10:00:00Z"
}`} lang="bash" title="POST /licenses" />
              <Callout variant="tip">
                You can use a custom prefix (like <code>PREMIUM</code> in the example) by setting the <code>prefix</code> field. Prefixes help identify key tiers at a glance.
              </Callout>
            </>
          ),
        },
        {
          title: 'POST /licenses/validate',
          content: (
            <>
              <p>Validate a license key. This is the most frequently called endpoint. Returns the full license status including HWID binding checks.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/licenses/validate
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "license_key": "PREMIUM-A1B2C3D4-E5F6G7H8-I9J0K1L2-M3N4O5P6",
  "hwid": "hwid_a1b2c3d4e5f6g7h8i9j0...",
  "bind_hwid": true,
  "metadata": {
    "app_version": "2.0.0",
    "os": "windows"
  }
}

Response 200 (valid):
{
  "valid": true,
  "license": {
    "id": "lic_a1b2c3d4e5f6",
    "type": "time_based",
    "status": "active",
    "expires_at": "2027-06-15T10:00:00Z",
    "activation_count": 1,
    "max_activations": 3
  }
}

Response 200 (invalid):
{
  "valid": false,
  "reason": "expired",
  "message": "License key expired on 2026-01-01T00:00:00Z"
}`} lang="bash" title="POST /licenses/validate" />
            </>
          ),
        },
        {
          title: 'POST /licenses/activate & /deactivate',
          content: (
            <>
              <p>Activate or deactivate a license key for a specific HWID. Activation increments the activation count; deactivation decrements it.</p>
              <CodeBlock code={`POST https://api.authsys.io/v1/licenses/activate
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "license_key": "PREMIUM-A1B2C3D4-E5F6G7H8-I9J0K1L2-M3N4O5P6",
  "hwid": "hwid_a1b2c3d4e5f6g7h8i9j0..."
}

Response 200:
{
  "activated": true,
  "activation_id": "act_p1q2r3s4t5u6",
  "activations_remaining": 2
}

---
POST https://api.authsys.io/v1/licenses/deactivate
Content-Type: application/json
X-API-Key: as_api_...

Request Body:
{
  "activation_id": "act_p1q2r3s4t5u6"
}

Response 200:
{
  "deactivated": true,
  "activations_remaining": 3
}`} lang="bash" title="POST /licenses/activate & /deactivate" />
            </>
          ),
        },
        {
          title: 'GET, PUT, DELETE /licenses/:id',
          content: (
            <>
              <p>Retrieve, update, or delete a license key by ID.</p>
              <CodeBlock code={`# Get license details
GET https://api.authsys.io/v1/licenses/lic_a1b2c3d4e5f6

# Update license
PUT https://api.authsys.io/v1/licenses/lic_a1b2c3d4e5f6
Content-Type: application/json

{
  "status": "suspended",
  "metadata": {"suspended_reason": "fraud_detected"},
  "max_activations": 0
}

# Delete license
DELETE https://api.authsys.io/v1/licenses/lic_a1b2c3d4e5f6

Response 200 (DELETE):
{
  "deleted": true,
  "id": "lic_a1b2c3d4e5f6"
}`} lang="bash" title="CRUD operations" />
              <Callout variant="danger">
                Deleting a license key is permanent. Use the <code>suspended</code> status instead of deleting to retain audit history.
              </Callout>
            </>
          ),
        },
        {
          title: 'GET /licenses',
          content: (
            <>
              <p>List all license keys with pagination, filtering, and sorting.</p>
              <CodeBlock code={`GET https://api.authsys.io/v1/licenses?status=active&type=time_based&page=1&per_page=50&sort=created_at:desc

Response 200:
{
  "data": [
    {
      "id": "lic_a1b2c3d4e5f6",
      "key": "PREMIUM-...",
      "type": "time_based",
      "status": "active",
      "expires_at": "2027-06-15T10:00:00Z",
      "created_at": "2026-06-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 128,
    "total_pages": 3
  }
}`} lang="bash" title="GET /licenses" />
            </>
          ),
        },
      ]}
    />
  );
}
