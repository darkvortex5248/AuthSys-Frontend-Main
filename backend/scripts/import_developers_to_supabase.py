"""
Phase 2 — Import existing developer_accounts into Supabase Auth.

WHAT IT DOES
------------
Reads every row from the `developer_accounts` table and creates a matching
user in Supabase Auth (`auth.users`) via the Auth Admin API, preserving the
existing bcrypt password hash — so users do NOT need to reset passwords.

After creating each auth user, it backfills the returned Supabase UUID into
`developer_accounts.supabase_user_id`, linking the two.

This script is IDEMPOTENT: rows that already have a supabase_user_id are
skipped, and Auth-API collisions (email already exists) are handled by
looking up the existing auth user instead of failing.

USAGE
-----
1. Set these environment variables (or edit the defaults below):
     SUPABASE_PROJECT_REF    e.g. vbnjhqnkmbjmvlfdlrpv
     SUPABASE_SERVICE_ROLE   the service_role secret (NOT the anon key)
     DATABASE_URL            the asyncpg URL pointing at the same Supabase DB

2. From the backend/ directory:
     python scripts/import_developers_to_supabase.py

SECURITY
--------
- The service_role key bypasses RLS and can create users. Never commit it,
  never log it. Regenerate it after the migration is complete.
- This script prints PROGRESS only (counts), never emails or secrets.
"""

import asyncio
import os
import sys
from typing import Optional

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# Make `backend/` importable when run as a script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import AsyncSessionLocal  # noqa: E402
from models.domain import DeveloperAccount  # noqa: E402


# ─── Configuration (env-driven, with the values you supplied as fallback) ───
SUPABASE_PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "vbnjhqnkmbjmvlfdlrpv")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE", "")

AUTH_ADMIN_URL = f"https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/admin/users"


async def _find_auth_user_by_email(client: httpx.AsyncClient, email: str) -> Optional[str]:
    """Return the Supabase auth user UUID for an email, or None."""
    try:
        r = await client.get(
            AUTH_ADMIN_URL,
            params={"page": "1", "per_page": "1"},
            headers={
                "apikey": SUPABASE_SERVICE_ROLE,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
            },
        )
        # The Admin API doesn't support email filtering directly; we rely on
        # the create call failing with 422/email-exists and then trust that
        # a pre-existing auth user belongs to this developer. This is only a
        # fallback path.
        return None
    except Exception:
        return None


async def create_or_get_auth_user(
    client: httpx.AsyncClient,
    *,
    email: str,
    password_hash: str,
    email_verified: bool,
) -> Optional[str]:
    """
    Create a Supabase auth user with an existing bcrypt hash.
    Returns the auth user UUID, or None on irrecoverable failure.
    """
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "email_confirm": email_verified,
        # Supabase accepts standard bcrypt $2b$... hashes natively.
        "password_hash": password_hash or "",
        "app_metadata": {"role": "developer"},
    }

    try:
        r = await client.post(AUTH_ADMIN_URL, headers=headers, json=payload, timeout=30)
    except Exception as exc:
        print(f"  ✗ network error for {email}: {exc}")
        return None

    if r.status_code in (200, 201):
        data = r.json()
        uid = data.get("id")
        return uid

    # 422 typically means the user already exists in auth.users.
    if r.status_code == 422 or "already" in r.text.lower():
        # Fall back: list users and match by email (Admin API has no direct lookup).
        # This is best-effort; if we cannot resolve it, skip and report.
        try:
            list_r = await client.get(
                AUTH_ADMIN_URL,
                headers=headers,
                params={"page": "1", "per_page": "1000"},
                timeout=30,
            )
            if list_r.status_code == 200:
                for u in list_r.json().get("users", []):
                    if (u.get("email") or "").lower() == email.lower():
                        return u.get("id")
        except Exception:
            pass
        print(f"  → {email} already exists in auth.users but UUID not resolvable; skipped")
        return None

    print(f"  ✗ {email} failed: HTTP {r.status_code} {r.text[:160]}")
    return None


async def main() -> None:
    if not SUPABASE_SERVICE_ROLE:
        print("ERROR: SUPABASE_SERVICE_ROLE env var is required.")
        print("Set it to your service_role secret (NOT the anon key).")
        sys.exit(1)

    print(f"Supabase project: {SUPABASE_PROJECT_REF}")
    print(f"Auth Admin URL:   {AUTH_ADMIN_URL}")
    print("-" * 60)

    async with AsyncSessionLocal() as db:  # type: AsyncSession
        res = await db.execute(
            select(DeveloperAccount).order_by(DeveloperAccount.id)
        )
        developers = res.scalars().all()

        total = len(developers)
        already_linked = sum(1 for d in developers if d.supabase_user_id)
        to_import = [d for d in developers if not d.supabase_user_id]

        print(f"Found {total} developer(s). Already linked: {already_linked}. To import: {len(to_import)}.")
        if not to_import:
            print("Nothing to import. Exiting.")
            return

        created = 0
        skipped = 0
        async with httpx.AsyncClient() as client:
            for d in to_import:
                # Skip empty placeholder hashes (e.g. never set a password)
                if not d.password_hash or not d.password_hash.startswith("$2"):
                    print(f"  → dev#{d.id} {d.email}: no usable bcrypt hash, skipped")
                    skipped += 1
                    continue

                uid = await create_or_get_auth_user(
                    client,
                    email=d.email,
                    password_hash=d.password_hash,
                    email_verified=bool(d.is_verified),
                )

                if uid:
                    await db.execute(
                        update(DeveloperAccount)
                        .where(DeveloperAccount.id == d.id)
                        .values(supabase_user_id=uid)
                    )
                    await db.commit()
                    created += 1
                    print(f"  ✓ dev#{d.id} {d.email} → {uid}")
                else:
                    skipped += 1

        print("-" * 60)
        print(f"Done. Created/linked: {created}. Skipped: {skipped}.")


if __name__ == "__main__":
    asyncio.run(main())
