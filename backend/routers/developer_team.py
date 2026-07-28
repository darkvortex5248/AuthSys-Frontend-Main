from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import TeamMember, DeveloperAccount
from services.plan_enforcer import require_feature, check_limit

router = APIRouter(prefix="/api/v1/developer/team", tags=["Team"])

ALLOWED_ROLES = {"admin", "moderator", "support"}
ADMIN_ROLES = {"admin"}


class TeamMemberResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime


class InviteRequest(BaseModel):
    email: str
    role: str = "support"


class RoleUpdateRequest(BaseModel):
    role: str


@router.get("", response_model=List[TeamMemberResponse])
async def get_team(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TeamMember, DeveloperAccount)
        .join(DeveloperAccount, TeamMember.user_id == DeveloperAccount.id)
        .where(TeamMember.developer_id == dev.id)
    )
    members = []
    for tm, user in result:
        members.append(TeamMemberResponse(
            id=tm.id,
            username=user.username,
            email=user.email,
            role=tm.role,
            created_at=tm.created_at,
        ))
    return members


@router.post("/invite", response_model=TeamMemberResponse)
@db_transaction
async def invite_member(
    req: InviteRequest,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    plan = await require_feature(dev, "has_staff_management", db)
    if req.role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Invalid role '{req.role}'. Must be one of: {', '.join(sorted(ALLOWED_ROLES))}")

    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == req.email))
    target_user = res.scalars().first()
    if not target_user:
        raise HTTPException(404, "User not found with this email")

    if target_user.id == dev.id:
        raise HTTPException(400, "You cannot invite yourself")

    res = await db.execute(
        select(TeamMember).where(
            TeamMember.developer_id == dev.id,
            TeamMember.user_id == target_user.id,
        )
    )
    if res.scalars().first():
        raise HTTPException(400, "User is already in your team")

    # Check team size limit
    team_count = await db.execute(select(TeamMember).where(TeamMember.developer_id == dev.id))
    current_members = len(team_count.scalars().all())
    await check_limit(dev, "max_staff", current_members, db, plan)

    new_member = TeamMember(
        developer_id=dev.id,
        user_id=target_user.id,
        role=req.role,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return TeamMemberResponse(
        id=new_member.id,
        username=target_user.username,
        email=target_user.email,
        role=new_member.role,
        created_at=new_member.created_at,
    )


@router.put("/{member_id}/role", response_model=TeamMemberResponse)
@db_transaction
async def update_member_role(
    member_id: int,
    body: RoleUpdateRequest,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Invalid role '{body.role}'")

    res = await db.execute(
        select(TeamMember).where(
            TeamMember.id == member_id,
            TeamMember.developer_id == dev.id,
        )
    )
    tm = res.scalars().first()
    if not tm:
        raise HTTPException(404, "Team member not found")

    tm.role = body.role
    await db.commit()
    await db.refresh(tm)

    user_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == tm.user_id))
    user = user_res.scalars().first()

    return TeamMemberResponse(
        id=tm.id,
        username=user.username if user else "unknown",
        email=user.email if user else "",
        role=tm.role,
        created_at=tm.created_at,
    )


@router.delete("/{member_id}")
@db_transaction
async def remove_member(
    member_id: int,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(TeamMember).where(
            TeamMember.id == member_id,
            TeamMember.developer_id == dev.id,
        )
    )
    tm = res.scalars().first()
    if not tm:
        raise HTTPException(404, "Team member not found")

    if tm.role in ADMIN_ROLES:
        admin_count = await db.execute(
            select(TeamMember).where(
                TeamMember.developer_id == dev.id,
                TeamMember.role.in_(ADMIN_ROLES),
            )
        )
        if len(admin_count.scalars().all()) <= 1:
            raise HTTPException(400, "Cannot remove the last admin")

    await db.delete(tm)
    await db.commit()
    return {"status": "success", "message": "Member removed from team"}
