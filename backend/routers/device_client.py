from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from models.domain import DeviceApp, Device

router = APIRouter(prefix="/device", tags=["Device Activation"])


async def get_device_app_by_secret(device_secret: str, db: AsyncSession) -> DeviceApp:
    key = (device_secret or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="device_secret is required")
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.device_secret == key)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid device secret")
    if not app.is_active:
        raise HTTPException(status_code=403, detail="Device app is disabled")
    return app


@router.post("/register")
async def register_device(data: dict, db: AsyncSession = Depends(get_db)):
    device_secret = (data.get("device_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    device_name = (data.get("device_name") or "").strip()
    if not device_secret or not hwid:
        raise HTTPException(400, "device_secret and hwid are required")
    app = await get_device_app_by_secret(device_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(Device).where(
            Device.device_app_id == app.id,
            Device.hwid == hwid,
        )
    )
    device = res.scalars().first()

    if device:
        device.last_checkin_at = now
        if device_name and not device.device_name:
            device.device_name = device_name
    else:
        current_count = (
            await db.execute(
                select(func.count(Device.id)).where(Device.device_app_id == app.id)
            )
        ).scalar() or 0
        if current_count >= app.max_devices:
            raise HTTPException(403, f"Device limit reached ({app.max_devices}). Contact developer.")

        device = Device(
            device_app_id=app.id,
            hwid=hwid,
            device_name=device_name or None,
            status="active",
            last_checkin_at=now,
        )
        db.add(device)

    await db.commit()
    active = device.status == "active" or device.status == "whitelisted"
    return {"active": active, "device_id": device.id}


@router.post("/check")
async def check_device(data: dict, db: AsyncSession = Depends(get_db)):
    device_secret = (data.get("device_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    if not device_secret or not hwid:
        raise HTTPException(400, "device_secret and hwid are required")
    app = await get_device_app_by_secret(device_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(Device).where(
            Device.device_app_id == app.id,
            Device.hwid == hwid,
        )
    )
    device = res.scalars().first()

    if not device:
        current_count = (
            await db.execute(
                select(func.count(Device.id)).where(Device.device_app_id == app.id)
            )
        ).scalar() or 0
        if current_count >= app.max_devices:
            raise HTTPException(403, f"Device limit reached ({app.max_devices}). Contact developer.")

        device = Device(
            device_app_id=app.id,
            hwid=hwid,
            status="active",
            last_checkin_at=now,
        )
        db.add(device)
        await db.commit()
        return {"active": True, "message": "Device registered and active"}

    device.last_checkin_at = now
    await db.commit()

    if device.status == "active" or device.status == "whitelisted":
        return {"active": True, "message": "Device active"}
    elif device.status == "paused":
        return {"active": False, "message": "Device is paused"}
    elif device.status == "perma_banned":
        return {"active": False, "message": "Device is permanently banned"}
    else:
        return {"active": False, "message": device.ban_reason or "Device deactivated by admin"}
