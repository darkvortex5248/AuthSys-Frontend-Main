from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone, timedelta
import uuid
import hashlib

from core.database import get_db
from models.domain import Application, EndUser, LicenseKey, Session, Variable, ActivityLog, Blacklist, ChatRoom, ChatMessage, DeveloperAccount, SubscriptionPlan, utc_now
from services.webhooks import trigger_webhook
from services.plan_enforcer import check_limit
from sqlalchemy import func
from schemas.client import (
    ClientInitRequest, ClientInitResponse, ClientRegisterRequest, 
    ClientLoginRequest, ClientLicenseCheckRequest, ClientLicenseLoginRequest
)
from core.security import verify_password, get_password_hash
from core.limiter import limiter

router = APIRouter(prefix="/api/v1/client", tags=["Client SDK"])

async def get_app_by_secret(app_secret: str, db: AsyncSession) -> Application:
    """Resolve app by secret key (also accepts owner_id if SDK credentials were swapped)."""
    secret = (app_secret or "").strip()
    result = await db.execute(
        select(Application).where(
            (Application.app_secret == secret) | (Application.owner_id == secret)
        )
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or invalid secret")
    if app.status != "active":
        raise HTTPException(status_code=403, detail="Application is currently suspended or inactive")
    if app.developer_lock:
        raise HTTPException(status_code=403, detail="Application is under emergency lockdown by the developer")
    if app.maintenance_mode:
        raise HTTPException(status_code=503, detail="Application is currently under maintenance. Please try again later.")
    return app

async def check_blacklist(app_id: int, ip: str, hwid: str, db: AsyncSession):
    res = await db.execute(
        select(Blacklist).where(
            Blacklist.app_id == app_id,
            (Blacklist.type == "ip") & (Blacklist.value == ip) |
            (Blacklist.type == "hwid") & (Blacklist.value == hwid)
        )
    )
    if res.scalars().first():
        raise HTTPException(status_code=403, detail="You are blacklisted from this application")

@router.post("/init", response_model=ClientInitResponse)
async def init_client(req: ClientInitRequest, db: AsyncSession = Depends(get_db)):
    app = await get_app_by_secret(req.app_secret, db)
    
    if req.version < app.min_version:
        status_msg = "update_required"
        message = f"Please update to at least version {app.min_version}"
    elif req.version != app.version:
        status_msg = "update_available"
        message = "A new version is available"
    else:
        status_msg = "success"
        message = "App initialized successfully"

    var_result = await db.execute(select(Variable).where(Variable.app_id == app.id, Variable.is_global == True))
    variables = {v.key_name: v.key_value for v in var_result.scalars().all()}

    return ClientInitResponse(
        status=status_msg,
        current_version=app.version,
        message=message,
        variables=variables
    )

@router.post("/register")
@limiter.limit("5/minute")
async def register_user(request: Request, req: ClientRegisterRequest, db: AsyncSession = Depends(get_db)):
    app = await get_app_by_secret(req.app_secret, db)
    client_ip = request.client.host if request.client else "N/A"
    
    await check_blacklist(app.id, client_ip, req.hwid, db)

    if len(req.password) < 1:
        raise HTTPException(400, "Password must be at least 1 character long")

    username_normalized = req.username.strip().lower()
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app.id, EndUser.username == username_normalized))
    if user_res.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check plan user limit
    dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == app.developer_id))
    dev = dev_res.scalars().first()
    if dev and dev.plan_id:
        plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == dev.plan_id))
        plan = plan_res.scalars().first()
        if plan:
            user_count = await db.execute(select(EndUser).where(EndUser.app_id == app.id))
            current_users = len(user_count.scalars().all())
            if current_users >= plan.max_users_per_app:
                raise HTTPException(status_code=403, detail="Application has reached its maximum user limit. Contact the developer.")
    
    key_res = await db.execute(select(LicenseKey).where(LicenseKey.app_id == app.id, LicenseKey.key_value == req.license_key))
    license_key = key_res.scalars().first()
    if not license_key:
        raise HTTPException(status_code=400, detail="Invalid license key")
    
    if license_key.is_paused:
        raise HTTPException(status_code=400, detail="License key is paused")
    
    if license_key.key_type == "uses_based" and license_key.current_uses >= license_key.max_uses:
        raise HTTPException(status_code=400, detail="License key uses exhausted")
    elif license_key.key_type == "time" and license_key.expires_at and license_key.expires_at < utc_now():
        raise HTTPException(status_code=400, detail="License key expired")

    # Check if license key is already used (unless it's uses_based)
    if license_key.key_type != "uses_based":
        user_with_key = await db.execute(select(EndUser).where(EndUser.license_key_id == license_key.id))
        if user_with_key.scalars().first():
            raise HTTPException(status_code=400, detail="License key already used")

    sub_expires_at = None
    if license_key.key_type == "time":
        if license_key.expires_at:
            sub_expires_at = license_key.expires_at
        elif license_key.duration_days:
            sub_expires_at = utc_now() + timedelta(days=license_key.duration_days)
    elif license_key.key_type == "lifetime":
        sub_expires_at = utc_now() + timedelta(days=36500)

    client_ip = request.client.host if request.client else "N/A"

    new_user = EndUser(
        app_id=app.id,
        username=req.username.strip().lower(),
        password_hash=get_password_hash(req.password),
        email=req.email,
        license_key_id=license_key.id,
        hwid=req.hwid,
        hwids=[req.hwid] if req.hwid else [],
        subscription_expires_at=sub_expires_at,
        last_ip=client_ip,
        max_uses=license_key.max_uses if license_key.max_uses is not None else 1,
        max_devices=license_key.max_devices if license_key.max_devices is not None else 1
    )
    
    # Mark key as used
    if license_key.key_type == "uses_based":
        license_key.current_uses += 1
    
    db.add(new_user)
    db.add(ActivityLog(app_id=app.id, action_type="register", hwid=req.hwid, ip_address=client_ip, is_suspicious=False))
    await db.commit()

    # Trigger Webhook
    await trigger_webhook(app.id, "register", {
        "username": req.username,
        "email": req.email,
        "hwid": req.hwid,
        "ip": client_ip,
        "timestamp": utc_now().isoformat()
    }, db)
    
    return {"success": True, "message": "User registered successfully", "expires_at": sub_expires_at}

