from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeveloperSession
from schemas.premium import DeveloperSessionResponse
from datetime import datetime, timezone
import hashlib

router = APIRouter(prefix="/api/v1/developer/sessions", tags=["Sessions"])

@router.get("", response_model=list[DeveloperSessionResponse])
async def get_sessions(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DeveloperSession)
        .where(DeveloperSession.developer_id == dev.id)
        .order_by(DeveloperSession.last_activity.desc())
    )
    return res.scalars().all()

@router.post("/logout/{session_id}")
async def logout_session(session_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DeveloperSession).where(
            DeveloperSession.id == session_id,
            DeveloperSession.developer_id == dev.id
        )
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.is_current = False
    session.expires_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "logged_out"}

@router.post("/logout-all")
async def logout_all_sessions(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await db.execute(
        select(DeveloperSession).where(
            DeveloperSession.developer_id == dev.id,
            DeveloperSession.is_current == True
        )
    )
    await db.execute(
        type(DeveloperSession.__table__.update()).where(
            DeveloperSession.developer_id == dev.id
        ).values(is_current=False, expires_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"status": "all_sessions_logged_out"}

async def record_session(dev_id: int, token: str, ip: str, ua: str, db: AsyncSession):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session = DeveloperSession(
        developer_id=dev_id,
        token_hash=token_hash,
        ip_address=ip,
        user_agent=ua,
        device_name=ua.split('/')[0] if ua else None,
        is_current=True,
        expires_at=None
    )
    db.add(session)
    await db.commit()
