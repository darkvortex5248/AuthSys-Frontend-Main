"""
Supabase Auth bridge router.

During the migration, the frontend authenticates with Supabase (sign-up,
sign-in, OAuth, password reset) and receives a Supabase access token. It then
calls this router to fetch the application-side developer profile
(DeveloperAccount) that corresponds to that Supabase user.

Endpoints:
  POST /api/v1/developer/auth/supabase/session
      Body: { "access_token": "<Supabase RS256 JWT>" }
      Returns: { "user": <DeveloperAccount public fields> }
      The frontend uses this to hydrate the Zustand auth store.

The trigger created in Phase 1 guarantees a `developer_accounts` row exists
for every Supabase auth user, so this lookup always succeeds for valid tokens
once the profile has been backfilled by the trigger.

Legacy endpoints in `routers/developer_auth.py` remain mounted for backward
compatibility while existing sessions rotate.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_developer
from core.supabase_auth import verify_supabase_token, resolve_developer_from_supabase
from models.domain import DeveloperAccount

router = APIRouter(prefix="/api/v1/developer/auth", tags=["Developer Auth (Supabase)"])


class SupabaseSessionRequest(BaseModel):
    access_token: str


def _public_dev(dev: DeveloperAccount) -> dict:
    """Serialize a DeveloperAccount for the frontend (no secrets)."""
    return {
        "id": dev.id,
        "username": dev.username,
        "email": dev.email,
        "avatar_url": dev.avatar_url,
        "display_name": dev.display_name,
        "bio": dev.bio,
        "timezone": dev.timezone,
        "subscription_tier": dev.subscription_tier,
        "is_verified": dev.is_verified,
        "supabase_user_id": str(dev.supabase_user_id) if dev.supabase_user_id else None,
        "plan": {
            "id": dev.plan.id,
            "name": dev.plan.name,
            "max_apps": dev.plan.max_apps,
            "max_users_per_app": dev.plan.max_users_per_app,
            "max_keys_per_month": dev.plan.max_keys_per_month,
            "features_json": dev.plan.features_json,
        } if dev.plan else None,
    }


@router.post("/supabase/session")
async def supabase_session(
    req: SupabaseSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Exchange a Supabase access token for the developer application profile.

    The frontend calls this after Supabase `getSession()` succeeds, then
    stores the returned user in the Zustand auth store (replacing the old
    `/developer/auth/session` cookie-restore flow).
    """
    payload = await verify_supabase_token(req.access_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase token.",
        )
    dev = await resolve_developer_from_supabase(db, payload)
    if dev is None:
        # The trigger should have created a profile; if missing, the user is
        # either banned or the trigger hasn't run yet (race on first login).
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer profile not linked to this Supabase user.",
        )
    return {"user": _public_dev(dev)}


@router.get("/supabase/me")
async def supabase_me(dev: DeveloperAccount = Depends(get_current_developer)):
    """
    Protected profile endpoint that works for BOTH token types (Supabase RS256
    and legacy HS256), because it uses the dual-verifier dependency. The
    frontend can call this with whichever token it currently holds.
    """
    return {"user": _public_dev(dev)}