@router.post("/login")
@limiter.limit("10/minute")
async def login_user(request: Request, req: ClientLoginRequest, db: AsyncSession = Depends(get_db)):
    app = await get_app_by_secret(req.app_secret, db)
    client_ip = request.client.host if request.client else "N/A"
    
    await check_blacklist(app.id, client_ip, req.hwid, db)
    
    user_res = await db.execute(select(EndUser).where(EndUser.app_id == app.id, EndUser.username == req.username.strip().lower()))
    user = user_res.scalars().first()
    
    if not user or not verify_password(req.password, user.password_hash):
        db.add(ActivityLog(app_id=app.id, action_type="failed_login", hwid=req.hwid, ip_address=client_ip, is_suspicious=True, risk_score=10))
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if user.is_banned:
        raise HTTPException(status_code=403, detail=f"You are banned. Reason: {user.ban_reason}")
        
    if user.subscription_expires_at and user.subscription_expires_at < utc_now():
        raise HTTPException(status_code=403, detail="Subscription expired")

    if app.hwid_enabled:
        user_hwids = user.hwids or []
        if req.hwid in user_hwids:
            pass
        elif len(user_hwids) < user.max_devices:
            user_hwids.append(req.hwid)
            user.hwids = user_hwids
            user.hwid = req.hwid
        else:
            raise HTTPException(status_code=403, detail=f"Max devices ({user.max_devices}) reached. Please reset your HWID.")

    if req.hwid and user.max_uses >= 0:
        active_hwids = await db.execute(
            select(Session.hwid).where(
                Session.user_id == user.id,
                Session.expires_at > utc_now(),
                Session.hwid.isnot(None),
                Session.hwid != '',
            ).distinct()
        )
        unique_hwids = set(ahw for ahw in active_hwids.scalars().all() if ahw)
        if req.hwid not in unique_hwids and len(unique_hwids) >= user.max_uses:
            raise HTTPException(status_code=403, detail=f"Max devices ({user.max_uses}) reached")

    session_token = str(uuid.uuid4())
    token_hash = hashlib.sha256(session_token.encode()).hexdigest()
    expires = utc_now() + timedelta(seconds=req.session_length)
    
    new_session = Session(
        user_id=user.id,
        app_id=app.id,
        token_hash=token_hash,
        ip_address=client_ip,
        hwid=req.hwid,
        user_agent=request.headers.get("user-agent", "N/A"),
        expires_at=expires
    )
    
    user.login_count += 1
    user.last_login_at = utc_now()
    user.last_ip = client_ip
    
    db.add(new_session)
    db.add(ActivityLog(app_id=app.id, user_id=user.id, action_type="login", hwid=req.hwid, ip_address=client_ip))
    await db.commit()

    # Trigger Webhook
    await trigger_webhook(app.id, "login", {
        "username": user.username,
        "hwid": req.hwid,
        "ip": client_ip,
        "timestamp": utc_now().isoformat()
    }, db)
    
    return {
        "success": True,
        "token": session_token,
        "username": user.username,
        "expires_at": user.subscription_expires_at,
        "rank": "user",
        "variables": user.variable_data or {}
    }
    
