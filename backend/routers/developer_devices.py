from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeviceGroup, Device

router = APIRouter(prefix="/api/v1/developer/devices", tags=["Devices"])


@router.get("")
async def list_device_groups_and_devices(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.developer_id == dev.id).order_by(DeviceGroup.created_at.desc())
    )
    groups = res.scalars().all()
    result = []
    for group in groups:
        dev_res = await db.execute(
            select(Device).where(Device.group_id == group.id).order_by(Device.last_checkin_at.desc().nullslast())
        )
        devices = dev_res.scalars().all()
        count_res = await db.execute(
            select(func.count(Device.id)).where(Device.group_id == group.id)
        )
        total = count_res.scalar() or 0
        result.append({
            "group": {
                "id": group.id,
                "name": group.name,
                "group_secret": group.group_secret,
                "max_devices": group.max_devices,
                "device_count": total,
                "is_active": group.is_active,
            },
            "devices": [
                {
                    "id": d.id,
                    "hwid": d.hwid,
                    "device_name": d.device_name,
                    "status": d.status,
                    "ban_reason": d.ban_reason,
                    "last_checkin_at": d.last_checkin_at.isoformat() if d.last_checkin_at else None,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                }
                for d in devices
            ],
        })
    return {"groups": result}


@router.get("/key")
async def get_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.developer_id == dev.id).order_by(DeviceGroup.created_at.asc()).limit(1)
    )
    group = res.scalars().first()
    return {"device_key": group.group_secret if group else ""}


@router.post("/key/regenerate")
async def regenerate_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    import secrets
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.developer_id == dev.id).order_by(DeviceGroup.created_at.asc()).limit(1)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "No device group found. Create one first.")
    group.group_secret = f"dv_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"device_key": group.group_secret}
