from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, UsageRecord, Application, LicenseKey, EndUser, ActivityLog, SubscriptionPlan
from schemas.premium import UsageRecordResponse
from datetime import datetime, timezone, timedelta
from typing import List, Optional

router = APIRouter(prefix="/api/v1/developer/usage", tags=["Usage"])

@router.get("/current")
async def get_current_usage(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    app_count = (await db.execute(
        select(func.count(Application.id)).where(Application.developer_id == dev.id)
    )).scalar() or 0
    user_count = (await db.execute(
        select(func.count(EndUser.id))
        .join(Application, EndUser.app_id == Application.id)
        .where(Application.developer_id == dev.id, EndUser.is_shadow == False)
    )).scalar() or 0
    key_count = (await db.execute(
        select(func.count(LicenseKey.id))
        .join(Application, LicenseKey.app_id == Application.id)
        .where(Application.developer_id == dev.id)
    )).scalar() or 0
    api_calls_month = (await db.execute(
        select(func.coalesce(func.sum(UsageRecord.quantity), 0)).where(
            UsageRecord.developer_id == dev.id,
            UsageRecord.metric == "api_calls",
            UsageRecord.billing_period_start >= month_start,
        )
    )).scalar() or 0
    logins_month = (await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.action_type == "login",
            ActivityLog.created_at >= month_start,
            ActivityLog.app_id.in_(
                select(Application.id).where(Application.developer_id == dev.id)
            )
        )
    )).scalar() or 0
    plan_limits = {}
    if dev.plan_id:
        plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == dev.plan_id))
        plan = plan_res.scalars().first()
        if plan:
            plan_limits = {
                "max_apps": plan.max_apps, "max_users": plan.max_users_per_app,
                "max_keys": plan.max_keys_per_month, "audit_log_limit": plan.audit_log_limit,
            }
    team_count = (await db.execute(
        select(func.count(DeveloperAccount.id)).where(DeveloperAccount.id == dev.id)  # placeholder
    )).scalar() or 0
    return {
        "apps": {"current": app_count, "limit": plan_limits.get("max_apps", 999999)},
        "users": {"current": user_count, "limit": plan_limits.get("max_users", 999999)},
        "keys": {"current": key_count, "limit": plan_limits.get("max_keys", 999999)},
        "api_calls_this_month": api_calls_month,
        "logins_this_month": logins_month,
        "plan_tier": dev.subscription_tier,
        "app_count": app_count,
        "app_limit": plan_limits.get("max_apps", 999999),
        "key_count": key_count,
        "key_limit": plan_limits.get("max_keys", 999999),
        "api_requests": api_calls_month,
        "api_limit": plan_limits.get("audit_log_limit", 1000),
        "team_count": team_count,
        "team_limit": plan_limits.get("max_users", 1),
    }

@router.get("/history", response_model=List[UsageRecordResponse])
async def get_usage_history(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(UsageRecord).where(UsageRecord.developer_id == dev.id)
        .order_by(UsageRecord.created_at.desc()).limit(100)
    )
    return res.scalars().all()

async def record_usage(dev_id: int, metric: str, quantity: int, db: AsyncSession):
    now = datetime.now(timezone.utc)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    res = await db.execute(
        select(UsageRecord).where(
            UsageRecord.developer_id == dev_id,
            UsageRecord.metric == metric,
            UsageRecord.billing_period_start == period_start,
        )
    )
    record = res.scalars().first()
    if record:
        record.quantity += quantity
    else:
        record = UsageRecord(
            developer_id=dev_id, metric=metric, quantity=quantity,
            billing_period_start=period_start, billing_period_end=period_end,
        )
        db.add(record)
    await db.commit()
