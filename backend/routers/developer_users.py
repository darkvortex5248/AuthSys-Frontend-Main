from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta, timezone
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import EndUser, DeveloperAccount, Session, utc_now
from routers.developer_keys import verify_app_owner
from schemas.dashboard import BanRequest, UserCreateManual, BulkUserCreate
from core.security import get_password_hash, validate_password
from services.plan_enforcer import require_feature, check_limit
from pydantic import BaseModel
from typing import Optional
from services.webhooks import trigger_webhook

router = APIRouter(prefix="/api/v1/developer/users", tags=["Users"])

@router.get("/{app_id}")
async def get_users(app_id: int, show_shadow: bool = False, skip: int = 0, limit: int = 50, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    await verify_app_owner(app_id, dev.id, db)
    query = select(EndUser).where(EndUser.app_id == app_id)
    if not show_shadow:
        query = query.where(EndUser.is_shadow == False)
    
    total_query = select(func.count(EndUser.id)).where(EndUser.app_id == app_id)
    if not show_shadow:
        total_query = total_query.where(EndUser.is_shadow == False)
    total = (await db.execute(total_query)).scalar_one()
    
    res = await db.execute(query.order_by(EndUser.created_at.desc()).offset(skip).limit(limit))
    users = res.scalars().all()
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@router.post("/create")
@db_transaction
async def create_user_manual(req: UserCreateManual, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app = await verify_app_owner(req.app_id, dev.id, db)
    plan = await require_feature(dev, "has_user_panel", db)
    # Check user limit
    user_count = await db.execute(select(EndUser).where(EndUser.app_id == req.app_id))
    current_users = len(user_count.scalars().all())
    await check_limit(dev, "max_users_per_app", current_users, db, plan)

    is_valid, msg = validate_password(req.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    username_normalized = req.username.strip().lower()
    # Check if username exists for this app (case-insensitive)
    res = await db.execute(select(EndUser).where(EndUser.app_id == req.app_id, EndUser.username == username_normalized))
    if res.scalars().first():
        raise HTTPException(400, "Username already exists for this application")
        
    hashed_password = get_password_hash(req.password)
    # Resolve expiry: explicit expires_at wins, otherwise derive from duration_days.
    expires_at = req.expires_at
    if expires_at is None and req.duration_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.duration_days)
    new_user = EndUser(
        app_id=req.app_id,
        username=username_normalized,
        password_hash=hashed_password,
        email=req.email,
        expires_at=expires_at,
        max_uses=req.max_uses if req.max_uses is not None else 1,
        max_devices=req.max_uses if req.max_uses is not None else 1
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/bulk-create")
@db_transaction
async def bulk_create_users(req: BulkUserCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app = await verify_app_owner(req.app_id, dev.id, db)
    plan = await require_feature(dev, "has_user_panel", db)
    if req.count > 1000: raise HTTPException(400, "Max 1000 users at once")
    
    # Check user limit
    user_count = await db.execute(select(EndUser).where(EndUser.app_id == req.app_id))
    current_users = len(user_count.scalars().all())
    await check_limit(dev, "max_users_per_app", current_users, db, plan)

    import secrets
    import string
    
    users = []
    
    if req.users_list:
        seen_usernames = set()
        for item in req.users_list:
            username = item.get('username', f"user_{secrets.token_hex(4)}")
            if username in seen_usernames:
                raise HTTPException(400, f"Duplicate username in batch: {username}")
            seen_usernames.add(username)
            password = item.get('password', 'Default123')
            email = item.get('email')
            is_valid, msg = validate_password(password)
            if not is_valid:
                raise HTTPException(400, f"Invalid password for user '{username}': {msg}")
            hashed_password = get_password_hash(password)
            new_user = EndUser(
                app_id=req.app_id,
                username=username,
                password_hash=hashed_password,
                email=email,
                expires_at=req.expires_at,
                max_uses=req.max_uses,
                max_devices=req.max_uses
            )
            users.append(new_user)
            db.add(new_user)
    else:
        for i in range(req.count):
            username = f"user_{secrets.token_hex(4)}"
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(16))
            # Ensure password meets requirements
            if not any(c.isupper() for c in password):
                password = 'A' + password[1:]
            if not any(c.islower() for c in password):
                password = password[:-1] + 'a'
            if not any(c.isdigit() for c in password):
                password = password[:-1] + '1'
            if req.password_prefix:
                password = req.password_prefix + password
            
            hashed_password = get_password_hash(password)
            new_user = EndUser(
                app_id=req.app_id,
                username=username,
                password_hash=hashed_password,
                expires_at=req.expires_at,
                max_uses=req.max_uses,
                max_devices=req.max_uses
            )
            users.append(new_user)
            db.add(new_user)
    
    await db.commit()
    for user in users:
        await db.refresh(user)
    
    await trigger_webhook(req.app_id, "users_created", {
        "count": req.count,
        "expires_at": req.expires_at.isoformat() if req.expires_at else None,
        "timestamp": utc_now().isoformat()
    }, db)
    
    return {
        "count": len(users), 
        "users": [{"username": u.username, "id": u.id} for u in users],
    }

@router.post("/{user_id}/ban")
@db_transaction
async def ban_user(user_id: int, req: BanRequest, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(EndUser).where(EndUser.id == user_id))
    user = res.scalars().first()
    if not user: raise HTTPException(404, "Not found")
    await verify_app_owner(user.app_id, dev.id, db)
    
    user.is_banned = True
    user.ban_reason = req.reason
    if req.days:
        user.ban_expires_at = utc_now() + timedelta(days=req.days)
    else:
        user.ban_expires_at = None
        
    await db.commit()
    
    await trigger_webhook(user.app_id, "user_banned", {
        "username": user.username,
        "reason": req.reason,
        "expires_at": user.ban_expires_at.isoformat() if user.ban_expires_at else None,
        "timestamp": utc_now().isoformat()
    }, db)

    return {"status": "banned"}

@router.post("/{user_id}/unban")
@db_transaction
async def unban_user(user_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(EndUser).where(EndUser.id == user_id))
    user = res.scalars().first()
    if not user: raise HTTPException(404, "Not found")
    await verify_app_owner(user.app_id, dev.id, db)
    
    user.is_banned = False
    user.ban_reason = None
    user.ban_expires_at = None
    await db.commit()
    return {"status": "unbanned"}

@router.post("/{user_id}/hwid-reset")
@db_transaction
async def hwid_reset(user_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(EndUser).where(EndUser.id == user_id))
    user = res.scalars().first()
    if not user: raise HTTPException(404, "Not found")
    await verify_app_owner(user.app_id, dev.id, db)

    if user.hwid_reset_count >= user.hwid_reset_allowed and user.hwid_reset_allowed >= 0:
        raise HTTPException(403, f"HWID reset limit reached ({user.hwid_reset_allowed}). Contact developer to increase limit.")
    
    user.hwid = None
    user.hwids = []
    user.hwid_reset_count += 1
    await db.commit()

    await trigger_webhook(user.app_id, "hwid_reset", {
        "username": user.username,
        "action": "individual_reset",
        "timestamp": utc_now().isoformat()
    }, db)

    return {"status": "hwid_reset"}

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

@router.put("/{user_id}")
@db_transaction
async def update_user(user_id: int, req: UserUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(EndUser).where(EndUser.id == user_id))
    user = res.scalars().first()
    if not user: raise HTTPException(404, "Not found")
    await verify_app_owner(user.app_id, dev.id, db)
    
    if req.username:
        # Check for duplicate username within the same app
        username_normalized = req.username.strip().lower()
        dup = await db.execute(select(EndUser).where(EndUser.app_id == user.app_id, EndUser.username == username_normalized, EndUser.id != user_id))
        if dup.scalars().first():
            raise HTTPException(400, "Username already exists in this application")
        user.username = username_normalized
    if req.email: user.email = req.email
    if req.password:
        is_valid, msg = validate_password(req.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)
        user.password_hash = get_password_hash(req.password)
    
    await db.commit()
    return user

@router.delete("/{user_id}")
@db_transaction
async def delete_user(user_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete as sa_delete
    try:
        res = await db.execute(select(EndUser).where(EndUser.id == user_id))
        user = res.scalars().first()
        if not user:
            raise HTTPException(404, "Not found")
        await verify_app_owner(user.app_id, dev.id, db)

        # Cascade delete sessions for this user
        await db.execute(sa_delete(Session).where(Session.user_id == user_id))
        await db.delete(user)
        await db.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}") from e