@router.post("/license-login")
@limiter.limit("10/minute")
async def license_login(request: Request, req: ClientLicenseLoginRequest, db: AsyncSession = Depends(get_db)):
    app = await get_app_by_secret(req.app_secret, db)
    client_ip = request.client.host if request.client else "N/A"
    
    await check_blacklist(app.id, client_ip, req.hwid, db)
    
    key_res = await db.execute(select(LicenseKey).where(LicenseKey.app_id == app.id, LicenseKey.key_value == req.license_key))
    license_key = key_res.scalars().first()
    
    if not license_key:
        raise HTTPException(status_code=400, detail="Invalid license key")
        
    if license_key.is_paused:
        raise HTTPException(status_code=400, detail="License key is paused")
        
    if license_key.key_type == "uses_based" and license_key.current_uses >= license_key.max_uses:
        raise HTTPException(status_code=400, detail="License key uses exhausted")
    elif license_key.key_type == "time" and license_key.expires_at and license_key.expires_at < utc_now():
        raise HTTPException(status_code=400, detail="License key expired")

    # Check if a user is already linked to this key
    user_res = await db.execute(select(EndUser).where(EndUser.license_key_id == license_key.id))
    user = user_res.scalars().first()
    
    if not user:
        # Auto-create a shadow user for this license key to track sessions and HWID.
        # This is required for 'Key Only' authentication flows.
        device_limit = license_key.max_uses if license_key.max_uses is not None else -1
        max_devices = license_key.max_devices if license_key.max_devices is not None else 1
        sub_expires_at = None
        if license_key.key_type == "time":
            sub_expires_at = license_key.expires_at or (utc_now() + timedelta(days=license_key.duration_days)) if license_key.duration_days else license_key.expires_at
        elif license_key.key_type == "lifetime":
            sub_expires_at = utc_now() + timedelta(days=36500)
        user = EndUser(
            app_id=app.id,
            username=license_key.key_value, 
            password_hash="license_only_login",
            license_key_id=license_key.id,
            hwid=req.hwid,
            hwids=[req.hwid] if req.hwid else [],
            max_uses=device_limit,
            max_devices=max_devices,
            subscription_expires_at=sub_expires_at,
            last_ip=client_ip,
            is_shadow=True
        )
        db.add(user)
        await db.flush()
    else:
        # HWID Check for existing user
        if app.hwid_enabled:
            user_hwids = user.hwids or []
            if req.hwid in user_hwids:
                pass
            elif len(user_hwids) < user.max_devices:
                user_hwids.append(req.hwid)
                user.hwids = user_hwids
                user.hwid = req.hwid
            else:
                raise HTTPException(status_code=403, detail=f"Max devices ({user.max_devices}) reached. Please reset your HWID.")

    if req.hwid and user.max_uses >= 0:
        active_hwids = await db.execute(
            select(Session.hwid).where(
                Session.user_id == user.id,
                Session.expires_at > utc_now(),
                Session.hwid.isnot(None),
                Session.hwid != '',
            ).distinct()
        )
        unique_hwids = set(ahw for ahw in active_hwids.scalars().all() if ahw)
        if req.hwid not in unique_hwids and len(unique_hwids) >= user.max_uses:
            raise HTTPException(status_code=403, detail=f"Max devices ({user.max_uses}) reached")

    session_token = str(uuid.uuid4())
    token_hash = hashlib.sha256(session_token.encode()).hexdigest()
    expires = utc_now() + timedelta(seconds=req.session_length)
    
    new_session = Session(
        user_id=user.id,
        app_id=app.id,
        token_hash=token_hash,
        ip_address=client_ip,
        hwid=req.hwid,
        user_agent=request.headers.get("user-agent", "N/A"),
        expires_at=expires
    )
    
    user.login_count += 1
    user.last_login_at = utc_now()
    user.last_ip = client_ip
    
    db.add(new_session)
    db.add(ActivityLog(app_id=app.id, user_id=user.id, action_type="license_login", hwid=req.hwid, ip_address=client_ip))
    await db.commit()

    return {
        "success": True,
        "token": session_token,
        "username": user.username,
        "expires_at": user.subscription_expires_at,
        "variables": user.variable_data or {}
    }

