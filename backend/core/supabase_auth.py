"""
Supabase Auth JWT verification.

Supabase issues RS256-signed JWTs (access tokens) for authenticated users.
This module verifies them against the project's published JWKS, then resolves
the JWT's `sub` (a UUID) to a `DeveloperAccount` via the `supabase_user_id`
link column introduced in Phase 1.

This is the "new" leg of the dual-verifier in `core/deps.py`. The legacy
HS256 path stays available until all sessions have rotated to Supabase-issued
tokens.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional
from uuid import UUID

import httpx
from jose import jwt as jose_jwt, JWTError
from jose.backends.cryptography_backend import CryptographyRSAKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from core.config import settings
from models.domain import DeveloperAccount

logger = logging.getLogger(__name__)

# In-process JWKS cache: {kid: RSA public key object}.
_jwks_cache: dict[str, Any] = {}
_jwks_url: str = ""

_AUDIENCE = "authenticated"


def _get_jwks_url() -> str:
    """Build the JWKS URL from the project ref (or derive from SUPABASE_URL)."""
    global _jwks_url
    if _jwks_url:
        return _jwks_url

    ref = (settings.SUPABASE_PROJECT_REF or "").strip()
    if not ref and settings.SUPABASE_URL:
        try:
            ref = settings.SUPABASE_URL.split("//", 1)[1].split(".")[0]
        except Exception:
            ref = ""

    if not ref:
        raise RuntimeError(
            "SUPABASE_PROJECT_REF (or SUPABASE_URL) must be set to verify Supabase JWTs"
        )
    _jwks_url = f"https://{ref}.supabase.co/auth/v1/.well-known/jwks.json"
    return _jwks_url


async def _fetch_jwks() -> None:
    """Fetch the JWKS set and cache each key by `kid` (idempotent refresh)."""
    url = _get_jwks_url()
    apikey = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, headers={"apikey": apikey})
            r.raise_for_status()
            data = r.json()
    except Exception as exc:
        logger.warning("Failed to fetch Supabase JWKS: %s", exc)
        return

    for jwk in data.get("keys", []):
        kid = jwk.get("kid")
        if not kid:
            continue
        try:
            # Build an RSA public-key object from the JWK. jose can verify
            # signatures directly from this object.
            key = CryptographyRSAKey(json.dumps(jwk), algorithm="RS256")
            _jwks_cache[kid] = key.to_dict().get("public_key") or key
        except Exception as exc:
            logger.debug("Skipping unparseable JWK kid=%s: %s", kid, exc)


def looks_like_supabase_token(token: str) -> bool:
    """
    Cheap heuristic to pick the right verifier: read the JWT header WITHOUT
    verifying the signature and check whether the alg is RS256 (Supabase) vs
    HS256 (legacy). Falls back to False on any malformed token.
    """
    try:
        header = jose_jwt.get_unverified_header(token)
        return header.get("alg") == "RS256"
    except Exception:
        return False


async def verify_supabase_token(token: str) -> Optional[dict[str, Any]]:
    """
    Verify a Supabase-issued RS256 access token against the cached JWKS.
    Returns the decoded payload on success, None on failure / disabled.
    """
    if not settings.SUPABASE_AUTH_ENABLED:
        return None

    try:
        header = jose_jwt.get_unverified_header(token)
    except Exception:
        return None

    kid = header.get("kid")
    if not kid:
        return None

    if kid not in _jwks_cache:
        await _fetch_jwks()
    key = _jwks_cache.get(kid)
    if key is None:
        logger.warning("Supabase JWT kid=%s not present in JWKS", kid)
        return None

    try:
        payload = jose_jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=_AUDIENCE,
            options={"verify_aud": True},
        )
        return payload
    except JWTError as exc:
        logger.warning("Supabase JWT verification failed: %s", exc)
        return None
    except Exception as exc:
        logger.warning("Supabase JWT verification error: %s", exc)
        return None


async def resolve_developer_from_supabase(
    db: AsyncSession, payload: dict[str, Any]
) -> Optional[DeveloperAccount]:
    """Map a verified Supabase JWT payload to a DeveloperAccount row."""
    sub = payload.get("sub")
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
