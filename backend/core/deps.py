import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from core.database import get_db
from core.config import settings
from models.domain import DeveloperAccount, DeveloperSession
from core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/developer/auth/login", auto_error=False)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_developer(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = _unauthorized()

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Check if this token session is still valid (not revoked)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session_res = await db.execute(
        select(DeveloperSession).where(
            DeveloperSession.token_hash == token_hash,
            DeveloperSession.is_current == True
        )
    )
    session = session_res.scalars().first()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(DeveloperAccount)
        .options(joinedload(DeveloperAccount.plan))
        .where(DeveloperAccount.id == int(user_id))
    )
    dev = result.scalars().first()
    if dev is None:
        raise credentials_exception
    return dev
