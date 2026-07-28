from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import ChatRoom, ChatMessage, Application, DeveloperAccount, EndUser
from services.plan_enforcer import require_feature, check_limit

router = APIRouter(prefix="/api/v1/developer/chatrooms", tags=["Chatrooms"])

class ChatRoomResponse(BaseModel):
    id: int
    app_id: int
    name: str
    is_active: bool
    created_at: datetime

class ChatRoomCreate(BaseModel):
    app_id: int
    name: str

class MessageResponse(BaseModel):
    id: int
    username: str
    message: str
    created_at: datetime

@router.get("", response_model=List[ChatRoomResponse])
async def get_rooms(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ChatRoom).join(Application).where(Application.developer_id == dev.id))
    return res.scalars().all()

@router.post("", response_model=ChatRoomResponse)
@db_transaction
async def create_room(req: ChatRoomCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    plan = await require_feature(dev, "has_live_chat", db)
    # Verify app ownership
    app_res = await db.execute(select(Application).where(Application.id == req.app_id, Application.developer_id == dev.id))
    if not app_res.scalars().first():
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check chatroom limit
    room_count = await db.execute(select(ChatRoom).where(ChatRoom.app_id == req.app_id))
    current_rooms = len(room_count.scalars().all())
    await check_limit(dev, "max_chatrooms", current_rooms, db, plan)
        
    new_room = ChatRoom(app_id=req.app_id, name=req.name)
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    return new_room

@router.get("/{room_id}/messages", response_model=List[MessageResponse])
async def get_messages(room_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Simple message retrieval
    res = await db.execute(
        select(ChatMessage, EndUser.username)
        .join(EndUser, ChatMessage.user_id == EndUser.id)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
    )
    messages = []
    for row in res.all():
        msg, username = row
        messages.append(MessageResponse(id=msg.id, username=username, message=msg.message, created_at=msg.created_at))
    return messages
