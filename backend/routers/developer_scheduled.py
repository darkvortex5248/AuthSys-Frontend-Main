from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Application, ScheduledAction, LicenseKey, EndUser
from schemas.premium import ScheduledActionCreate, ScheduledActionResponse
from datetime import datetime, timezone, timedelta
from typing import List

router = APIRouter(prefix="/api/v1/developer/scheduled", tags=["Scheduled Actions"])

@router.get("", response_model=List[ScheduledActionResponse])
async def get_scheduled_actions(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ScheduledAction).where(ScheduledAction.developer_id == dev.id)
        .order_by(ScheduledAction.scheduled_at.asc())
    )
    return res.scalars().all()

@router.post("", response_model=ScheduledActionResponse)
async def create_scheduled_action(action: ScheduledActionCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    if action.app_id:
        app_res = await db.execute(
            select(Application).where(Application.id == action.app_id, Application.developer_id == dev.id)
        )
        if not app_res.scalars().first():
            raise HTTPException(404, "App not found")
    if action.scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(400, "Scheduled time must be in the future")
    new_action = ScheduledAction(
        developer_id=dev.id, app_id=action.app_id, action_type=action.action_type,
        target_type=action.target_type, target_filter=action.target_filter,
        payload=action.payload, scheduled_at=action.scheduled_at,
    )
    db.add(new_action)
    await db.commit()
    await db.refresh(new_action)
    return new_action

@router.delete("/{action_id}")
async def delete_scheduled_action(action_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ScheduledAction).where(
            ScheduledAction.id == action_id, ScheduledAction.developer_id == dev.id,
            ScheduledAction.status == "pending",
        )
    )
    action = res.scalars().first()
    if not action:
        raise HTTPException(404, "Scheduled action not found or already executed")
    await db.delete(action)
    await db.commit()
    return {"status": "deleted"}

@router.post("/{action_id}/execute")
async def execute_action_now(action_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ScheduledAction).where(
            ScheduledAction.id == action_id, ScheduledAction.developer_id == dev.id,
            ScheduledAction.status == "pending",
        )
    )
    action = res.scalars().first()
    if not action:
        raise HTTPException(404, "Scheduled action not found or already executed")
    action.status = "running"
    await db.commit()
    try:
        result = await _execute_action(action, db)
        action.status = "completed"
        action.result_summary = result
        action.executed_at = datetime.now(timezone.utc)
    except Exception as e:
        action.status = "failed"
        action.result_summary = {"error": str(e)}
        action.executed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": action.status, "result": action.result_summary}

async def _execute_action(action: ScheduledAction, db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)
    base_q = select(LicenseKey)
    if action.target_type == "license_key":
        if action.app_id:
            base_q = base_q.where(LicenseKey.app_id == action.app_id)
        if action.target_filter:
            if "key_type" in action.target_filter:
                base_q = base_q.where(LicenseKey.key_type == action.target_filter["key_type"])
            if "expires_before" in action.target_filter:
                base_q = base_q.where(LicenseKey.expires_at < datetime.fromisoformat(action.target_filter["expires_before"]))
        res = await db.execute(base_q)
        keys = res.scalars().all()
        count = 0
        if action.action_type == "bulk_expire":
            for k in keys:
                k.expires_at = now
                count += 1
        elif action.action_type == "bulk_suspend":
            for k in keys:
                k.is_paused = True
                count += 1
        elif action.action_type == "notify":
            count = len(keys)
        return {"affected_count": count, "target_type": "license_key"}
    elif action.target_type == "end_user":
        user_q = select(EndUser)
        if action.app_id:
            user_q = user_q.where(EndUser.app_id == action.app_id)
        if action.target_filter:
            if "banned" in action.target_filter:
                user_q = user_q.where(EndUser.is_banned == action.target_filter["banned"])
        res = await db.execute(user_q)
        users = res.scalars().all()
        count = 0
        if action.action_type == "bulk_suspend":
            for u in users:
                u.is_banned = True
                count += 1
        elif action.action_type == "bulk_expire":
            for u in users:
                u.expires_at = now
                count += 1
        return {"affected_count": count, "target_type": "end_user"}
    return {"affected_count": 0}

# Background scheduler checker (called from startup)
async def check_and_execute_scheduled(db: AsyncSession):
    now = datetime.now(timezone.utc)
    res = await db.execute(
        select(ScheduledAction).where(
            ScheduledAction.status == "pending",
            ScheduledAction.scheduled_at <= now,
        )
    )
    actions = res.scalars().all()
    for action in actions:
        action.status = "running"
        await db.commit()
        try:
            result = await _execute_action(action, db)
            action.status = "completed"
            action.result_summary = result
            action.executed_at = datetime.now(timezone.utc)
        except Exception as e:
            action.status = "failed"
            action.result_summary = {"error": str(e)}
            action.executed_at = datetime.now(timezone.utc)
        await db.commit()
