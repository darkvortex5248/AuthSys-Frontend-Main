from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.config import settings
from models.domain import DeveloperAccount
from core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/developer/auth/login")

from sqlalchemy.orm import joinedload
from core.supabase_auth import (
    looks_like_supabase_token,
    resolve_developer_from_supabase,
    verify_supabase_token,
)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_developer(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """
    Dual-verifier dependency.

    Accepts EITHER:
      • Supabase-issued RS256 JWT (new path) — `sub` is a UUID looked up via
        `developer_accounts.supabase_user_id`.
      • Legacy HS256 JWT (old path) — `sub` is the integer developer id looked
        up via `developer_accounts.id`.

    The legacy path is kept only while existing sessions (cookies / tokens
    minted before migration) rotate over to Supabase-issued tokens.
    """
    credentials_exception = _unauthorized()

    # ── New path: Supabase RS256 JWT ──────────────────────────────────────
    if looks_like_supabase_token(token):
        payload = await verify_supabase_token(token)
        if payload is None:
            raise credentials_exception
        dev = await resolve_developer_from_supabase(db, payload)
        if dev is None:
            raise credentials_exception
        return dev

    # ── Legacy path: HS256 JWT signed with settings.SECRET_KEY ────────────
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(DeveloperAccount)
        .options(joinedload(DeveloperAccount.plan))
        .where(DeveloperAccount.id == int(user_id))
    )
    dev = result.scalars().first()
    if dev is None:
        raise credentials_exception
    return dev
