from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from models.domain import DeviceGroup, Device

router = APIRouter(prefix="/device", tags=["Device Activation"])


async def get_device_group_by_secret(group_secret: str, db: AsyncSession) -> DeviceGroup:
    key = (group_secret or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="group_secret is required")
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.group_secret == key)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid group secret")
    if not group.is_active:
        raise HTTPException(status_code=403, detail="Device group is disabled")
    return group


@router.post("/register")
async def register_device(data: dict, db: AsyncSession = Depends(get_db)):
    group_secret = (data.get("group_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    device_name = (data.get("device_name") or "").strip()
    if not group_secret or not hwid:
        raise HTTPException(400, "group_secret and hwid are required")
    group = await get_device_group_by_secret(group_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(Device).where(
            Device.group_id == group.id,
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
                select(func.count(Device.id)).where(Device.group_id == group.id)
            )
        ).scalar() or 0
        if current_count >= group.max_devices:
            raise HTTPException(403, f"Device limit reached ({group.max_devices}). Contact developer.")

        device = Device(
            group_id=group.id,
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
    group_secret = (data.get("group_secret") or "").strip()
    hwid = (data.get("hwid") or "").strip()
    if not group_secret or not hwid:
        raise HTTPException(400, "group_secret and hwid are required")
    group = await get_device_group_by_secret(group_secret, db)
    now = datetime.now(timezone.utc)

    res = await db.execute(
        select(Device).where(
            Device.group_id == group.id,
            Device.hwid == hwid,
        )
    )
    device = res.scalars().first()

    if not device:
        current_count = (
            await db.execute(
                select(func.count(Device.id)).where(Device.group_id == group.id)
            )
        ).scalar() or 0
        if current_count >= group.max_devices:
            raise HTTPException(403, f"Device limit reached ({group.max_devices}). Contact developer.")

        device = Device(
            group_id=group.id,
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
