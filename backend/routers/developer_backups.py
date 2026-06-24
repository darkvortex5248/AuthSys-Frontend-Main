from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Application, AppBackup, IPWhitelistRule, WebhookEndpoint, Blacklist, Variable, LogRetentionConfig
from schemas.premium import BackupCreate, BackupResponse
import json

router = APIRouter(prefix="/api/v1/developer/backups", tags=["Backups"])

async def _snapshot_app(db: AsyncSession, app_id: int):
    app_res = await db.execute(select(Application).where(Application.id == app_id))
    app = app_res.scalars().first()
    if not app:
        return None
    app_data = {
        "name": app.name, "version": app.version, "min_version": app.min_version,
        "status": app.status, "hash_check": app.hash_check, "integrity_key": app.integrity_key,
        "webhook_url": app.webhook_url, "hwid_enabled": app.hwid_enabled,
        "maintenance_mode": app.maintenance_mode, "developer_lock": app.developer_lock,
    }
    wh_res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.app_id == app_id))
    webhooks = [{"url": w.url, "events": w.events, "is_active": w.is_active} for w in wh_res.scalars().all()]
    ip_res = await db.execute(select(IPWhitelistRule).where(IPWhitelistRule.app_id == app_id))
    ip_rules = [{"type": r.rule_type, "value": r.value, "is_blocklist": r.is_blocklist} for r in ip_res.scalars().all()]
    bl_res = await db.execute(select(Blacklist).where(Blacklist.app_id == app_id))
    blacklist = [{"type": b.type, "value": b.value, "reason": b.reason} for b in bl_res.scalars().all()]
    var_res = await db.execute(select(Variable).where(Variable.app_id == app_id))
    variables = [{"key": v.key_name, "value": v.key_value, "global": v.is_global} for v in var_res.scalars().all()]
    log_res = await db.execute(select(LogRetentionConfig).where(LogRetentionConfig.app_id == app_id))
    log_cfg = log_res.scalars().first()
    return {
        "app": app_data, "webhooks": webhooks, "ip_rules": ip_rules,
        "blacklist": blacklist, "variables": variables,
        "log_retention": {"retention_days": log_cfg.retention_days if log_cfg else 30, "auto_cleanup": log_cfg.auto_cleanup if log_cfg else True},
    }

@router.get("", response_model=list[BackupResponse])
async def get_backups(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppBackup)
        .join(Application, AppBackup.app_id == Application.id)
        .where(Application.developer_id == dev.id)
        .order_by(AppBackup.created_at.desc())
    )
    return res.scalars().all()

@router.post("", response_model=BackupResponse)
async def create_backup(bk: BackupCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == bk.app_id, Application.developer_id == dev.id)
    )
    if not app_res.scalars().first():
        raise HTTPException(404, "App not found")
    snapshot = await _snapshot_app(db, bk.app_id)
    backup = AppBackup(
        app_id=bk.app_id, name=bk.name,
        config_snapshot=snapshot, size_bytes=len(json.dumps(snapshot)),
    )
    db.add(backup)
    await db.commit()
    await db.refresh(backup)
    return backup

@router.get("/{backup_id}")
async def get_backup(backup_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppBackup)
        .join(Application, AppBackup.app_id == Application.id)
        .where(AppBackup.id == backup_id, Application.developer_id == dev.id)
    )
    backup = res.scalars().first()
    if not backup:
        raise HTTPException(404, "Backup not found")
    return backup

@router.post("/{backup_id}/restore")
async def restore_backup(backup_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppBackup)
        .join(Application, AppBackup.app_id == Application.id)
        .where(AppBackup.id == backup_id, Application.developer_id == dev.id)
    )
    backup = res.scalars().first()
    if not backup:
        raise HTTPException(404, "Backup not found")
    snapshot = backup.config_snapshot
    app_res = await db.execute(
        select(Application).where(Application.id == backup.app_id, Application.developer_id == dev.id)
    )
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(404, "App not found")
    app_data = snapshot.get("app", {})
    for key, val in app_data.items():
        if hasattr(app, key):
            setattr(app, key, val)
    await db.commit()
    return {"status": "restored", "app_id": backup.app_id}

@router.delete("/{backup_id}")
async def delete_backup(backup_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppBackup)
        .join(Application, AppBackup.app_id == Application.id)
        .where(AppBackup.id == backup_id, Application.developer_id == dev.id)
    )
    backup = res.scalars().first()
    if not backup:
        raise HTTPException(404, "Backup not found")
    await db.delete(backup)
    await db.commit()
    return {"status": "deleted"}
