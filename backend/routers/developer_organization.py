from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Organization, OrganizationMember
from schemas.premium import OrganizationCreate, OrganizationResponse, OrganizationMemberResponse, InviteMemberRequest
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api/v1/developer/organization", tags=["Organization"])

@router.get("", response_model=OrganizationResponse)
async def get_org(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Organization).where(
            or_(
                Organization.owner_id == dev.id,
                Organization.id.in_(
                    select(OrganizationMember.organization_id).where(
                        OrganizationMember.developer_id == dev.id,
                        OrganizationMember.is_accepted == True,
                    )
                )
            )
        )
    )
    org = res.scalars().first()
    if not org:
        raise HTTPException(404, "No organization found. Create one first.")
    return org

@router.post("", response_model=OrganizationResponse)
async def create_org(org_in: OrganizationCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Organization).where(Organization.slug == org_in.slug))
    if existing.scalars().first():
        raise HTTPException(400, "Organization slug already taken")
    org = Organization(
        name=org_in.name, slug=org_in.slug, logo_url=org_in.logo_url, owner_id=dev.id,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org

@router.put("/{org_id}")
async def update_org(org_id: int, org_in: OrganizationCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.owner_id == dev.id)
    )
    org = res.scalars().first()
    if not org:
        raise HTTPException(404, "Organization not found")
    org.name = org_in.name
    org.slug = org_in.slug
    if org_in.logo_url:
        org.logo_url = org_in.logo_url
    await db.commit()
    return org

@router.get("/members", response_model=List[OrganizationMemberResponse])
async def get_org_members(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    org_res = await db.execute(
        select(Organization).where(
            or_(
                Organization.owner_id == dev.id,
                Organization.id.in_(
                    select(OrganizationMember.organization_id).where(
                        OrganizationMember.developer_id == dev.id,
                        OrganizationMember.is_accepted == True,
                    )
                )
            )
        )
    )
    org = org_res.scalars().first()
    if not org:
        raise HTTPException(404, "No organization found")
    res = await db.execute(
        select(OrganizationMember).where(OrganizationMember.organization_id == org.id)
        .order_by(OrganizationMember.created_at.desc())
    )
    return res.scalars().all()

@router.post("/invite")
async def invite_member(inv: InviteMemberRequest, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    org_res = await db.execute(
        select(Organization).where(Organization.owner_id == dev.id)
    )
    org = org_res.scalars().first()
    if not org:
        raise HTTPException(404, "No organization found. Create one first.")
    target_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == inv.developer_email))
    target = target_res.scalars().first()
    if not target:
        raise HTTPException(404, "User not found with this email")
    if target.id == dev.id:
        raise HTTPException(400, "Cannot invite yourself")
    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.developer_id == target.id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(400, "User already invited or is a member")
    member = OrganizationMember(
        organization_id=org.id, developer_id=target.id,
        role=inv.role, invited_by=dev.id,
    )
    db.add(member)
    await db.commit()
    return {"status": "invited", "email": inv.developer_email}

@router.post("/invite/{member_id}/accept")
async def accept_invite(member_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.id == member_id,
            OrganizationMember.developer_id == dev.id,
        )
    )
    member = res.scalars().first()
    if not member:
        raise HTTPException(404, "Invitation not found")
    member.is_accepted = True
    member.joined_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "accepted"}

@router.put("/members/{member_id}/role")
async def update_member_role(member_id: int, role: str, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    org_res = await db.execute(select(Organization).where(Organization.owner_id == dev.id))
    org = org_res.scalars().first()
    if not org:
        raise HTTPException(403, "Only organization owner can change roles")
    res = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == org.id,
        )
    )
    member = res.scalars().first()
    if not member:
        raise HTTPException(404, "Member not found")
    member.role = role
    await db.commit()
    return {"status": "updated", "role": role}

@router.delete("/members/{member_id}")
async def remove_member(member_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    org_res = await db.execute(select(Organization).where(Organization.owner_id == dev.id))
    org = org_res.scalars().first()
    if not org:
        raise HTTPException(403, "Only organization owner can remove members")
    res = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == org.id,
        )
    )
    member = res.scalars().first()
    if not member:
        raise HTTPException(404, "Member not found")
    await db.delete(member)
    await db.commit()
    return {"status": "removed"}
