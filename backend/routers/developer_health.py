from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Application, HealthCheckRecord, LogRetentionConfig, ActivityLog
from schemas.premium import HealthCheckResponse, LogRetentionUpdate, LogRetentionResponse
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter(prefix="/api/v1/developer/health", tags=["Health"])

@router.get("/checks/{app_id}", response_model=list[HealthCheckResponse])
async def get_health_checks(app_id: int, limit: int = 50, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == app_id, Application.developer_id == dev.id)
    )
    if not app_res.scalars().first():
        raise HTTPException(404, "App not found")
    res = await db.execute(
        select(HealthCheckRecord).where(HealthCheckRecord.app_id == app_id)
        .order_by(HealthCheckRecord.checked_at.desc())
        .limit(limit)
    )
    return res.scalars().all()

@router.get("/dashboard/{app_id}")
async def get_health_dashboard(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == app_id, Application.developer_id == dev.id)
    )
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(404, "App not found")
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    total_logins = (await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id == app_id, ActivityLog.action_type == "login"
        )
    )).scalar() or 0
    logins_24h = (await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id == app_id, ActivityLog.action_type == "login",
            ActivityLog.created_at >= now - timedelta(hours=24)
        )
    )).scalar() or 0
    login_errors = (await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id == app_id, ActivityLog.action_type == "login_failed",
            ActivityLog.created_at >= week_ago
        )
    )).scalar() or 0
    active_users = (await db.execute(
        select(func.count(func.distinct(ActivityLog.user_id))).where(
            ActivityLog.app_id == app_id, ActivityLog.created_at >= month_ago
        )
    )).scalar() or 0
    recent_checks = await db.execute(
        select(HealthCheckRecord).where(HealthCheckRecord.app_id == app_id)
        .order_by(HealthCheckRecord.checked_at.desc()).limit(20)
    )
    checks = recent_checks.scalars().all()
    uptime_pct = 100.0
    if checks:
        up_count = sum(1 for c in checks if c.is_up)
        uptime_pct = round((up_count / len(checks)) * 100, 1)
    return {
        "total_logins": total_logins,
        "logins_24h": logins_24h,
        "login_errors_7d": login_errors,
        "active_users_30d": active_users,
        "uptime_percentage": uptime_pct,
        "recent_checks": [{"id": c.id, "status_code": c.status_code, "response_time_ms": c.response_time_ms, "is_up": c.is_up, "checked_at": c.checked_at.isoformat()} for c in checks],
        "app_status": app.status,
        "maintenance_mode": app.maintenance_mode,
    }

# ── Log Retention ──────────────────────────────────────────────────────

@router.get("/retention/{app_id}", response_model=LogRetentionResponse)
async def get_retention(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == app_id, Application.developer_id == dev.id)
    )
    if not app_res.scalars().first():
        raise HTTPException(404, "App not found")
    res = await db.execute(select(LogRetentionConfig).where(LogRetentionConfig.app_id == app_id))
    cfg = res.scalars().first()
    if not cfg:
        cfg = LogRetentionConfig(app_id=app_id)
        db.add(cfg)
        await db.commit()
        await db.refresh(cfg)
    return cfg

@router.put("/retention/{app_id}", response_model=LogRetentionResponse)
async def update_retention(app_id: int, upd: LogRetentionUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == app_id, Application.developer_id == dev.id)
    )
    if not app_res.scalars().first():
        raise HTTPException(404, "App not found")
    res = await db.execute(select(LogRetentionConfig).where(LogRetentionConfig.app_id == app_id))
    cfg = res.scalars().first()
    if not cfg:
        cfg = LogRetentionConfig(app_id=app_id)
        db.add(cfg)
    cfg.retention_days = upd.retention_days
    cfg.auto_cleanup = upd.auto_cleanup
    await db.commit()
    await db.refresh(cfg)
    return cfg
