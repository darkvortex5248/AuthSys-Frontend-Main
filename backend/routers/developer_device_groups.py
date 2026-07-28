import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import DeveloperAccount, DeviceGroup, Device
from schemas.dashboard import DeviceGroupCreate, DeviceGroupUpdate, DeviceGroupResponse, DeviceResponse
from services.plan_enforcer import require_feature

router = APIRouter(prefix="/api/v1/developer/device-groups", tags=["Device Groups"])


@router.get("")
async def list_device_groups(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    plan = await require_feature(dev, "has_device_panel", db)
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.developer_id == dev.id).order_by(DeviceGroup.created_at.desc())
    )
    groups = res.scalars().all()
    result = []
    for group in groups:
        count_res = await db.execute(
            select(func.count(Device.id)).where(Device.group_id == group.id)
        )
        result.append({
            "id": group.id,
            "name": group.name,
            "group_secret": group.group_secret,
            "is_active": group.is_active,
            "max_devices": group.max_devices,
            "device_count": count_res.scalar() or 0,
            "created_at": group.created_at.isoformat() if group.created_at else None,
        })
    return result


@router.post("")
@db_transaction
async def create_device_group(
    req: DeviceGroupCreate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    await require_feature(dev, "has_device_panel", db)
    group = DeviceGroup(
        developer_id=dev.id,
        name=req.name,
        group_secret=f"dv_{secrets.token_urlsafe(32)}",
        max_devices=req.max_devices,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return {
        "id": group.id,
        "name": group.name,
        "group_secret": group.group_secret,
        "is_active": group.is_active,
        "max_devices": group.max_devices,
        "device_count": 0,
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }


@router.get("/{group_id}")
async def get_device_group(
    group_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")
    count_res = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group.id)
    )
    return {
        "id": group.id,
        "name": group.name,
        "group_secret": group.group_secret,
        "is_active": group.is_active,
        "max_devices": group.max_devices,
        "device_count": count_res.scalar() or 0,
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }


@router.put("/{group_id}")
@db_transaction
async def update_device_group(
    group_id: int,
    req: DeviceGroupUpdate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")
    if req.name is not None:
        group.name = req.name
    if req.is_active is not None:
        group.is_active = req.is_active
    if req.max_devices is not None:
        group.max_devices = req.max_devices
    await db.commit()
    return {"status": "success"}


@router.delete("/{group_id}")
@db_transaction
async def delete_device_group(
    group_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    try:
        res = await db.execute(
            select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
        )
        group = res.scalars().first()
        if not group:
            raise HTTPException(404, "Device group not found")
        await db.delete(group)
        await db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete device group: {str(e)}") from e


@router.post("/{group_id}/regenerate-secret")
@db_transaction
async def regenerate_group_secret(
    group_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")
    group.group_secret = f"dv_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"group_secret": group.group_secret}


@router.get("/{group_id}/devices")
async def list_devices(
    group_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")
    dev_res = await db.execute(
        select(Device).where(Device.group_id == group_id).order_by(Device.last_checkin_at.desc().nullslast())
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


@router.post("/{group_id}/devices/{device_id}/{action}")
@db_transaction
async def device_action(
    group_id: int,
    device_id: int,
    action: str,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    valid_actions = {"pause", "unpause", "ban", "unban", "perma-ban", "whitelist", "remove"}
    if action not in valid_actions:
        raise HTTPException(400, f"Invalid action. Valid: {', '.join(valid_actions)}")

    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")

    dev_res = await db.execute(
        select(Device).where(Device.id == device_id, Device.group_id == group_id)
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


@router.get("/{group_id}/stats")
async def device_group_stats(
    group_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DeviceGroup).where(DeviceGroup.id == group_id, DeviceGroup.developer_id == dev.id)
    )
    group = res.scalars().first()
    if not group:
        raise HTTPException(404, "Device group not found")
    active = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group_id, Device.status == "active")
    )
    paused = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group_id, Device.status == "paused")
    )
    banned = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group_id, Device.status.in_(["banned", "perma_banned"]))
    )
    whitelisted = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group_id, Device.status == "whitelisted")
    )
    total = await db.execute(
        select(func.count(Device.id)).where(Device.group_id == group_id)
    )
    return {
        "total": total.scalar() or 0,
        "active": active.scalar() or 0,
        "paused": paused.scalar() or 0,
        "banned": banned.scalar() or 0,
        "whitelisted": whitelisted.scalar() or 0,
    }
