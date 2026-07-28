from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func
import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import Application, DeveloperAccount, SubscriptionPlan, EndUser, LicenseKey, ActivityLog, TeamMember
from schemas.dashboard import KeyGenerate, BulkKeyGenerate
from services.plan_enforcer import require_feature, check_limit
from services.webhooks import trigger_webhook

router = APIRouter(prefix="/api/v1/developer/keys", tags=["Keys"])

def generate_key_string():
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits
    def get_part():
        return ''.join(secrets.choice(alphabet) for _ in range(6))
    return f"AUTHSYS-{get_part()}-{get_part()}-{get_part()}-{get_part()}-{get_part()}-{get_part()}"

async def verify_app_owner(app_id: int, dev_id: int, db: AsyncSession):
    # Check if user is the owner OR a team member of the owner
    stmt = select(Application).where(
        (Application.id == app_id) & (
            (Application.developer_id == dev_id) |
            (Application.developer_id.in_(
                select(TeamMember.developer_id).where(TeamMember.user_id == dev_id)
            ))
        )
    )
    res = await db.execute(stmt)
    app = res.scalars().first()
    if not app: 
        raise HTTPException(status_code=403, detail="Access denied: You do not own this app or have team permissions")
    return app

@router.get("/{app_id}")
async def get_keys(app_id: int, skip: int = 0, limit: int = 50, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    total = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id))
    total_count = total.scalar_one()
    res = await db.execute(select(LicenseKey).where(LicenseKey.app_id == app_id).offset(skip).limit(limit))
    keys = res.scalars().all()
    return {"keys": keys, "total": total_count, "skip": skip, "limit": limit}

@router.post("/generate")
async def generate_key(req: KeyGenerate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app = await verify_app_owner(req.app_id, dev.id, db)
    plan = await require_feature(dev, "has_api_access", db)
    # Check key limit
    key_count = await db.execute(select(LicenseKey).where(LicenseKey.app_id == req.app_id))
    current_keys = len(key_count.scalars().all())
    await check_limit(dev, "max_keys_per_month", current_keys, db, plan)
    key_val = req.custom_key if req.custom_key else generate_key_string()
    
    # Check if key already exists
    existing = await db.execute(select(LicenseKey).where(LicenseKey.key_value == key_val))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This license key already exists")
    
    # Expiry: use custom expires_at if set, otherwise calculate from duration_days
    expires_at = req.expires_at
    if expires_at is None and req.key_type == "time" and req.duration_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.duration_days)

    # Device limit: use max_devices if provided, otherwise fall back to max_uses
    max_devices = req.max_devices
    if max_devices is None:
        max_devices = req.max_uses
    if max_devices is None and req.key_type != "uses_based":
        max_devices = 1

    new_key = LicenseKey(
        app_id=req.app_id, key_value=key_val, key_type=req.key_type, 
        duration_days=req.duration_days, max_uses=req.max_uses, 
        max_devices=max_devices,
        note=req.note, seller_tag=req.seller_tag,
        expires_at=expires_at
    )
    db.add(new_key)
    await db.commit()
    
    await trigger_webhook(req.app_id, "key_generated", {
        "key": key_val,
        "type": req.key_type,
        "note": req.note,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, db)

    await db.refresh(new_key)
    return new_key

@router.post("/bulk-generate")
async def bulk_generate(req: BulkKeyGenerate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    from services.plan_tiers import require_feature
    app = await verify_app_owner(req.app_id, dev.id, db)
    if req.count > 1000: raise HTTPException(400, "Max 1000 keys at once")
    plan = await require_feature(dev, "has_api_access", db)
    # Check key limit
    key_count = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == req.app_id))
    current_keys = key_count.scalar_one()
    if current_keys + req.count > plan.max_keys_per_month:
        raise HTTPException(status_code=403, detail=f"Bulk generation would exceed plan limit ({plan.max_keys_per_month} keys). Current: {current_keys}, Requested: {req.count}")
    expires_at = req.expires_at
    if expires_at is None and req.key_type == "time" and req.duration_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.duration_days)

    keys = []
    skipped = []
    key_values = req.custom_keys if req.custom_keys else []
    max_devices = req.max_devices
    if max_devices is None:
        max_devices = req.max_uses
    if max_devices is None and req.key_type != "uses_based":
        max_devices = 1
    for i in range(req.count):
        key_val = key_values[i] if i < len(key_values) else generate_key_string()
        existing = await db.execute(select(LicenseKey).where(LicenseKey.key_value == key_val))
        if existing.scalars().first():
            skipped.append(key_val)
            continue
        k = LicenseKey(
            app_id=req.app_id, key_value=key_val,
            key_type=req.key_type, duration_days=req.duration_days, 
            max_uses=req.max_uses, max_devices=max_devices,
            note=req.note, seller_tag=req.seller_tag,
            expires_at=expires_at
        )
        keys.append(k)
        db.add(k)
    await db.commit()
    for k in keys:
        await db.refresh(k)

    await trigger_webhook(req.app_id, "key_generated", {
        "count": req.count,
        "type": req.key_type,
        "keys": [k.key_value for k in keys],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, db)

    result = {"count": len(keys), "keys": [k.key_value for k in keys], "items": keys}
    if skipped:
        result["skipped_duplicates"] = skipped
    return result

@router.post("/{key_id}/pause")
async def pause_key(key_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LicenseKey).where(LicenseKey.id == key_id))
    key = res.scalars().first()
    if not key: raise HTTPException(404, "Not found")
    await verify_app_owner(key.app_id, dev.id, db)
    key.is_paused = not key.is_paused
    await db.commit()
    return {"paused": key.is_paused}

