from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, CustomDomain
from schemas.premium import CustomDomainCreate, CustomDomainResponse
from services.plan_enforcer import require_feature
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/api/v1/developer/domains", tags=["Custom Domains"])

@router.get("", response_model=list[CustomDomainResponse])
async def get_domains(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CustomDomain).where(CustomDomain.developer_id == dev.id)
        .order_by(CustomDomain.created_at.desc())
    )
    return res.scalars().all()

@router.post("", response_model=CustomDomainResponse)
async def add_domain(dom: CustomDomainCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_custom_domain", db)
    existing = await db.execute(select(CustomDomain).where(CustomDomain.domain == dom.domain))
    if existing.scalars().first():
        raise HTTPException(400, "Domain already added")
    new_dom = CustomDomain(
        developer_id=dev.id,
        domain=dom.domain,
        verification_token=secrets.token_hex(16),
    )
    db.add(new_dom)
    await db.commit()
    await db.refresh(new_dom)
    return new_dom

@router.delete("/{domain_id}")
async def remove_domain(domain_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CustomDomain).where(CustomDomain.id == domain_id, CustomDomain.developer_id == dev.id)
    )
    dom = res.scalars().first()
    if not dom:
        raise HTTPException(404, "Domain not found")
    await db.delete(dom)
    await db.commit()
    return {"status": "deleted"}

@router.post("/{domain_id}/verify")
async def verify_domain(domain_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_custom_domain", db)
    res = await db.execute(
        select(CustomDomain).where(CustomDomain.id == domain_id, CustomDomain.developer_id == dev.id)
    )
    dom = res.scalars().first()
    if not dom:
        raise HTTPException(404, "Domain not found")
    dom.is_verified = True
    await db.commit()
    return {"status": "verified", "domain": dom.domain}

@router.put("/{domain_id}/ssl")
async def toggle_ssl(domain_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    plan = await require_feature(dev, "has_custom_domain", db)
    await require_feature(dev, "has_ssl", db, plan)
    res = await db.execute(
        select(CustomDomain).where(CustomDomain.id == domain_id, CustomDomain.developer_id == dev.id)
    )
    dom = res.scalars().first()
    if not dom:
        raise HTTPException(404, "Domain not found")
    dom.ssl_enabled = not dom.ssl_enabled
    await db.commit()
    return {"status": "toggled", "ssl_enabled": dom.ssl_enabled}
