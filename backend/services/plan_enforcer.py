"""
Reusable plan feature and limit enforcement utilities.

Usage::
    from services.plan_enforcer import require_feature, check_limit

    await require_feature(dev, "has_webhooks", db)
    await check_limit(dev, "max_keys_per_month", current_count, db)
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.domain import DeveloperAccount, SubscriptionPlan


async def get_plan(dev: DeveloperAccount, db: AsyncSession) -> SubscriptionPlan | None:
    if not dev.plan_id:
        return None
    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == dev.plan_id))
    return res.scalars().first()


async def require_feature(
    dev: DeveloperAccount,
    feature: str,
    db: AsyncSession,
    plan: SubscriptionPlan | None = None,
) -> SubscriptionPlan:
    if plan is None:
        plan = await get_plan(dev, db)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active subscription plan. Please choose a plan to access this feature.",
        )
    allowed = getattr(plan, feature, False)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your current plan does not include this feature. Upgrade to unlock.",
        )
    return plan


async def check_limit(
    dev: DeveloperAccount,
    limit_field: str,
    current_count: int,
    db: AsyncSession,
    plan: SubscriptionPlan | None = None,
) -> SubscriptionPlan:
    if plan is None:
        plan = await get_plan(dev, db)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active subscription plan. Please choose a plan to access this feature.",
        )
    limit = getattr(plan, limit_field, 0)
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You have reached the limit for this resource ({limit}). Upgrade your plan to increase it.",
        )
    return plan
