"""
Supabase Auth token verification.

Supabase issues signed JWTs (access tokens) for authenticated users. Rather
than re-implement signature verification locally (which is fragile because the
signing algorithm/secret is project-specific and can change), we delegate to
Supabase's own `/auth/v1/user` endpoint with the token in the Authorization
header. If Supabase returns the user, the token is valid. This is the same
mechanism used by the official supabase-py `auth.get_user(jwt)`.

We then resolve the returned user UUID to a `DeveloperAccount` via the
`supabase_user_id` link column.
"""

from __future__ import annotations

import logging
from typing import Any, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from core.config import settings
from models.domain import DeveloperAccount

logger = logging.getLogger(__name__)


def _auth_user_url() -> str:
    """Supabase Auth endpoint that returns the user for a given access token."""
    base = (settings.SUPABASE_URL or "").rstrip("/")
    return f"{base}/auth/v1/user"


def looks_like_supabase_token(token: str) -> bool:
    """
    Heuristic to pick the right verifier. A Supabase JWT carries the project
    ref in its `iss` claim (e.g. "https://<ref>.supabase/auth/v1") OR has
    `role`/`aal` claims. We just check it's a 3-part JWT — the actual
    validity is confirmed by the Supabase Auth call below.
    """
    if not token or token.count(".") != 2:
        return False
    return True


async def verify_supabase_token(token: str) -> Optional[dict[str, Any]]:
    """
    Validate a Supabase access token by asking Supabase Auth to return the
    user for it. Returns the user object on success, None on failure.

    We use the service_role key as the apikey (authorised to call the admin
    endpoint) AND the user's access token as the Bearer. If the token is
    invalid/expired, Supabase returns 401 and we return None.
    """
    if not settings.SUPABASE_AUTH_ENABLED:
        return None
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase auth enabled but URL/service_role key missing")
        return None

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {token}",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(_auth_user_url(), headers=headers)
    except Exception as exc:
        logger.warning("Supabase /auth/v1/user call failed: %s", exc)
        return None

    if r.status_code != 200:
        logger.warning(
            "Supabase token validation failed: HTTP %s", r.status_code
        )
        return None

    try:
        return r.json()
    except Exception as exc:
        logger.warning("Supabase /auth/v1/user returned non-JSON: %s", exc)
        return None


async def resolve_developer_from_supabase(
    db: AsyncSession, user: dict[str, Any]
) -> Optional[DeveloperAccount]:
    """Map a verified Supabase user object to a DeveloperAccount row."""
    sub = user.get("id")
    if not sub:
        return None
    try:
        user_uuid = UUID(str(sub))
    except (ValueError, TypeError):
        return None

    result = await db.execute(
        select(DeveloperAccount)
        .options(joinedload(DeveloperAccount.plan))
        .where(DeveloperAccount.supabase_user_id == user_uuid)
    )
    dev = result.scalars().first()
    if dev and dev.is_banned:
        return None
    return dev
