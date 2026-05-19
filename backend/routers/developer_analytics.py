from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import Response
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import ActivityLog, DeveloperAccount, Application, EndUser, LicenseKey, Session, TeamMember
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from routers.developer_keys import verify_app_owner
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class ActivityLogResponse(BaseModel):
    id: int
    app_id: Optional[int]
    user_id: Optional[int]
    action_type: str
    details: Optional[Dict[str, Any]]
    ip_address: str
    country: Optional[str]
    user_agent: Optional[str]
    hwid: Optional[str]
    is_suspicious: bool
    risk_score: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ChartDataPoint(BaseModel):
    name: str
    logins: int

class CountryStat(BaseModel):
    name: str
    count: int

class KeyUsageStat(BaseModel):
    type: str
    count: int

class SuspiciousIP(BaseModel):
    ip: str
    attempts: int
    status: str

class AppAnalyticsResponse(BaseModel):
    total_users: int
    banned_users: int
    active_keys: int
    active_sessions: int
    recent_activity: List[ActivityLogResponse]
    chart_data: List[ChartDataPoint]
    top_countries: List[CountryStat]
    key_usage: List[KeyUsageStat]
    suspicious_24h: int
    suspicious_ips: List[SuspiciousIP]
    app_name: Optional[str] = None
    app_status: Optional[str] = None
    total_apps: Optional[int] = None

router = APIRouter(prefix="/api/v1/developer/analytics", tags=["Analytics"])

def utc_now():
    return datetime.now(timezone.utc)

async def calculate_app_stats(db: AsyncSession, app_ids: list[int], days: int = 7):
    # Total Users
    user_count_res = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id.in_(app_ids), EndUser.is_shadow == False))
    total_users = user_count_res.scalar() or 0

    # Banned Users
    banned_count_res = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id.in_(app_ids), EndUser.is_banned == True, EndUser.is_shadow == False))
    banned_users = banned_count_res.scalar() or 0

    # Active Keys
    key_count_res = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id.in_(app_ids), LicenseKey.is_paused == False))
    active_keys = key_count_res.scalar() or 0

    # Active Sessions
    session_count_res = await db.execute(select(func.count(Session.id)).where(Session.app_id.in_(app_ids), Session.expires_at > utc_now()))
    active_sessions = session_count_res.scalar() or 0

    # Recent Activity
    activity_res = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.app_id.in_(app_ids))
        .order_by(ActivityLog.timestamp.desc())
        .limit(10)
    )
    recent_activity = activity_res.scalars().all()
    
    suspicious_count_res = await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id.in_(app_ids),
            ActivityLog.is_suspicious == True,
            ActivityLog.timestamp > utc_now() - timedelta(days=days)
        )
    )
    suspicious_24h = suspicious_count_res.scalar() or 0

    # Top Suspicious IPs
    suspicious_ips_res = await db.execute(
        select(ActivityLog.ip_address, func.count(ActivityLog.id))
        .where(ActivityLog.app_id.in_(app_ids), ActivityLog.is_suspicious == True)
        .group_by(ActivityLog.ip_address)
        .order_by(func.count(ActivityLog.id).desc())
        .limit(3)
    )
    suspicious_ips = [{"ip": row[0], "attempts": row[1], "status": "error"} for row in suspicious_ips_res.all()]

    # Chart Data
    chart_data = []
    for i in range(days - 1, -1, -1):
        day = utc_now().date() - timedelta(days=i)
        start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
        end = datetime.combine(day, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        login_res = await db.execute(select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id.in_(app_ids),
            ActivityLog.action_type == "login",
            ActivityLog.timestamp.between(start, end)
        ))
        chart_data.append({
            "name": day.strftime("%a"),
            "logins": login_res.scalar() or 0
        })

    # Top Countries
    country_res = await db.execute(
        select(EndUser.country_code, func.count(EndUser.id))
        .where(EndUser.app_id.in_(app_ids), EndUser.is_shadow == False)
        .group_by(EndUser.country_code)
        .order_by(func.count(EndUser.id).desc())
        .limit(5)
    )
    top_countries = [{"name": row[0] or "Unknown", "count": row[1]} for row in country_res.all()]

    # Key Usage
    key_usage_res = await db.execute(
        select(LicenseKey.key_type, func.count(LicenseKey.id))
        .where(LicenseKey.app_id.in_(app_ids))
        .group_by(LicenseKey.key_type)
    )
    key_usage = [{"type": row[0], "count": row[1]} for row in key_usage_res.all()]

    return {
        "total_users": total_users,
        "banned_users": banned_users,
        "active_keys": active_keys,
        "active_sessions": active_sessions,
        "recent_activity": recent_activity,
        "chart_data": chart_data,
        "top_countries": top_countries,
        "key_usage": key_usage,
        "suspicious_24h": suspicious_24h,
        "suspicious_ips": suspicious_ips
    }

