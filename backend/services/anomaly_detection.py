from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.domain import ActivityLog, EndUser, Blacklist
from datetime import datetime, timedelta, timezone

def utc_now(): 
    return datetime.now(timezone.utc)

async def detect_anomalies(user_id: int, app_id: int, ip_address: str, hwid: str, db: AsyncSession):
    # 1. Brute Force Detection
    time_limit = utc_now() - timedelta(minutes=15)
    recent_fails = await db.execute(
        select(ActivityLog).where(
            ActivityLog.app_id == app_id, 
            ActivityLog.ip_address == ip_address, 
            ActivityLog.action_type == "failed_login",
            ActivityLog.timestamp > time_limit
        )
    )
    fails_list = recent_fails.scalars().all()
    if len(fails_list) >= 5:
        bl = Blacklist(app_id=app_id, type="ip", value=ip_address, reason="Brute force detection (5+ fails in 15min)")
        db.add(bl)

    # 2. Key Sharing Detection (Same user, many HWIDs)
    recent_hwids = await db.execute(
        select(ActivityLog.hwid).where(
            ActivityLog.user_id == user_id,
            ActivityLog.action_type == "login",
            ActivityLog.timestamp > utc_now() - timedelta(hours=24)
        ).distinct()
    )
    hwids = [h for h in recent_hwids.scalars().all() if h]
    if len(hwids) >= 3:
        user_res = await db.execute(select(EndUser).where(EndUser.id == user_id))
        user = user_res.scalars().first()
        if user and not user.is_banned:
            user.is_banned = True
            user.ban_reason = "Key sharing detected (3+ unique HWIDs in 24h)"

    await db.commit()
