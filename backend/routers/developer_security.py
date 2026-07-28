from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import DeveloperAccount, IPWhitelistRule, APIKey, Application
from schemas.premium import (
    IPWhitelistRuleCreate, IPWhitelistRuleResponse,
    APIKeyCreate, APIKeyResponse, APIKeyCreatedResponse,
)
from services.plan_enforcer import require_feature
from datetime import datetime, timezone
import secrets
import hashlib

router = APIRouter(prefix="/api/v1/developer/security", tags=["Security"])

# ── IP Whitelist ──────────────────────────────────────────────────────

@router.get("/ipwhitelist", response_model=list[IPWhitelistRuleResponse])
async def get_ip_rules(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(IPWhitelistRule)
        .join(Application, IPWhitelistRule.app_id == Application.id)
        .where(Application.developer_id == dev.id)
        .order_by(IPWhitelistRule.created_at.desc())
    )
    return res.scalars().all()

@router.post("/ipwhitelist", response_model=IPWhitelistRuleResponse)
@db_transaction
async def create_ip_rule(rule: IPWhitelistRuleCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_ip_tracking", db)
    app_res = await db.execute(
        select(Application).where(Application.id == rule.app_id, Application.developer_id == dev.id)
    )
    if not app_res.scalars().first():
        raise HTTPException(404, "App not found")
    new_rule = IPWhitelistRule(**rule.model_dump())
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    return new_rule

@router.delete("/ipwhitelist/{rule_id}")
@db_transaction
async def delete_ip_rule(rule_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(IPWhitelistRule)
        .join(Application, IPWhitelistRule.app_id == Application.id)
        .where(IPWhitelistRule.id == rule_id, Application.developer_id == dev.id)
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    await db.delete(rule)
    await db.commit()
    return {"status": "deleted"}

@router.put("/ipwhitelist/{rule_id}/toggle")
@db_transaction
async def toggle_ip_rule(rule_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(IPWhitelistRule)
        .join(Application, IPWhitelistRule.app_id == Application.id)
        .where(IPWhitelistRule.id == rule_id, Application.developer_id == dev.id)
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    rule.is_active = not rule.is_active
    await db.commit()
    return {"status": "toggled", "is_active": rule.is_active}


# ── API Keys ──────────────────────────────────────────────────────────

@router.get("/apikeys", response_model=list[APIKeyResponse])
async def get_api_keys(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(APIKey)
        .where(APIKey.developer_id == dev.id)
        .order_by(APIKey.created_at.desc())
    )
    return res.scalars().all()

@router.post("/apikeys", response_model=APIKeyCreatedResponse)
@db_transaction
async def create_api_key(key_in: APIKeyCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_api_access", db)
    raw_key = f"rinox_{secrets.token_hex(24)}"
    prefix = raw_key[:12]
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    new_key = APIKey(
        developer_id=dev.id,
        name=key_in.name,
        key_prefix=prefix,
        key_hash=key_hash,
        scopes=key_in.scopes,
        ip_restrictions=key_in.ip_restrictions,
        expires_at=key_in.expires_at,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    return APIKeyCreatedResponse(
        id=new_key.id, name=new_key.name, key_prefix=new_key.key_prefix,
        scopes=new_key.scopes, ip_restrictions=new_key.ip_restrictions,
        is_active=new_key.is_active, last_used_at=new_key.last_used_at,
        expires_at=new_key.expires_at, created_at=new_key.created_at,
        raw_key=raw_key,
    )

@router.delete("/apikeys/{key_id}")
@db_transaction
async def delete_api_key(key_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.developer_id == dev.id)
    )
    key = res.scalars().first()
    if not key:
        raise HTTPException(404, "API key not found")
    await db.delete(key)
    await db.commit()
    return {"status": "deleted"}

@router.put("/apikeys/{key_id}/toggle")
@db_transaction
async def toggle_api_key(key_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.developer_id == dev.id)
    )
    key = res.scalars().first()
    if not key:
        raise HTTPException(404, "API key not found")
    key.is_active = not key.is_active
    await db.commit()
    return {"status": "toggled", "is_active": key.is_active}

SCOPES = [
    {"id": "apps:read", "label": "View applications"},
    {"id": "apps:write", "label": "Create/update applications"},
    {"id": "keys:read", "label": "View license keys"},
    {"id": "keys:write", "label": "Create/update license keys"},
    {"id": "users:read", "label": "View end users"},
    {"id": "users:write", "label": "Create/update end users"},
    {"id": "analytics:read", "label": "View analytics"},
    {"id": "webhooks:read", "label": "View webhook config"},
    {"id": "webhooks:write", "label": "Manage webhooks"},
    {"id": "billing:read", "label": "View billing info"},
    {"id": "admin:all", "label": "Full access"},
]

@router.get("/apikeys/scopes")
async def get_available_scopes():
    return SCOPES

@router.post("/revoke-all-keys")
@db_transaction
async def revoke_all_api_keys(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    """Revoke all active API keys for the developer."""
    from sqlalchemy import update
    await db.execute(
        update(APIKey)
        .where(APIKey.developer_id == dev.id, APIKey.is_active == True)
        .values(is_active=False)
    )
    await db.commit()
    return {"status": "success", "message": "All API keys have been revoked"}
