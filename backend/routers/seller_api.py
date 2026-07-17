from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, delete
from typing import List, Optional
from pydantic import BaseModel
import secrets
import string
from datetime import datetime, timezone, timedelta

from core.database import get_db
from core.deps import get_current_developer
from core.security import get_password_hash
from models.domain import SellerAccount, LicenseKey, Application, DeveloperAccount, EndUser, Blacklist, Variable, WebhookEndpoint, Session, ChatRoom, IPWhitelistRule, SubscriptionPlan, ActivationCode
from services.plan_tiers import tier_from_plan_name
from services.plan_enforcer import get_plan


async def _verify_seller(seller_key: str, db: AsyncSession) -> SellerAccount:
    """Verify seller API key and return the seller account."""
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    return seller

router = APIRouter(prefix="/api/v1/developer/sellers", tags=["Seller API"])

class SellerResponse(BaseModel):
    id: int
    name: str
    api_key: str
    is_active: bool

class SellerCreate(BaseModel):
    name: str

@router.get("", response_model=List[SellerResponse])
async def get_sellers(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.developer_id == dev.id))
    return res.scalars().all()

@router.post("", response_model=SellerResponse)
async def create_seller(req: SellerCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    api_key = f"sk_{secrets.token_urlsafe(32)}"
    new_seller = SellerAccount(developer_id=dev.id, name=req.name, api_key=api_key)
    db.add(new_seller)
    await db.commit()
    await db.refresh(new_seller)
    return new_seller

@router.delete("/{seller_id}")
async def delete_seller(seller_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.id == seller_id, SellerAccount.developer_id == dev.id))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    await db.delete(seller)
    await db.commit()
    return {"status": "success", "message": "Seller deleted"}

