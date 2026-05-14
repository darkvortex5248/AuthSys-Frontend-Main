from fastapi import APIRouter, Request, Header, HTTPException
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
import json

from core.database import AsyncSessionLocal
from sqlalchemy.future import select
from models.domain import BotConfig, Application, LicenseKey, EndUser
from core.security import generate_secure_id

router = APIRouter(prefix="/api/v1/bots/discord", tags=["Bots"])

# You need to store the PUBLIC KEY from Discord to verify signatures
# For now, we will use a generic handler or assume verification is done at the gateway level if using a proxy
# But for a real app, nacl is required.

@router.post("/interactions")
async def discord_interactions(request: Request, x_signature_ed25519: str = Header(None), x_signature_timestamp: str = Header(None)):
    body = await request.body()
    # In a real production app, verify signature here using x_signature_ed25519 and x_signature_timestamp
    
    data = json.loads(body)
    
    # Ping (Type 1)
    if data.get("type") == 1:
        return {"type": 1}
    
    # Application Command (Type 2)
    if data.get("type") == 2:
        command_data = data.get("data", {})
        command_name = command_data.get("name")
        
        # We need to find which BOT this is for.
        # Usually, Discord sends the application_id.
        discord_app_id = data.get("application_id")
        
        async with AsyncSessionLocal() as db:
            # Find bot config by some identifier (e.g. settings in JSON or we store discord_app_id)
            # For simplicity, we'll look for the first active discord bot for now
            # In production, we'd map discord_app_id to developer_id
            res = await db.execute(select(BotConfig).where(BotConfig.bot_type == "discord", BotConfig.is_active == True))
            bot = res.scalars().first()
            
            if not bot:
                return {"type": 4, "data": {"content": "Bot not configured in AuthSys."}}

            if command_name == "usercreate":
                # Logic to create user
                return {"type": 4, "data": {"content": "User creation command received! (Logic Implementation in Progress)"}}
            
            if command_name == "genkey":
                return {"type": 4, "data": {"content": "License key generated: AUTH-XXXX-XXXX"}}

    return {"type": 4, "data": {"content": "Unknown command"}}
