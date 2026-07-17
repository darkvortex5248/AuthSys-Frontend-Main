from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from models.domain import Application, EndUser, DeveloperAccount, SubscriptionPlan
from services.plan_enforcer import check_limit

router = APIRouter(prefix="/device", tags=["Device Activation"])

async def get_app_by_secret(app_secret: str, db: AsyncSession) -> Application:
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
        raise HTTPException(status_code=403, detail="Application is suspended or inactive")
    if app.developer_lock:
        raise HTTPException(status_code=403, detail="Application is under lockdown")
    if app.maintenance_mode:
        raise HTTPException(status_code=503, detail="Application is under maintenance")
    return app

@router.post("/register")
async def register_device(data: dict, db: AsyncSession = Depends(get_db)):
    app_secret = (data.get("app_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    device_name = (data.get("device_name") or "").strip()
    if not app_secret or not hwid:
        raise HTTPException(400, "app_secret and hwid are required")
    app = await get_app_by_secret(app_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(EndUser).where(
            EndUser.app_id == app.id,
            EndUser.hwid == hwid,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()

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
            device_name=device_name or None,
            is_shadow=True,
            is_device_only=True,
            is_banned=False,
            last_login_at=now,
        )
        db.add(device)

    await db.commit()
    return {"active": not device.is_banned, "device_id": device.id}

@router.post("/check")
async def check_device(data: dict, db: AsyncSession = Depends(get_db)):
    app_secret = (data.get("app_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    if not app_secret or not hwid:
        raise HTTPException(400, "app_secret and hwid are required")
    app = await get_app_by_secret(app_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(EndUser).where(
            EndUser.app_id == app.id,
            EndUser.hwid == hwid,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()

    if not device:
        device = EndUser(
            app_id=app.id,
            username=f"device_{hwid[:16]}",
            password_hash="device_only_auth",
            hwid=hwid,
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
