'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function PythonSDKPage() {
  return (
    <DocPageLayout
      title="Python SDK"
      subtitle="The official AuthSys SDK for Python 3.9+. Async-first with sync fallback. Integrates seamlessly with FastAPI, Django, Flask, and CLI applications."
      sections={[
        {
          title: 'Installation',
          content: (
            <>
              <CodeBlock code={`pip install authsys-python`} lang="bash" title="PyPI" />
              <p>Or with Poetry:</p>
              <CodeBlock code={`poetry add authsys-python`} lang="bash" title="Poetry" />
            </>
          ),
        },
        {
          title: 'Quick Start',
          content: (
            <>
              <CodeBlock code={`from authsys import AuthSysClient
import os

client = AuthSysClient(
    api_key=os.environ["AUTHSYS_API_KEY"],
    environment="sandbox",
)

# Validate a license key (async)
async def validate_license(key: str):
    result = await client.validate(
        key,
        bind_hwid=True,
        metadata={"app_version": "1.0.0"},
    )

    if result.valid:
        print(f"License type: {result.license.type}")
        print(f"Expires at: {result.license.expires_at}")
        return True
    else:
        print(f"Validation failed: {result.reason}")
        return False

# Synchronous usage
result = client.validate_sync("LICENSE-KEY", bind_hwid=True)`} lang="python" title="quickstart.py" />
            </>
          ),
        },
        {
          title: 'Integration with FastAPI',
          content: (
            <>
              <p>Use the SDK as a dependency in FastAPI for seamless license-protected endpoints:</p>
              <CodeBlock code={`from fastapi import FastAPI, HTTPException, Depends
from authsys import AuthSysClient, ValidationResult
from pydantic import BaseModel

app = FastAPI()
client = AuthSysClient(api_key="...", environment="production")

class LicenseRequest(BaseModel):
    license_key: str

class LicenseResponse(BaseModel):
    valid: bool
    license_type: str | None = None
    expires_at: str | None = None

@app.post("/validate-license", response_model=LicenseResponse)
async def validate(req: LicenseRequest):
    result = await client.validate(
        req.license_key,
        bind_hwid=True,
    )
    if not result.valid:
        raise HTTPException(
            status_code=403,
            detail=f"License invalid: {result.reason}"
        )
    return LicenseResponse(
        valid=True,
        license_type=result.license.type,
        expires_at=result.license.expires_at.isoformat(),
    )

@app.on_event("startup")
async def startup():
    await client.authenticate()`} lang="python" title="fastapi-integration.py" />
              <Callout variant="tip">
                Initialize the client once and reuse it across your application. The SDK handles connection pooling and session refresh automatically.
              </Callout>
            </>
          ),
        },
        {
          title: 'Async Iterator for Bulk Operations',
          content: (
            <>
              <p>The Python SDK supports async iteration for listing licenses, activations, and audit logs:</p>
              <CodeBlock code={`# List all licenses with async iteration
async for license in client.list_licenses(
    status="active",
    limit=100,
):
    print(f"License: {license.key} — {license.type} — Expires: {license.expires_at}")

# Pagination is handled automatically
async for log in client.list_audit_logs(
    start_date="2026-01-01",
    end_date="2026-06-15",
):
    print(f"[{log.timestamp}] {log.action} — {log.user}")`} lang="python" title="async-iteration.py" />
            </>
          ),
        },
      ]}
    />
  );
}