@router.delete("/{key_id}")
async def delete_key(key_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LicenseKey).where(LicenseKey.id == key_id))
    key = res.scalars().first()
    if not key: raise HTTPException(404, "Not found")
    await verify_app_owner(key.app_id, dev.id, db)
    await db.delete(key)
    await db.commit()
    return {"status": "deleted"}

class KeyUpdate(BaseModel):
    key_type: Optional[str] = None
    duration_days: Optional[int] = None
    max_uses: Optional[int] = None
    max_devices: Optional[int] = None
    note: Optional[str] = None
    seller_tag: Optional[str] = None
    expires_at: Optional[datetime] = None

@router.put("/{key_id}")
async def update_key(key_id: int, req: KeyUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LicenseKey).where(LicenseKey.id == key_id))
    key = res.scalars().first()
    if not key: raise HTTPException(404, "Not found")
    await verify_app_owner(key.app_id, dev.id, db)
    
    if req.key_type: key.key_type = req.key_type
    if req.duration_days is not None: key.duration_days = req.duration_days
    if req.max_uses is not None: key.max_uses = req.max_uses
    if req.max_devices is not None: key.max_devices = req.max_devices
    if req.note is not None: key.note = req.note
    if req.seller_tag is not None: key.seller_tag = req.seller_tag
    if req.expires_at is not None: key.expires_at = req.expires_at
    
    await db.commit()
    return key

@router.post("/{key_id}/hwid-reset")
async def reset_key_hwid(key_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LicenseKey).where(LicenseKey.id == key_id))
    key = res.scalars().first()
    if not key: raise HTTPException(404, "Not found")
    await verify_app_owner(key.app_id, dev.id, db)
    
    # Reset HWID for all users linked to this key
    from models.domain import EndUser
    await db.execute(
        update(EndUser)
        .where(EndUser.license_key_id == key_id)
        .values(hwid=None, hwids=[])
    )
    await db.commit()

    await trigger_webhook(key.app_id, "hwid_reset", {
        "license_key": key.key_value,
        "action": "bulk_reset_by_key",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, db)

    return {"status": "hwid_reset"}
