from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.deps import get_current_developer
from models.domain import TeamMember, DeveloperAccount

router = APIRouter(prefix="/api/v1/developer/team", tags=["Team"])

class TeamMemberResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

class InviteRequest(BaseModel):
    email: str
    role: str = "support"

@router.get("", response_model=List[TeamMemberResponse])
async def get_team(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
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
            created_at=tm.created_at
        ))
    return members

@router.post("/invite", response_model=TeamMemberResponse)
async def invite_member(req: InviteRequest, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Find user by email
    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == req.email))
    target_user = res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with this email")
    
    if target_user.id == dev.id:
        raise HTTPException(status_code=400, detail="You cannot invite yourself")
    
    # Check if already in team
    res = await db.execute(select(TeamMember).where(TeamMember.developer_id == dev.id, TeamMember.user_id == target_user.id))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="User is already in your team")
    
    new_member = TeamMember(
        developer_id=dev.id,
        user_id=target_user.id,
        role=req.role
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    
    return TeamMemberResponse(
        id=new_member.id,
        username=target_user.username,
        email=target_user.email,
        role=new_member.role,
        created_at=new_member.created_at
    )

@router.delete("/{member_id}")
async def remove_member(member_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(TeamMember).where(TeamMember.id == member_id, TeamMember.developer_id == dev.id))
    tm = res.scalars().first()
    if not tm:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    await db.delete(tm)
    await db.commit()
    return {"status": "success", "message": "Member removed from team"}
