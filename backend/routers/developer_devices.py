from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, EndUser, SubscriptionPlan

router = APIRouter(prefix="/api/v1/developer/devices", tags=["Devices"])


@router.get("")
async def list_devices(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(EndUser)
        .where(
            EndUser.developer_id == dev.id,
            EndUser.is_device_only == True,
        )
        .order_by(EndUser.last_login_at.desc().nullslast())
    )
    devices = res.scalars().all()

    limit = 3
    remaining = 0
    if dev.plan_id:
        plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == dev.plan_id))
        plan = plan_res.scalars().first()
        if plan:
            limit = getattr(plan, "max_devices", 3)
            remaining = max(0, limit - len(devices))

    return {
        "devices": [
            {
                "id": d.id,
                "hwid": d.hwid,
                "device_name": d.device_name,
                "is_active": not d.is_banned,
                "ban_reason": d.ban_reason,
                "last_checkin_at": d.last_login_at.isoformat() if d.last_login_at else None,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in devices
        ],
        "limit": limit,
        "remaining": remaining,
    }


@router.post("/{device_id}/toggle")
async def toggle_device(
    device_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(EndUser).where(
            EndUser.id == device_id,
            EndUser.developer_id == dev.id,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()
    if not device:
        raise HTTPException(404, "Device not found")
    device.is_banned = not device.is_banned
    device.ban_reason = "Device deactivated by admin" if device.is_banned else None
    await db.commit()
    return {
        "status": "success",
        "is_active": not device.is_banned,
        "device_id": device.id,
    }


@router.delete("/{device_id}")
async def delete_device(
    device_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(EndUser).where(
            EndUser.id == device_id,
            EndUser.developer_id == dev.id,
            EndUser.is_device_only == True,
        )
    )
    device = res.scalars().first()
    if not device:
        raise HTTPException(404, "Device not found")
    await db.delete(device)
    await db.commit()
    return {"status": "success", "device_id": device.id}


@router.get("/key")
async def get_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
):
    return {"device_key": dev.device_api_key}


@router.post("/key/regenerate")
async def regenerate_device_key(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    import secrets
    dev.device_api_key = f"dv_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"device_key": dev.device_api_key}
