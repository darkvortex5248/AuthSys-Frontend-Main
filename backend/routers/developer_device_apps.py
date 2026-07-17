import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeviceApp, Device
from schemas.dashboard import DeviceAppCreate, DeviceAppUpdate, DeviceAppResponse, DeviceResponse

router = APIRouter(prefix="/api/v1/developer/device-apps", tags=["Device Apps"])


@router.get("")
async def list_device_apps(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.developer_id == dev.id).order_by(DeviceApp.created_at.desc())
    )
    apps = res.scalars().all()
    result = []
    for app in apps:
        count_res = await db.execute(
            select(func.count(Device.id)).where(Device.device_app_id == app.id)
        )
        result.append({
            "id": app.id,
            "name": app.name,
            "device_secret": app.device_secret,
            "is_active": app.is_active,
            "max_devices": app.max_devices,
            "device_count": count_res.scalar() or 0,
            "created_at": app.created_at.isoformat() if app.created_at else None,
        })
    return result


@router.post("")
async def create_device_app(
    req: DeviceAppCreate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    app = DeviceApp(
        developer_id=dev.id,
        name=req.name,
        device_secret=f"dv_{secrets.token_urlsafe(32)}",
        max_devices=req.max_devices,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return {
        "id": app.id,
        "name": app.name,
        "device_secret": app.device_secret,
        "is_active": app.is_active,
        "max_devices": app.max_devices,
        "device_count": 0,
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }


@router.get("/{app_id}")
async def get_device_app(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    count_res = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app.id)
    )
    return {
        "id": app.id,
        "name": app.name,
        "device_secret": app.device_secret,
        "is_active": app.is_active,
        "max_devices": app.max_devices,
        "device_count": count_res.scalar() or 0,
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }


@router.put("/{app_id}")
async def update_device_app(
    app_id: int,
    req: DeviceAppUpdate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    if req.name is not None:
        app.name = req.name
    if req.is_active is not None:
        app.is_active = req.is_active
    if req.max_devices is not None:
        app.max_devices = req.max_devices
    await db.commit()
    return {"status": "success"}


@router.delete("/{app_id}")
async def delete_device_app(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    await db.delete(app)
    await db.commit()
    return {"status": "success"}


@router.post("/{app_id}/regenerate-secret")
async def regenerate_device_secret(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    app.device_secret = f"dv_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"device_secret": app.device_secret}


@router.get("/{app_id}/devices")
async def list_devices(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    dev_res = await db.execute(
        select(Device).where(Device.device_app_id == app_id).order_by(Device.last_checkin_at.desc().nullslast())
    )
    devices = dev_res.scalars().all()
    return [
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
    ]


@router.post("/{app_id}/devices/{device_id}/{action}")
async def device_action(
    app_id: int,
    device_id: int,
    action: str,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    valid_actions = {"pause", "unpause", "ban", "unban", "perma-ban", "whitelist", "remove"}
    if action not in valid_actions:
        raise HTTPException(400, f"Invalid action. Valid: {', '.join(valid_actions)}")

    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")

    dev_res = await db.execute(
        select(Device).where(Device.id == device_id, Device.device_app_id == app_id)
    )
    device = dev_res.scalars().first()
    if not device:
        raise HTTPException(404, "Device not found")

    if action == "remove":
        await db.delete(device)
        await db.commit()
        return {"status": "success", "message": "Device removed"}

    status_map = {
        "pause": "paused",
        "unpause": "active",
        "ban": "banned",
        "unban": "active",
        "perma-ban": "perma_banned",
        "whitelist": "whitelisted",
    }
    device.status = status_map[action]
    if action in ("ban", "perma-ban"):
        device.ban_reason = "Device deactivated by admin"
    elif action == "unban":
        device.ban_reason = None
    await db.commit()
    return {
        "status": "success",
        "device_id": device.id,
        "new_status": device.status,
    }


@router.get("/{app_id}/stats")
async def device_app_stats(
    app_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceApp).where(DeviceApp.id == app_id, DeviceApp.developer_id == dev.id)
    )
    app = res.scalars().first()
    if not app:
        raise HTTPException(404, "Device app not found")
    active = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app_id, Device.status == "active")
    )
    paused = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app_id, Device.status == "paused")
    )
    banned = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app_id, Device.status.in_(["banned", "perma_banned"]))
    )
    whitelisted = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app_id, Device.status == "whitelisted")
    )
    total = await db.execute(
        select(func.count(Device.id)).where(Device.device_app_id == app_id)
    )
    return {
        "total": total.scalar() or 0,
        "active": active.scalar() or 0,
        "paused": paused.scalar() or 0,
        "banned": banned.scalar() or 0,
        "whitelisted": whitelisted.scalar() or 0,
    }
