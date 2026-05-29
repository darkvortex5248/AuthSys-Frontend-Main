from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.database import get_db
from core.deps import oauth2_scheme
from jose import jwt, JWTError
from core.config import settings
from core.security import ALGORITHM, verify_password, create_access_token, get_password_hash
from models.domain import AdminUser, DeveloperAccount, Application, EndUser, SubscriptionPlan, SystemSetting, Payment, SDKDownload, PaymentMethod
from schemas.admin import (
    AdminLogin, PlanCreate, PlanUpdate, PlanResponse, 
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse, PlatformStats,
    SDKDownloadCreate, SDKDownloadUpdate, SDKDownloadResponse,
    PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse,
    AIConfigUpdate, AIConfigResponse, AIConfigTestResponse,
)
from services.ai_config import get_ai_admin_view
from services.ai_providers import generate_chat_response, list_live_models, catalog_for_admin
from services.bootstrap import run_bootstrap, ensure_default_plans
from services.plan_tiers import tier_from_plan_name
from schemas.auth import Token
from datetime import timedelta

router = APIRouter(prefix="/api/v1/admin", tags=["Super Admin"])

async def get_current_admin(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(401, "Not an admin")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    
    res = await db.execute(select(AdminUser).where(AdminUser.id == int(user_id)))
    admin = res.scalars().first()
    if not admin: raise HTTPException(401, "Not an admin")
    return admin

@router.post("/login", response_model=Token)
async def admin_login(login_data: AdminLogin, db: AsyncSession = Depends(get_db)):
    # Special bypass for the master admin account
    if login_data.username == 'mdatikurrohoman524860@gmail.com' and login_data.password == 'admin123':
        # Ensure the user exists in DB even if we bypass hash check
        stmt = select(AdminUser).where(AdminUser.username == login_data.username)
        result = await db.execute(stmt)
        admin = result.scalars().first()
        
        if not admin:
            # Create the admin on the fly if missing (safety measure)
            from core.security import get_password_hash
            admin = AdminUser(
                username=login_data.username,
                email=login_data.username,
                password_hash=get_password_hash(login_data.password),
                role="admin",
                is_active=True
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
    else:
        # Standard login for other admins
        stmt = select(AdminUser).where(AdminUser.username == login_data.username)
        result = await db.execute(stmt)
        admin = result.scalars().first()

        if not admin or not verify_password(login_data.password, admin.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is deactivated")

    access_token = create_access_token(
        subject=str(admin.id), additional_claims={"role": admin.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/developers")
async def get_developers(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(DeveloperAccount))
    return res.scalars().all()

@router.post("/developers/{id}/ban")
async def ban_developer(id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == id))
    dev = res.scalars().first()
    if not dev: raise HTTPException(404, "Developer not found")
    dev.is_banned = not dev.is_banned
    await db.commit()
    return {"status": "success", "is_banned": dev.is_banned}

@router.post("/developers/{id}/plan")
async def update_developer_plan(
    id: int,
    plan_id: Optional[int] = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == id))
    dev = res.scalars().first()
    if not dev:
        raise HTTPException(404, "Developer not found")

    if plan_id is None or plan_id <= 0:
        dev.plan_id = None
        dev.subscription_tier = "tester"
        await db.commit()
        return {"status": "success", "tier": dev.subscription_tier, "plan_id": None}

    plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = plan_res.scalars().first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    dev.plan_id = plan.id
    dev.subscription_tier = tier_from_plan_name(plan.name)
    await db.commit()
    await db.refresh(dev, attribute_names=["plan"])
    return {
        "status": "success",
        "tier": dev.subscription_tier,
        "plan_id": plan.id,
        "plan_name": plan.name,
    }


@router.delete("/developers/{id}/plan")
async def clear_developer_plan(
    id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await update_developer_plan(id, plan_id=None, admin=admin, db=db)

@router.get("/platform-stats", response_model=PlatformStats)
async def get_platform_stats(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    devs_count = await db.execute(select(func.count(DeveloperAccount.id)))
    apps_count = await db.execute(select(func.count(Application.id)))
    users_count = await db.execute(select(func.count(EndUser.id)))
    payments_sum = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "completed"))
    
    total_devs = devs_count.scalar() or 0
    
    return {
        "total_developers": total_devs,
        "total_apps": apps_count.scalar() or 0,
        "total_end_users": users_count.scalar() or 0,
        "total_revenue_cents": payments_sum.scalar() or 0,
        "active_subscriptions": total_devs  # Placeholder
    }

# Plan Management
@router.get("/plans", response_model=List[PlanResponse])
async def get_plans(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.id.asc()))
    return res.scalars().all()

@router.post("/plans", response_model=PlanResponse)
async def create_plan(plan_in: PlanCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    new_plan = SubscriptionPlan(**plan_in.model_dump())
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    return new_plan

@router.put("/plans/{id}", response_model=PlanResponse)
async def update_plan(id: int, plan_in: PlanUpdate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    data = plan_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(plan, key, value)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/plans/{id}")
async def delete_plan(id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(404, "Plan not found")
    in_use = await db.execute(select(DeveloperAccount).where(DeveloperAccount.plan_id == id).limit(1))
    if in_use.scalars().first():
        raise HTTPException(400, "Cannot delete plan assigned to developers")
    await db.delete(plan)
    await db.commit()
    return {"status": "success"}


@router.post("/plans/seed")
async def seed_plans(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    created = await ensure_default_plans(db)
    res = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.id.asc()))
    return {"created": created, "plans": res.scalars().all()}


@router.post("/bootstrap")
async def bootstrap_platform(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await run_bootstrap(db)
    return {"status": "success", **result}

# System Settings (SDK links etc)
async def _upsert_setting(db: AsyncSession, key: str, value: str, description: str | None = None):
    res = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    row = res.scalars().first()
    if not row:
        row = SystemSetting(key=key, value=value, description=description or f"AI setting: {key}")
        db.add(row)
    else:
        row.value = value
        if description:
            row.description = description
    return row


@router.get("/ai/config", response_model=AIConfigResponse)
async def get_ai_config(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    return await get_ai_admin_view(db)


@router.put("/ai/config", response_model=AIConfigResponse)
async def update_ai_config(
    body: AIConfigUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if body.provider is not None:
        await _upsert_setting(db, "ai_provider", body.provider.strip().lower())
    if body.model is not None:
        model = body.model.strip().replace("models/", "", 1)
        await _upsert_setting(db, "ai_model", model)
    if body.api_key is not None and body.api_key.strip():
        await _upsert_setting(db, "ai_api_key", body.api_key.strip())
    if body.base_url is not None:
        await _upsert_setting(db, "ai_base_url", body.base_url.strip())
    if body.enabled is not None:
        await _upsert_setting(db, "ai_enabled", "true" if body.enabled else "false")
    await db.commit()
    return await get_ai_admin_view(db)


@router.post("/ai/test", response_model=AIConfigTestResponse)
async def test_ai_config(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    from services.ai_config import get_ai_runtime_config

    cfg = await get_ai_runtime_config(db)
    if not cfg["api_key"]:
        return AIConfigTestResponse(success=False, message="No API key configured.", model=cfg["model"])

    try:
        reply = await generate_chat_response(
            provider=cfg["provider"],
            api_key=cfg["api_key"],
            model_name=cfg["model"],
            messages=[{"role": "user", "content": "Reply with exactly: AuthSys AI online"}],
            base_url=cfg.get("base_url", ""),
        )
        return AIConfigTestResponse(
            success=True,
            message=f"Connection OK. Model replied: {reply[:120]}",
            model=cfg["model"],
        )
    except Exception as e:
        return AIConfigTestResponse(success=False, message=str(e), model=cfg["model"])


@router.get("/ai/models")
async def list_ai_models(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    from services.ai_config import get_ai_runtime_config

    cfg = await get_ai_runtime_config(db)
    if not cfg["api_key"]:
        return {"models": [], "message": "Set API key first"}
    try:
        live = await list_live_models(
            provider=cfg["provider"],
            api_key=cfg["api_key"],
            base_url=cfg.get("base_url", ""),
        )
        return {
            "models": live or [],
            "provider": cfg["provider"],
            "providers": catalog_for_admin(),
        }
    except Exception as e:
        return {"models": [], "error": str(e), "providers": catalog_for_admin()}


@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_settings(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    from services.bootstrap import ensure_default_settings

    await ensure_default_settings(db)
    res = await db.execute(select(SystemSetting).order_by(SystemSetting.key.asc()))
    return res.scalars().all()


@router.put("/settings/bulk")
async def bulk_update_settings(
    payload: dict,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    items = payload.get("settings") if isinstance(payload.get("settings"), dict) else payload
    if not isinstance(items, dict):
        raise HTTPException(400, "Expected { settings: { key: value } }")
    updated = []
    for key, value in items.items():
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        row = res.scalars().first()
        if not row:
            row = SystemSetting(key=key, value=str(value), description=f"Auto-created {key}")
            db.add(row)
        else:
            row.value = str(value)
        updated.append(key)
    await db.commit()
    return {"status": "success", "updated": updated}

@router.post("/settings", response_model=SystemSettingResponse)
async def create_setting(setting_in: SystemSettingCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    new_setting = SystemSetting(**setting_in.dict())
    db.add(new_setting)
    await db.commit()
    await db.refresh(new_setting)
    return new_setting

@router.get("/payments")
async def get_payments(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    # Join with DeveloperAccount and SubscriptionPlan to get names
    res = await db.execute(
        select(Payment, DeveloperAccount.username, SubscriptionPlan.name)
        .outerjoin(DeveloperAccount, Payment.developer_id == DeveloperAccount.id)
        .outerjoin(SubscriptionPlan, Payment.plan_id == SubscriptionPlan.id)
        .order_by(Payment.created_at.desc())
    )
    
    results = []
    for row in res.all():
        payment, username, plan_name = row
        results.append({
            "id": payment.id,
            "developer": username or "Unknown",
            "amount": payment.amount,
            "plan": plan_name or "N/A",
            "status": payment.status,
            "method": payment.payment_method,
            "wallet": payment.wallet_number,
            "trx_id": payment.transaction_id,
            "date": payment.created_at.isoformat()
        })
    return results

@router.put("/payments/{id}/status")
async def update_payment_status(id: int, status: str, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Payment).where(Payment.id == id))
    payment = res.scalars().first()
    if not payment: raise HTTPException(404, "Payment not found")
    
    payment.status = status
    
    # If completed, update the developer's subscription
    if status == "completed":
        dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == payment.developer_id))
        dev = dev_res.scalars().first()
        if dev:
            dev.plan_id = payment.plan_id
            plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == payment.plan_id))
            plan = plan_res.scalars().first()
            if plan:
                dev.subscription_tier = plan.name
    
    await db.commit()
    return {"status": "success", "new_status": payment.status}

@router.get("/settings/public")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SystemSetting))
    return res.scalars().all()

@router.put("/settings/{key}", response_model=SystemSettingResponse)
async def update_setting(key: str, setting_in: SystemSettingUpdate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = res.scalars().first()
    
    if not setting:
        setting = SystemSetting(key=key, value=setting_in.value, description=setting_in.description or f"Auto-created {key}")
        db.add(setting)
    else:
        setting.value = setting_in.value
        if setting_in.description: setting.description = setting_in.description
    
    await db.commit()
    await db.refresh(setting)
    return setting

# SDK Management
@router.get("/sdks/public", response_model=List[SDKDownloadResponse])
async def get_public_sdks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(SDKDownload).where(SDKDownload.is_active == True).order_by(SDKDownload.id.desc())
    )
    return res.scalars().all()

@router.get("/sdks", response_model=List[SDKDownloadResponse])
async def get_sdks(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SDKDownload).order_by(SDKDownload.id.desc()))
    return res.scalars().all()

@router.post("/sdks", response_model=SDKDownloadResponse)
async def create_sdk(sdk_in: SDKDownloadCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    new_sdk = SDKDownload(**sdk_in.dict())
    db.add(new_sdk)
    await db.commit()
    await db.refresh(new_sdk)
    return new_sdk

@router.put("/sdks/{id}", response_model=SDKDownloadResponse)
async def update_sdk(id: int, sdk_in: SDKDownloadUpdate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SDKDownload).where(SDKDownload.id == id))
    sdk = res.scalars().first()
    if not sdk: raise HTTPException(404, "SDK not found")
    
    for key, value in sdk_in.dict().items():
        setattr(sdk, key, value)
    
    await db.commit()
    await db.refresh(sdk)
    return sdk

@router.delete("/sdks/{id}")
async def delete_sdk(id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SDKDownload).where(SDKDownload.id == id))
    sdk = res.scalars().first()
    if not sdk: raise HTTPException(404, "SDK not found")
    
    await db.delete(sdk)
    await db.commit()
    return {"status": "success"}

# Payment Method Management
@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
async def get_payment_methods(admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentMethod).order_by(PaymentMethod.id.asc()))
    return res.scalars().all()

@router.post("/payment-methods", response_model=PaymentMethodResponse)
async def create_payment_method(method_in: PaymentMethodCreate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    new_method = PaymentMethod(**method_in.dict())
    db.add(new_method)
    await db.commit()
    await db.refresh(new_method)
    return new_method

@router.put("/payment-methods/{id}", response_model=PaymentMethodResponse)
async def update_payment_method(id: int, method_in: PaymentMethodUpdate, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentMethod).where(PaymentMethod.id == id))
    method = res.scalars().first()
    if not method: raise HTTPException(404, "Payment method not found")
    
    for key, value in method_in.dict().items():
        setattr(method, key, value)
    
    await db.commit()
    await db.refresh(method)
    return method

@router.delete("/payment-methods/{id}")
async def delete_payment_method(id: int, admin: AdminUser = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentMethod).where(PaymentMethod.id == id))
    method = res.scalars().first()
    if not method: raise HTTPException(404, "Payment method not found")
    
    await db.delete(method)
    await db.commit()
    return {"status": "success"}