# Public Endpoint for Sellers to use
@router.post("/generate-key")
async def seller_generate_key(app_id: int, duration: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
        
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized: You cannot generate keys for this application.")
        
    alphabet = string.ascii_uppercase + string.digits
    key_val = f"SELL-{''.join(secrets.choice(alphabet) for _ in range(16))}"
    
    new_key = LicenseKey(
        app_id=app_id, 
        key_value=key_val, 
        key_type="time", 
        duration_days=duration,
        seller_tag=seller.name
    )
    db.add(new_key)
    await db.commit()
    return {"status": "success", "key": key_val}

@router.post("/delete-key")
async def seller_delete_key(key_value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    key_res = await db.execute(
        select(LicenseKey).join(Application, LicenseKey.app_id == Application.id)
        .where(LicenseKey.key_value == key_value, Application.developer_id == seller.developer_id)
    )
    key = key_res.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="License key not found")
    await db.delete(key)
    await db.commit()
    return {"status": "success", "message": "License key deleted"}

@router.post("/key-info")
async def seller_key_info(key_value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    key_res = await db.execute(
        select(LicenseKey).join(Application, LicenseKey.app_id == Application.id)
        .where(LicenseKey.key_value == key_value, Application.developer_id == seller.developer_id)
    )
    key = key_res.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="License key not found")
    return {
        "status": "success",
        "key": key.key_value,
        "key_type": key.key_type,
        "duration": str(key.duration_days * 86400 * 1000000000) if key.duration_days else "0",
        "level": key.key_type or "default",
        "duration_days": key.duration_days,
        "is_paused": key.is_paused,
        "created_at": key.created_at.isoformat() if key.created_at else None,
        "creationdate": key.created_at.isoformat() if key.created_at else None,
        "expires_at": key.expires_at.isoformat() if key.expires_at else None,
        "seller_tag": key.seller_tag,
        "note": key.note or "",
        "createdby": key.seller_tag or "system",
        "usedby": key.used_by or "",
        "usedon": key.used_at.isoformat() if hasattr(key, 'used_at') and key.used_at else None,
    }

@router.post("/ban-key")
async def seller_ban_key(key_value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    key_res = await db.execute(
        select(LicenseKey).join(Application, LicenseKey.app_id == Application.id)
        .where(LicenseKey.key_value == key_value, Application.developer_id == seller.developer_id)
    )
    key = key_res.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="License key not found")
    key.is_paused = True
    await db.commit()
    return {"status": "success", "message": "License key banned"}

@router.post("/unban-key")
async def seller_unban_key(key_value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    key_res = await db.execute(
        select(LicenseKey).join(Application, LicenseKey.app_id == Application.id)
        .where(LicenseKey.key_value == key_value, Application.developer_id == seller.developer_id)
    )
    key = key_res.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="License key not found")
    key.is_paused = False
    await db.commit()
    return {"status": "success", "message": "License key unbanned"}

@router.post("/add-user")
async def seller_add_user(app_id: int, username: str, password: str, subscription: str, expiry: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized: You cannot manage users for this application")
    existing = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = get_password_hash(password)
    expires = datetime.now(timezone.utc) + timedelta(days=expiry)
    new_user = EndUser(
        app_id=app_id,
        username=username,
        password_hash=hashed_pw,
        subscription_expires_at=expires,
        variable_data={"subscription": subscription} if subscription else None
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"status": "success", "message": "User created", "user_id": new_user.id}

@router.post("/delete-user")
async def seller_delete_user(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"status": "success", "message": "User deleted"}

@router.post("/user-info")
async def seller_user_info(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason,
            "hwid": user.hwid,
            "hwid_reset_count": user.hwid_reset_count,
            "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "login_count": user.login_count
        }
    }

@router.post("/ban-user")
async def seller_ban_user(app_id: int, username: str, reason: str = "", seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = True
    user.ban_reason = reason or None
    await db.commit()
    return {"status": "success", "message": "User banned"}

@router.post("/unban-user")
async def seller_unban_user(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = False
    user.ban_reason = None
    await db.commit()
    return {"status": "success", "message": "User unbanned"}

@router.post("/reset-hwid")
async def seller_reset_hwid(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.hwid_reset_count >= user.hwid_reset_allowed:
        raise HTTPException(status_code=400, detail="HWID reset limit reached")
    user.hwid = None
    user.hwid_reset_count += 1
    await db.commit()
    return {"status": "success", "message": "HWID reset successfully"}

@router.post("/extend-user")
async def seller_extend_user(app_id: int, username: str, days: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.subscription_expires_at and user.subscription_expires_at > datetime.now(timezone.utc):
        user.subscription_expires_at += timedelta(days=days)
    else:
        user.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=days)
    await db.commit()
    return {"status": "success", "message": f"User subscription extended by {days} days"}

@router.post("/app-stats")
async def seller_app_stats(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_count = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id == app_id))
    key_count = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id))
    paused_keys = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id, LicenseKey.is_paused == True))
    used_keys = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id, LicenseKey.expires_at != None))
    unused_keys = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id, LicenseKey.expires_at == None))
    active_users = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id == app_id, EndUser.is_banned == False))
    banned_users = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id == app_id, EndUser.is_banned == True))
    var_count = await db.execute(select(func.count(Variable.id)).where(Variable.app_id == app_id))
    webhook_count = await db.execute(select(func.count(WebhookEndpoint.id)).where(WebhookEndpoint.app_id == app_id))
    return {
        "status": "success",
        "app_id": app_id,
        "app_name": app.name,
        "total_users": user_count.scalar(),
        "active_users": active_users.scalar(),
        "banned_users": banned_users.scalar(),
        "total_keys": key_count.scalar(),
        "unused": unused_keys.scalar() or 0,
        "used": used_keys.scalar() or 0,
        "paused": paused_keys.scalar() or 0,
        "banned": banned_users.scalar() or 0,
        "totalkeys": key_count.scalar() or 0,
        "webhooks": webhook_count.scalar() or 0,
        "files": 0,
        "vars": var_count.scalar() or 0,
        "resellers": 0,
        "managers": 0,
        "totalaccs": user_count.scalar() or 0,
    }

