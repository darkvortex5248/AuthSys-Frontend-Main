from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from core.database import get_db
from core.deps import get_current_developer
from models.domain import Application, DeveloperAccount, SubscriptionPlan, EndUser, LicenseKey, ActivityLog, TeamMember
from schemas.dashboard import KeyGenerate, BulkKeyGenerate
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
async def get_keys(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(LicenseKey).where(LicenseKey.app_id == app_id))
    return res.scalars().all()

@router.post("/generate")
async def generate_key(req: KeyGenerate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(req.app_id, dev.id, db)
    key_val = req.custom_key if req.custom_key else generate_key_string()
    
    # Check if key already exists
    existing = await db.execute(select(LicenseKey).where(LicenseKey.key_value == key_val))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This license key already exists")
    new_key = LicenseKey(
        app_id=req.app_id, key_value=key_val, key_type=req.key_type, 
        duration_days=req.duration_days, max_uses=req.max_uses, 
        note=req.note, seller_tag=req.seller_tag,
        expires_at=req.expires_at
    )
    db.add(new_key)
    await db.commit()
    
    await trigger_webhook(req.app_id, "key_generated", {
        "key": key_val,
        "type": req.key_type,
        "note": req.note,
        "timestamp": datetime.utcnow().isoformat()
    }, db)

    await db.refresh(new_key)
    return new_key

@router.post("/bulk-generate")
async def bulk_generate(req: BulkKeyGenerate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(req.app_id, dev.id, db)
    if req.count > 1000: raise HTTPException(400, "Max 1000 keys at once")
    keys = []
    for _ in range(req.count):
        k = LicenseKey(
            app_id=req.app_id, key_value=generate_key_string(), 
            key_type=req.key_type, duration_days=req.duration_days, 
            max_uses=req.max_uses, note=req.note, seller_tag=req.seller_tag,
            expires_at=req.expires_at
        )
        keys.append(k)
        db.add(k)
    await db.commit()

    await trigger_webhook(req.app_id, "key_generated", {
        "count": req.count,
        "type": req.key_type,
        "keys": [k.key_value for k in keys],
        "timestamp": datetime.utcnow().isoformat()
    }, db)

    return {"keys": [k.key_value for k in keys]}

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
        .values(hwid=None)
    )
    await db.commit()

    await trigger_webhook(key.app_id, "hwid_reset", {
        "license_key": key.key_value,
        "action": "bulk_reset_by_key",
        "timestamp": datetime.utcnow().isoformat()
    }, db)

    return {"status": "hwid_reset"}
