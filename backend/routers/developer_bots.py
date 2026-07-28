from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import BotConfig, DeveloperAccount, Application
from services.plan_enforcer import require_feature

router = APIRouter(prefix="/api/v1/developer/bots", tags=["Bots"])

class BotConfigResponse(BaseModel):
    id: int
    app_id: Optional[int]
    bot_type: str
    bot_token: str
    discord_app_id: Optional[str] = None
    discord_public_key: Optional[str] = None
    is_active: bool
    settings: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

    @staticmethod
    def mask_token(token: str) -> str:
        if len(token) > 8:
            return token[:4] + "****" + token[-4:]
        return "****"

class BotCreateRequest(BaseModel):
    app_id: Optional[int] = None
    bot_type: str
    bot_token: str
    discord_app_id: Optional[str] = None
    discord_public_key: Optional[str] = None
    settings: Optional[dict] = None

@router.get("", response_model=List[BotConfigResponse])
async def get_bots(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.developer_id == dev.id))
    bots = res.scalars().all()
    for b in bots:
        b.bot_token = BotConfigResponse.mask_token(b.bot_token)
    return bots

@router.post("/config", response_model=BotConfigResponse)
@db_transaction
async def configure_bot(req: BotCreateRequest, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    if req.bot_type == "discord":
        await require_feature(dev, "has_discord_integration", db)
    elif req.bot_type == "telegram":
        await require_feature(dev, "has_telegram_integration", db)
    else:
        await require_feature(dev, "has_custom_bot", db)

    if req.app_id:
        app_res = await db.execute(select(Application).where(Application.id == req.app_id, Application.developer_id == dev.id))
        if not app_res.scalars().first():
            raise HTTPException(status_code=404, detail="Application not found")

    res = await db.execute(select(BotConfig).where(BotConfig.developer_id == dev.id, BotConfig.bot_type == req.bot_type, BotConfig.app_id == req.app_id))
    existing = res.scalars().first()

    if existing:
        existing.bot_token = req.bot_token
        existing.discord_app_id = req.discord_app_id
        existing.discord_public_key = req.discord_public_key
        existing.is_active = True
        if req.settings is not None:
            existing.settings = req.settings
        new_bot = existing
    else:
        new_bot = BotConfig(
            developer_id=dev.id,
            app_id=req.app_id,
            bot_type=req.bot_type,
            bot_token=req.bot_token,
            discord_app_id=req.discord_app_id,
            discord_public_key=req.discord_public_key,
            settings=req.settings,
        )
        db.add(new_bot)

    await db.commit()
    await db.refresh(new_bot)

    new_bot.bot_token = BotConfigResponse.mask_token(new_bot.bot_token)
    return new_bot

@router.patch("/{bot_id}/toggle")
@db_transaction
async def toggle_bot(bot_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.id == bot_id, BotConfig.developer_id == dev.id))
    bot = res.scalars().first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot config not found")
    bot.is_active = not bot.is_active
    await db.commit()
    return {"status": "success", "is_active": bot.is_active}

@router.delete("/{bot_id}")
@db_transaction
async def delete_bot(bot_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.id == bot_id, BotConfig.developer_id == dev.id))
    bot = res.scalars().first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot config not found")

    await db.delete(bot)
    await db.commit()
    return {"status": "success"}
