from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.deps import get_current_developer
from models.domain import BotConfig, DeveloperAccount, Application
from services.bot_manager import manager as bot_manager
import asyncio

router = APIRouter(prefix="/api/v1/developer/bots", tags=["Bots"])

class BotConfigResponse(BaseModel):
    id: int
    app_id: Optional[int]
    bot_type: str
    bot_token: str
    discord_app_id: Optional[str] = None
    discord_public_key: Optional[str] = None
    is_active: bool
    created_at: datetime

class BotCreateRequest(BaseModel):
    app_id: Optional[int] = None
    bot_type: str # discord, telegram
    bot_token: str
    discord_app_id: Optional[str] = None
    discord_public_key: Optional[str] = None

@router.get("", response_model=List[BotConfigResponse])
async def get_bots(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.developer_id == dev.id))
    return res.scalars().all()

@router.post("/config", response_model=BotConfigResponse)
async def configure_bot(req: BotCreateRequest, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Check if app exists and owned by dev
    if req.app_id:
        app_res = await db.execute(select(Application).where(Application.id == req.app_id, Application.developer_id == dev.id))
        if not app_res.scalars().first():
            raise HTTPException(status_code=404, detail="Application not found")

    # Update or Create
    res = await db.execute(select(BotConfig).where(BotConfig.developer_id == dev.id, BotConfig.bot_type == req.bot_type, BotConfig.app_id == req.app_id))
    existing = res.scalars().first()
    
    if existing:
        existing.bot_token = req.bot_token
        existing.discord_app_id = req.discord_app_id
        existing.discord_public_key = req.discord_public_key
        existing.is_active = True
        new_bot = existing
    else:
        new_bot = BotConfig(
            developer_id=dev.id,
            app_id=req.app_id,
            bot_type=req.bot_type,
            bot_token=req.bot_token,
            discord_app_id=req.discord_app_id,
            discord_public_key=req.discord_public_key
        )
        db.add(new_bot)
    
    await db.commit()
    await db.refresh(new_bot)
    
    # Start or Restart this bot automatically in the background
    if new_bot.bot_type == "discord":
        asyncio.create_task(bot_manager.run_discord_bot(new_bot))
    elif new_bot.bot_type == "telegram":
        asyncio.create_task(bot_manager.run_telegram_bot(new_bot))
    
    return new_bot

@router.delete("/{bot_id}")
async def delete_bot(bot_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.id == bot_id, BotConfig.developer_id == dev.id))
    bot = res.scalars().first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot config not found")
    
    await db.delete(bot)
    await db.commit()
    return {"status": "success"}
