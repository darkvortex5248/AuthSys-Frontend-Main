from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeviceActivation
from routers.developer_keys import verify_app_owner

router = APIRouter(prefix="/api/v1/developer/devices", tags=["Devices"])


@router.get("/{app_id}")
async def list_devices(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(
        select(DeviceActivation)
        .where(DeviceActivation.app_id == app_id)
        .order_by(DeviceActivation.last_checkin_at.desc().nullslast())
    )
    devices = res.scalars().all()
    return {
        "devices": [
            {
                "id": d.id,
                "hwid": d.hwid,
                "device_name": d.device_name,
                "is_active": d.is_active,
                "last_checkin_at": d.last_checkin_at.isoformat() if d.last_checkin_at else None,
                "notes": d.notes,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in devices
        ]
    }


@router.post("/{app_id}/{device_id}/toggle")
async def toggle_device(
    app_id: int,
    device_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(
        select(DeviceActivation).where(
            DeviceActivation.id == device_id,
            DeviceActivation.app_id == app_id,
        )
    )
    device = res.scalars().first()
    if not device:
        raise HTTPException(404, "Device not found")
    device.is_active = not device.is_active
    await db.commit()
    return {
        "status": "success",
        "is_active": device.is_active,
        "device_id": device.id,
    }


@router.delete("/{app_id}/{device_id}")
async def delete_device(
    app_id: int,
    device_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(
        select(DeviceActivation).where(
            DeviceActivation.id == device_id,
            DeviceActivation.app_id == app_id,
        )
    )
    device = res.scalars().first()
    if not device:
        raise HTTPException(404, "Device not found")
    await db.delete(device)
    await db.commit()
    return {"status": "success", "device_id": device.id}