@router.post("/license/check")
async def check_license(req: ClientLicenseCheckRequest, db: AsyncSession = Depends(get_db)):
    app = await get_app_by_secret(req.app_secret, db)
    key_res = await db.execute(select(LicenseKey).where(LicenseKey.app_id == app.id, LicenseKey.key_value == req.license_key))
    license_key = key_res.scalars().first()
    
    if not license_key or license_key.is_paused:
        return {"valid": False, "message": "Invalid or paused key"}
        
    if license_key.key_type == "uses_based" and license_key.current_uses >= license_key.max_uses:
        return {"valid": False, "message": "Key fully used"}
        
    return {
        "valid": True,
        "duration_days": license_key.duration_days,
        "key_type": license_key.key_type
    }

@router.post("/verify")
async def verify_session(
    request: Request,
    authorization: str = Header(...), 
    x_hwid: Optional[str] = Header(None, alias="X-HWID"),
    db: AsyncSession = Depends(get_db)
):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except:
        raise HTTPException(status_code=401, detail="Invalid auth header format")
        
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    result = await db.execute(
        select(Session, EndUser, Application)
        .join(EndUser, Session.user_id == EndUser.id)
        .join(Application, Session.app_id == Application.id)
        .where(Session.token_hash == token_hash, Session.expires_at > utc_now())
    )
    res_data = result.first()
    
    if not res_data:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
        
    session, user, app = res_data
    
    # HWID Check
    if app.hwid_enabled:
        user_hwids = user.hwids or []
        if not x_hwid or x_hwid not in user_hwids:
            raise HTTPException(status_code=403, detail="HWID mismatch for this session")
    
    return {
        "valid": True, 
        "username": user.username, 
        "expires_at": session.expires_at,
        "variables": user.variable_data or {}
    }

@router.post("/chat/send")
async def send_chat_message(
    room_id: int, 
    message: str,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    # Reuse session verification logic
    session_data = await verify_session(None, authorization, None, db)
    username = session_data["username"]
    
    # Get User ID
    user_res = await db.execute(select(EndUser).where(EndUser.username == username))
    user = user_res.scalars().first()
    
    new_msg = ChatMessage(room_id=room_id, user_id=user.id, message=message)
    db.add(new_msg)
    await db.commit()
    return {"status": "sent"}


@router.post("/device/register")
async def register_device(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    app_secret = (data.get("app_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    device_name = (data.get("device_name") or "").strip()
    if not app_secret or not hwid:
        raise HTTPException(400, "app_secret and hwid are required")
    app = await get_app_by_secret(app_secret, db)
    if not app:
        raise HTTPException(400, "Invalid app_secret")

    res = await db.execute(
        select(EndUser).where(
            EndUser.app_id == app.id,
            EndUser.hwid == hwid,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()
    now = datetime.now(timezone.utc)

    if device:
        device.last_login_at = now
        if device_name and not device.device_name:
            device.device_name = device_name
    else:
        dev_res = await db.execute(
            select(DeveloperAccount).where(DeveloperAccount.id == app.developer_id)
        )
        owner_dev = dev_res.scalars().first()
        if owner_dev:
            current_count = (
                await db.execute(
                    select(func.count(EndUser.id)).where(
                        EndUser.app_id == app.id,
                        EndUser.is_device_only == True,
                    )
                )
            ).scalar() or 0
            await check_limit(owner_dev, "max_devices", current_count, db)

        device = EndUser(
            app_id=app.id,
            username=f"device_{hwid[:16]}",
            password_hash="device_only_auth",
            hwid=hwid,
            hwids=[hwid] if hwid else [],
            device_name=device_name or None,
            is_shadow=True,
            is_device_only=True,
            is_banned=False,
            last_login_at=now,
        )
        db.add(device)

    await db.commit()
    return {"active": not device.is_banned, "device_id": device.id}


@router.post("/device/check")
async def check_device(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    app_secret = (data.get("app_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    if not app_secret or not hwid:
        raise HTTPException(400, "app_secret and hwid are required")
    app = await get_app_by_secret(app_secret, db)
    if not app:
        raise HTTPException(400, "Invalid app_secret")

    res = await db.execute(
        select(EndUser).where(
            EndUser.app_id == app.id,
            EndUser.hwid == hwid,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()
    now = datetime.now(timezone.utc)

    if not device:
        device = EndUser(
            app_id=app.id,
            username=f"device_{hwid[:16]}",
            password_hash="device_only_auth",
            hwid=hwid,
            hwids=[hwid] if hwid else [],
            is_shadow=True,
            is_device_only=True,
            is_banned=False,
            last_login_at=now,
        )
        db.add(device)
        await db.commit()
        return {"active": True, "message": "Device registered and active"}

    device.last_login_at = now
    await db.commit()

    if not device.is_banned:
        return {"active": True, "message": "Device active"}
    else:
        return {"active": False, "message": device.ban_reason or "Device deactivated by admin"}
