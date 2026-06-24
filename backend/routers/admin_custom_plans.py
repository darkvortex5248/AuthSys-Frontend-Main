from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from core.database import get_db
from models.domain import AdminUser, DeveloperAccount, SubscriptionPlan, CustomPlanOverride
from schemas.premium import CustomPlanOverrideCreate, CustomPlanOverrideResponse
from schemas.admin import PlanCreate, PlanUpdate, PlanResponse
from routers.admin import get_current_admin

router = APIRouter(prefix="/api/v1/admin/custom-plans", tags=["Custom Plans"])

@router.get("/overrides", response_model=List[CustomPlanOverrideResponse])
async def get_all_overrides(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CustomPlanOverride).order_by(CustomPlanOverride.created_at.desc())
    )
    return res.scalars().all()

@router.get("/overrides/{developer_id}", response_model=List[CustomPlanOverrideResponse])
async def get_developer_overrides(developer_id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CustomPlanOverride).where(CustomPlanOverride.developer_id == developer_id)
        .order_by(CustomPlanOverride.created_at.desc())
    )
    return res.scalars().all()

@router.post("/overrides", response_model=CustomPlanOverrideResponse)
async def create_override(ov: CustomPlanOverrideCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == ov.developer_id))
    if not dev_res.scalars().first():
        raise HTTPException(404, "Developer not found")
    new_ov = CustomPlanOverride(**ov.model_dump())
    db.add(new_ov)
    await db.commit()
    await db.refresh(new_ov)
    return new_ov

@router.delete("/overrides/{override_id}")
async def delete_override(override_id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CustomPlanOverride).where(CustomPlanOverride.id == override_id))
    ov = res.scalars().first()
    if not ov:
        raise HTTPException(404, "Override not found")
    await db.delete(ov)
    await db.commit()
    return {"status": "deleted"}

@router.put("/overrides/{override_id}/toggle")
async def toggle_override(override_id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CustomPlanOverride).where(CustomPlanOverride.id == override_id))
    ov = res.scalars().first()
    if not ov:
        raise HTTPException(404, "Override not found")
    ov.is_active = not ov.is_active
    await db.commit()
    return {"status": "toggled", "is_active": ov.is_active}

AVAILABLE_FEATURES = [
    {"key": "max_apps", "label": "Max Applications", "type": "number"},
    {"key": "max_users_per_app", "label": "Max Users Per App", "type": "number"},
    {"key": "max_keys_per_month", "label": "Max Keys Per Month", "type": "number"},
    {"key": "audit_log_limit", "label": "Audit Log Limit", "type": "number"},
    {"key": "max_licenses", "label": "Max Licenses", "type": "number"},
    {"key": "max_variables", "label": "Max Variables", "type": "number"},
    {"key": "max_logs", "label": "Max Logs", "type": "number"},
    {"key": "max_hashes", "label": "Max Hashes", "type": "number"},
    {"key": "max_staff", "label": "Max Staff Members", "type": "number"},
    {"key": "max_chatrooms", "label": "Max Chat Rooms", "type": "number"},
    {"key": "ai_agent_access", "label": "AI Agent Access", "type": "boolean"},
    {"key": "has_audit_logs", "label": "Audit Logs Feature", "type": "boolean"},
    {"key": "has_webhooks", "label": "Webhooks Feature", "type": "boolean"},
    {"key": "has_white_label", "label": "White Label", "type": "boolean"},
    {"key": "has_api_access", "label": "API Access", "type": "boolean"},
    {"key": "has_custom_domain", "label": "Custom Domain", "type": "boolean"},
    {"key": "has_priority_support", "label": "Priority Support", "type": "boolean"},
    {"key": "has_ip_tracking", "label": "IP Tracking", "type": "boolean"},
    {"key": "has_location_tracking", "label": "Location Tracking", "type": "boolean"},
    {"key": "has_user_panel", "label": "User Panel", "type": "boolean"},
    {"key": "has_staff_management", "label": "Staff Management", "type": "boolean"},
    {"key": "has_discord_integration", "label": "Discord Integration", "type": "boolean"},
    {"key": "has_telegram_integration", "label": "Telegram Integration", "type": "boolean"},
    {"key": "has_live_chat", "label": "Live Chat", "type": "boolean"},
    {"key": "has_ssl", "label": "SSL Support", "type": "boolean"},
    {"key": "has_global_chat", "label": "Global Chat", "type": "boolean"},
    {"key": "has_custom_bot", "label": "Custom Bot", "type": "boolean"},
    {"key": "has_behavioral_threat_intel", "label": "Behavioral Threat Intelligence", "type": "boolean"},
    {"key": "has_version_whitelist", "label": "Version Whitelist", "type": "boolean"},
]

@router.put("/overrides/{override_id}", response_model=CustomPlanOverrideResponse)
async def update_override(override_id: int, ov: CustomPlanOverrideCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CustomPlanOverride).where(CustomPlanOverride.id == override_id))
    existing = res.scalars().first()
    if not existing:
        raise HTTPException(404, "Override not found")
    dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == ov.developer_id))
    if not dev_res.scalars().first():
        raise HTTPException(404, "Developer not found")
    existing.developer_id = ov.developer_id
    existing.feature_key = ov.feature_key
    existing.feature_value = ov.feature_value
    existing.label = ov.label
    await db.commit()
    await db.refresh(existing)
    return existing

@router.get("/available-features")
async def get_available_features(admin: AdminUser = Depends(get_current_admin)):
    return AVAILABLE_FEATURES

@router.get("/calculator")
async def get_plan_calculator(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.id.asc()))
    plans = res.scalars().all()
    return {
        "plans": [{"id": p.id, "name": p.name, "price_monthly": p.price_monthly, "price_yearly": p.price_yearly} for p in plans],
        "features": AVAILABLE_FEATURES,
    }