@router.get("/overview")
async def get_overview(days: int = 7, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    from core.redis import get_redis
    
    cache_key = f"overview_{dev.id}_{days}"
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return Response(content=cached, media_type="application/json")
    except Exception as e:
        redis = None
        print("Redis cache error:", e)

    # Fetch all app IDs
    stmt = select(Application.id).where(
        (Application.developer_id == dev.id) |
        (Application.developer_id.in_(
            select(TeamMember.developer_id).where(TeamMember.user_id == dev.id)
        ))
    )
    app_res = await db.execute(stmt)
    app_ids = [row for row in app_res.scalars().all()]
    
    if not app_ids:
        res = {
            "total_apps": 0, 
            "total_users": 0, 
            "banned_users": 0,
            "active_keys": 0, 
            "active_sessions": 0, 
            "chart_data": [], 
            "recent_activity": [], 
            "top_countries": [], 
            "key_usage": [], 
            "suspicious_24h": 0, 
            "suspicious_ips": []
        }
        return res
        
    # Use the original comprehensive stats calculation
    stats = await calculate_app_stats(db, app_ids, days)
    stats["total_apps"] = len(app_ids)
    
    response_model = AppAnalyticsResponse(**stats)
    response_json = response_model.model_dump_json()
    
    if redis:
        try:
            await redis.set(cache_key, response_json, ex=60) # 60 seconds cache
        except Exception:
            pass
            
    return Response(content=response_json, media_type="application/json")

@router.get("/search")
async def global_search(q: str, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    if len(q) < 2: return {"apps": [], "users": [], "keys": []}
    stmt = select(Application.id).where(
        (Application.developer_id == dev.id) |
        (Application.developer_id.in_(
            select(TeamMember.developer_id).where(TeamMember.user_id == dev.id)
        ))
    )
    app_res = await db.execute(stmt)
    app_ids = [row for row in app_res.scalars().all()]
    if not app_ids: return {"apps": [], "users": [], "keys": []}
    
    from schemas.dashboard import AppResponse
    from schemas.client import EndUserResponse # Check if this exists
    # For now, let's just return raw and hope it works or add a dedicated schema
    
    apps_stmt = select(Application).where(
        ((Application.developer_id == dev.id) | (Application.developer_id.in_(
            select(TeamMember.developer_id).where(TeamMember.user_id == dev.id)
        ))),
        Application.name.ilike(f"%{q}%")
    )
    apps_res = await db.execute(apps_stmt)
    users_res = await db.execute(select(EndUser).where(EndUser.app_id.in_(app_ids), (EndUser.username.ilike(f"%{q}%")) | (EndUser.email.ilike(f"%{q}%"))).limit(10))
    keys_res = await db.execute(select(LicenseKey).where(LicenseKey.app_id.in_(app_ids), (LicenseKey.key_value.ilike(f"%{q}%")) | (LicenseKey.note.ilike(f"%{q}%"))).limit(10))
    return {
        "apps": apps_res.scalars().all(), 
        "users": users_res.scalars().all(), 
        "keys": keys_res.scalars().all()
    }

@router.get("/{app_id}", response_model=AppAnalyticsResponse)
async def get_app_analytics(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    stats = await calculate_app_stats(db, [app_id])
    app_res = await db.execute(select(Application).where(Application.id == app_id))
    app = app_res.scalar_one()
    stats["app_name"] = app.name
    stats["app_status"] = app.status
    return stats
@router.delete("/{app_id}/logs")
async def clear_app_logs(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    from sqlalchemy import delete
    await db.execute(delete(ActivityLog).where(ActivityLog.app_id == app_id))
    await db.commit()
    return {"status": "success"}
