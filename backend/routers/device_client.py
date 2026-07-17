from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from models.domain import EndUser, DeveloperAccount, SubscriptionPlan
from services.plan_enforcer import check_limit

router = APIRouter(prefix="/device", tags=["Device Activation"])


async def get_dev_by_device_key(device_key: str, db: AsyncSession) -> DeveloperAccount:
    key = (device_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="device_key is required")
    res = await db.execute(
        select(DeveloperAccount).where(DeveloperAccount.device_api_key == key)
    )
    dev = res.scalars().first()
    if not dev:
        raise HTTPException(status_code=404, detail="Invalid device key")
    if dev.is_banned:
        raise HTTPException(status_code=403, detail="Developer account is banned")
    return dev


@router.post("/register")
async def register_device(data: dict, db: AsyncSession = Depends(get_db)):
    device_key = (data.get("device_key") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    device_name = (data.get("device_name") or "").strip()
    if not device_key or not hwid:
        raise HTTPException(400, "device_key and hwid are required")
    dev = await get_dev_by_device_key(device_key, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(EndUser).where(
            EndUser.developer_id == dev.id,
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
        current_count = (
            await db.execute(
                select(func.count(EndUser.id)).where(
                    EndUser.developer_id == dev.id,
                    EndUser.is_device_only == True,
                )
            )
        ).scalar() or 0
        await check_limit(dev, "max_devices", current_count, db)

        device = EndUser(
            developer_id=dev.id,
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
    device_key = (data.get("device_key") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    if not device_key or not hwid:
        raise HTTPException(400, "device_key and hwid are required")
    dev = await get_dev_by_device_key(device_key, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(EndUser).where(
            EndUser.developer_id == dev.id,
            EndUser.hwid == hwid,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()

    if not device:
        device = EndUser(
            developer_id=dev.id,
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
