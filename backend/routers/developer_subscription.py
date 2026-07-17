from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, ActivationCode, SubscriptionPlan, SellerAccount
from services.plan_tiers import tier_from_plan_name
from services.plan_enforcer import get_plan

router = APIRouter(prefix="/api/v1/developer/subscription", tags=["Developer Subscription"])


async def _get_dev(
    seller_key: str = Header(None, alias="seller-key"),
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
) -> DeveloperAccount:
    if seller_key:
        res = await db.execute(
            select(SellerAccount).where(
                SellerAccount.api_key == seller_key,
                SellerAccount.is_active == True,
            )
        )
        seller = res.scalars().first()
        if seller:
            dev_res = await db.execute(
                select(DeveloperAccount).where(DeveloperAccount.id == seller.developer_id)
            )
            seller_dev = dev_res.scalars().first()
            if seller_dev:
                return seller_dev
    return dev


@router.get("/plan")
async def get_plan_info(
    dev: DeveloperAccount = Depends(_get_dev),
    db: AsyncSession = Depends(get_db),
):
    plan = await get_plan(dev, db)
    if not plan:
        return {
            "plan": None,
            "tier": dev.subscription_tier or "tester",
            "limits": {},
        }
    return {
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "tier": dev.subscription_tier,
            "max_apps": plan.max_apps,
            "max_licenses": plan.max_licenses,
            "max_users_per_app": plan.max_users_per_app,
            "max_devices": plan.max_devices,
            "max_staff": plan.max_staff,
            "max_chatrooms": plan.max_chatrooms,
            "max_variables": plan.max_variables,
            "max_logs": plan.max_logs,
            "features": plan.features_json,
            "ai_agent_access": plan.ai_agent_access,
            "has_webhooks": plan.has_webhooks,
            "has_white_label": plan.has_white_label,
            "has_custom_domain": plan.has_custom_domain,
        },
        "tier": dev.subscription_tier,
    }


@router.post("/redeem")
async def redeem_code(
    data: dict,
    dev: DeveloperAccount = Depends(_get_dev),
    db: AsyncSession = Depends(get_db),
):
    code_str = (data.get("code") or "").strip()
    if not code_str:
        raise HTTPException(400, "Code is required")

    res = await db.execute(
        select(ActivationCode).where(ActivationCode.code == code_str)
    )
    activation = res.scalars().first()

    if not activation:
        raise HTTPException(404, "Invalid activation code")
    if not activation.is_active:
        raise HTTPException(400, "This activation code has been deactivated")
    if activation.is_used:
        raise HTTPException(400, "This activation code has already been used")
    if activation.expires_at and activation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "This activation code has expired")
    if activation.target_developer_id and activation.target_developer_id != dev.id:
        raise HTTPException(403, "This activation code is not assigned to your account")

    plan_res = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == activation.plan_id)
    )
    plan = plan_res.scalars().first()
    if not plan:
        raise HTTPException(400, "Plan not found for this code")

    activation.is_used = True
    activation.used_by_developer_id = dev.id
    activation.used_at = datetime.now(timezone.utc)

    dev.plan_id = plan.id
    dev.subscription_tier = tier_from_plan_name(plan.name)

    await db.commit()

    return {
        "status": "success",
        "message": f"Upgraded to {plan.name} plan",
        "plan": plan.name,
        "tier": dev.subscription_tier,
    }


@router.get("/codes")
async def list_codes(
    dev: DeveloperAccount = Depends(_get_dev),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(ActivationCode).where(
            (ActivationCode.used_by_developer_id == dev.id) |
            (ActivationCode.target_developer_id == dev.id)
        ).order_by(ActivationCode.created_at.desc())
    )
    codes = res.scalars().all()
    return {
        "codes": [
            {
                "code": c.code,
                "plan_id": c.plan_id,
                "is_used": c.is_used,
                "used_at": c.used_at.isoformat() if c.used_at else None,
                "source": c.source,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None,
            }
            for c in codes
        ]
    }