@router.post("/list-keys")
async def seller_list_keys(app_id: int, limit: int = 10, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    keys_res = await db.execute(
        select(LicenseKey).where(LicenseKey.app_id == app_id).order_by(LicenseKey.created_at.desc()).limit(limit)
    )
    keys = keys_res.scalars().all()
    return {
        "status": "success",
        "keys": [
            {
                "key_value": k.key_value,
                "key_type": k.key_type,
                "is_paused": k.is_paused,
                "duration_days": k.duration_days,
                "created_at": k.created_at.isoformat() if k.created_at else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None
            }
            for k in keys
        ]
    }

@router.post("/list-users")
async def seller_list_users(app_id: int, limit: int = 10, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=403, detail="Unauthorized")
    users_res = await db.execute(
        select(EndUser).where(EndUser.app_id == app_id).order_by(EndUser.created_at.desc()).limit(limit)
    )
    users = users_res.scalars().all()
    return {
        "status": "success",
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_banned": u.is_banned,
                "hwid": u.hwid,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }

# ── App Details ──
@router.post("/app-details")
async def seller_app_details(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return {
        "status": "success",
        "appdetails": {
            "name": app.name,
            "ownerid": app.owner_id or str(app.id),
            "secret": app.client_secret or "",
            "version": app.version or "1.0",
            "app_id": app.id,
        }
    }

# ── Blacklist ──
@router.post("/list-blacklists")
async def seller_list_blacklists(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(select(Blacklist).where(Blacklist.app_id == app_id))
    entries = res.scalars().all()
    return {
        "status": "success",
        "blacklists": [
            {"id": b.id, "type": b.type, "value": b.value, "reason": b.reason, "created_at": b.created_at.isoformat() if b.created_at else None}
            for b in entries
        ]
    }

@router.post("/add-blacklist")
async def seller_add_blacklist(app_id: int, value: str, type: str = "hwid", reason: str = "", seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    b = Blacklist(app_id=app_id, type=type, value=value, reason=reason)
    db.add(b)
    await db.commit()
    return {"status": "success", "message": "Blacklist entry added"}

@router.post("/delete-blacklist")
async def seller_delete_blacklist(id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(Blacklist).where(Blacklist.id == id))
    b = res.scalars().first()
    if not b:
        raise HTTPException(status_code=404, detail="Blacklist entry not found")
    app_res = await db.execute(select(Application).where(Application.id == b.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(b)
    await db.commit()
    return {"status": "success", "message": "Blacklist entry deleted"}

@router.post("/delete-all-blacklists")
async def seller_delete_all_blacklists(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.execute(delete(Blacklist).where(Blacklist.app_id == app_id))
    await db.commit()
    return {"status": "success", "message": "All blacklist entries deleted"}

# ── Variables ──
@router.post("/list-variables")
async def seller_list_variables(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(select(Variable).where(Variable.app_id == app_id))
    vars = res.scalars().all()
    return {
        "status": "success",
        "variables": [
            {"id": v.id, "key_name": v.key_name, "key_value": v.key_value, "is_global": v.is_global, "created_at": v.created_at.isoformat() if v.created_at else None}
            for v in vars
        ]
    }

@router.post("/add-variable")
async def seller_add_variable(app_id: int, key_name: str, key_value: str = "", is_global: bool = False, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    existing = await db.execute(select(Variable).where(Variable.app_id == app_id, Variable.key_name == key_name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Variable with this name already exists")
    v = Variable(app_id=app_id, key_name=key_name, key_value=key_value, is_global=is_global)
    db.add(v)
    await db.commit()
    return {"status": "success", "message": "Variable created"}

@router.post("/delete-variable")
async def seller_delete_variable(id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(Variable).where(Variable.id == id))
    v = res.scalars().first()
    if not v:
        raise HTTPException(status_code=404, detail="Variable not found")
    app_res = await db.execute(select(Application).where(Application.id == v.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(v)
    await db.commit()
    return {"status": "success", "message": "Variable deleted"}

@router.post("/delete-all-variables")
async def seller_delete_all_variables(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.execute(delete(Variable).where(Variable.app_id == app_id))
    await db.commit()
    return {"status": "success", "message": "All variables deleted"}

# ── Webhooks ──
@router.post("/add-webhook")
async def seller_add_webhook(app_id: int, url: str, description: str = "", seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    hook = WebhookEndpoint(app_id=app_id, url=url, description=description, is_active=True)
    db.add(hook)
    await db.commit()
    await db.refresh(hook)
    return {"status": "success", "message": "Webhook created", "id": hook.id}

@router.post("/list-webhooks")
async def seller_list_webhooks(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.app_id == app_id))
    hooks = res.scalars().all()
    return {
        "status": "success",
        "webhooks": [
            {"id": h.id, "url": h.url, "description": h.description, "is_active": h.is_active, "events": h.events, "created_at": h.created_at.isoformat() if h.created_at else None}
            for h in hooks
        ]
    }

@router.post("/delete-webhook")
async def seller_delete_webhook(id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == id))
    h = res.scalars().first()
    if not h:
        raise HTTPException(status_code=404, detail="Webhook not found")
    app_res = await db.execute(select(Application).where(Application.id == h.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(h)
    await db.commit()
    return {"status": "success", "message": "Webhook deleted"}

@router.post("/delete-all-webhooks")
async def seller_delete_all_webhooks(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.execute(delete(WebhookEndpoint).where(WebhookEndpoint.app_id == app_id))
    await db.commit()
    return {"status": "success", "message": "All webhooks deleted"}

# ── Sessions ──
@router.post("/list-sessions")
async def seller_list_sessions(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(
        select(Session).join(EndUser, Session.user_id == EndUser.id)
        .where(Session.app_id == app_id)
        .order_by(Session.created_at.desc())
    )
    sessions = res.scalars().all()
    return {
        "status": "success",
        "sessions": [
            {
                "id": s.id,
                "credential": s.token_hash[:16] if s.token_hash else "",
                "ip": s.ip_address or "",
                "hwid": s.hwid or "",
                "expiry": int(s.expires_at.timestamp()) if s.expires_at else 0,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ]
    }

@router.post("/kill-session")
async def seller_kill_session(session_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(Session).where(Session.id == session_id))
    s = res.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    app_res = await db.execute(select(Application).where(Application.id == s.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(s)
    await db.commit()
    return {"status": "success", "message": "Session killed"}

@router.post("/kill-all-sessions")
async def seller_kill_all_sessions(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.execute(delete(Session).where(Session.app_id == app_id))
    await db.commit()
    return {"status": "success", "message": "All sessions killed"}

# ── Chat Channels ──
@router.post("/list-chats")
async def seller_list_chats(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(select(ChatRoom).where(ChatRoom.app_id == app_id))
    rooms = res.scalars().all()
    return {
        "status": "success",
        "chats": [{"id": r.id, "name": r.name, "is_active": r.is_active} for r in rooms]
    }

@router.post("/add-channel")
async def seller_add_channel(app_id: int, name: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    room = ChatRoom(app_id=app_id, name=name)
    db.add(room)
    await db.commit()
    return {"status": "success", "message": "Channel created", "id": room.id}

@router.post("/delete-channel")
async def seller_delete_channel(room_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    r = res.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail="Channel not found")
    app_res = await db.execute(select(Application).where(Application.id == r.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(r)
    await db.commit()
    return {"status": "success", "message": "Channel deleted"}

# ── IP Whitelist ──
@router.post("/list-whitelists")
async def seller_list_whitelists(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    res = await db.execute(select(IPWhitelistRule).where(IPWhitelistRule.app_id == app_id))
    rules = res.scalars().all()
    return {
        "status": "success",
        "whitelists": [{"id": r.id, "type": r.rule_type, "value": r.value, "is_blocklist": r.is_blocklist, "note": r.note} for r in rules]
    }

@router.post("/add-whitelist")
async def seller_add_whitelist(app_id: int, value: str, rule_type: str = "ip", note: str = "", seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    rule = IPWhitelistRule(app_id=app_id, rule_type=rule_type, value=value, note=note or None)
    db.add(rule)
    await db.commit()
    return {"status": "success", "message": "Whitelist rule added"}

@router.post("/delete-whitelist")
async def seller_delete_whitelist(id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(IPWhitelistRule).where(IPWhitelistRule.id == id))
    r = res.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")
    app_res = await db.execute(select(Application).where(Application.id == r.app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.delete(r)
    await db.commit()
    return {"status": "success", "message": "Whitelist rule deleted"}

# ── User Management Extras ──
@router.post("/user-data")
async def seller_user_data(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "success",
        "userdata": {
            "username": user.username,
            "email": user.email or "",
            "hwid": user.hwid or "",
            "ip": user.ip_address or "",
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason or "",
            "subscription_expires": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
            "login_count": user.login_count,
            "last_login": user.last_login_at.isoformat() if user.last_login_at else None,
            "variable_data": user.variable_data or {},
        }
    }

@router.post("/edit-username")
async def seller_edit_username(app_id: int, username: str, new_username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == new_username))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user.username = new_username
    await db.commit()
    return {"status": "success", "message": "Username updated"}

@router.post("/edit-email")
async def seller_edit_email(app_id: int, username: str, email: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email = email
    await db.commit()
    return {"status": "success", "message": "Email updated"}

@router.post("/reset-password")
async def seller_reset_password(app_id: int, username: str, new_password: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(new_password)
    await db.commit()
    return {"status": "success", "message": "Password updated"}

@router.post("/pause-user")
async def seller_pause_user(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = True
    user.ban_reason = "Paused by seller"
    await db.commit()
    return {"status": "success", "message": "User paused"}

@router.post("/unpause-user")
async def seller_unpause_user(app_id: int, username: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = False
    user.ban_reason = None
    await db.commit()
    return {"status": "success", "message": "User unpaused"}

@router.post("/subtract")
async def seller_subtract(app_id: int, username: str, days: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.subscription_expires_at:
        user.subscription_expires_at -= timedelta(days=days)
        if user.subscription_expires_at < datetime.now(timezone.utc):
            user.subscription_expires_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "success", "message": f"Subscription reduced by {days} days"}

@router.post("/delete-all-users")
async def seller_delete_all_users(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.execute(delete(EndUser).where(EndUser.app_id == app_id))
    await db.execute(delete(Session).where(Session.app_id == app_id))
    await db.commit()
    return {"status": "success", "message": "All users deleted"}

@router.post("/delete-expired-users")
async def seller_delete_expired_users(app_id: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    await db.execute(delete(EndUser).where(EndUser.app_id == app_id, EndUser.subscription_expires_at != None, EndUser.subscription_expires_at < now))
    await db.commit()
    return {"status": "success", "message": "Expired users deleted"}

@router.post("/set-user-variable")
async def seller_set_user_variable(app_id: int, username: str, key: str, value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.variable_data:
        user.variable_data = {}
    user.variable_data[key] = value
    await db.commit()
    return {"status": "success", "message": "User variable set"}

@router.post("/delete-user-variable")
async def seller_delete_user_variable(app_id: int, username: str, key: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == seller.developer_id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.variable_data and key in user.variable_data:
        del user.variable_data[key]
        await db.commit()
    return {"status": "success", "message": "User variable deleted"}

@router.post("/verify-key")
async def seller_verify_key(key_value: str, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    key_res = await db.execute(
        select(LicenseKey).join(Application, LicenseKey.app_id == Application.id)
        .where(LicenseKey.key_value == key_value, Application.developer_id == seller.developer_id)
    )
    key = key_res.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="License key not found")
    if key.is_paused:
        return {"status": "error", "detail": "License key is paused"}
    return {"status": "success", "key": key.key_value, "valid": True}

# ── Seller Key Validation (no app_id required) ──
@router.post("/verify-seller-key")
@router.post("/verify-seller")
async def seller_verify_key_only(seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == seller.developer_id))
    dev = dev_res.scalars().first()
    return {
        "status": "success",
        "seller": seller.name,
        "developer": dev.username if dev else None,
        "created_at": seller.created_at.isoformat() if seller.created_at else None,
    }


async def _seller_dev(seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    seller = await _verify_seller(seller_key, db)
    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == seller.developer_id))
    dev = res.scalars().first()
    if not dev:
        raise HTTPException(404, "Developer not found")
    return dev


@router.post("/subscription-plan")
async def seller_subscription_plan(
    dev: DeveloperAccount = Depends(_seller_dev),
    db: AsyncSession = Depends(get_db),
):
    plan = await get_plan(dev, db)
    if not plan:
        return {"plan": None, "tier": dev.subscription_tier or "tester", "limits": {}}
    return {
        "status": "success",
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


@router.post("/subscription-redeem")
async def seller_subscription_redeem(
    code: str = "",
    dev: DeveloperAccount = Depends(_seller_dev),
    db: AsyncSession = Depends(get_db),
):
    code_str = code.strip()
    if not code_str:
        raise HTTPException(400, "Code is required")

    res = await db.execute(select(ActivationCode).where(ActivationCode.code == code_str))
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

    plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == activation.plan_id))
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


@router.post("/subscription-codes")
async def seller_subscription_codes(
    dev: DeveloperAccount = Depends(_seller_dev),
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
        "status": "success",
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
