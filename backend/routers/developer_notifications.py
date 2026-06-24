from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Announcement
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/developer/notifications", tags=["Developer Notifications"])

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    created_at: datetime
    class Config:
        from_attributes = True

@router.get("")
async def get_notifications(
    limit: int = 50,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc()).limit(limit)
    )
    announcements = res.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "created_at": a.created_at.isoformat(),
        }
        for a in announcements
    ]

@router.put("/read")
async def mark_notifications_read(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    dev.last_read_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "success"}

@router.get("/unread-count")
async def unread_notification_count(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    if not dev.last_read_at:
        res = await db.execute(
            select(func.count()).select_from(Announcement)
        )
        count = res.scalar() or 0
        return {"count": count}

    res = await db.execute(
        select(func.count()).select_from(Announcement).where(Announcement.created_at > dev.last_read_at)
    )
    count = res.scalar() or 0
    return {"count": count}
