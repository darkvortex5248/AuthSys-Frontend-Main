from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeviceApp, Device

router = APIRouter(prefix="/api/v1/developer/devices", tags=["Devices"])


@router.get("")
async def list_device_apps_and_devices(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.developer_id == dev.id).order_by(DeviceApp.created_at.desc())
    )
    apps = res.scalars().all()
    result = []
    for app in apps:
        dev_res = await db.execute(
            select(Device).where(Device.device_app_id == app.id).order_by(Device.last_checkin_at.desc().nullslast())
        )
        devices = dev_res.scalars().all()
        count_res = await db.execute(
            select(func.count(Device.id)).where(Device.device_app_id == app.id)
        )
        total = count_res.scalar() or 0
        result.append({
            "app": {
                "id": app.id,
                "name": app.name,
                "device_secret": app.device_secret,
                "max_devices": app.max_devices,
                "device_count": total,
                "is_active": app.is_active,
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
    return {"apps": result}


@router.get("/key")
async def get_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.developer_id == dev.id).order_by(DeviceApp.created_at.asc()).limit(1)
    )
    app = res.scalars().first()
    return {"device_key": app.device_secret if app else ""}


@router.post("/key/regenerate")
async def regenerate_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    import secrets
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.developer_id == dev.id).order_by(DeviceApp.created_at.asc()).limit(1)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "No device app found. Create one first.")
    app.device_secret = f"dv_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"device_key": app.device_secret}
