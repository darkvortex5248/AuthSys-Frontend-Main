from fastapi import APIRouter, Request, Header
from nacl.signing import VerifyKey
import json

from core.database import AsyncSessionLocal
from sqlalchemy.future import select
from models.domain import BotConfig
from services.bot_service import BotService

router = APIRouter(prefix="/api/v1/bots/discord", tags=["Bots"])

def get_settings(config) -> dict:
    return config.settings or {}

def get_prefix(config) -> str:
    return get_settings(config).get("key_prefix", "AUTH")

@router.post("/interactions")
async def discord_interactions(
    request: Request,
    x_signature_ed25519: str = Header(None),
    x_signature_timestamp: str = Header(None)
):
    body = await request.body()
    data = json.loads(body)

    # PING
    if data.get("type") == 1:
        return {"type": 1}

    # SLASH COMMAND
    if data.get("type") == 2:
        command_data = data.get("data", {})
        command_name = command_data.get("name")
        discord_app_id = data.get("application_id")

        async with AsyncSessionLocal() as db:
            res = await db.execute(select(BotConfig).where(
                BotConfig.bot_type == "discord",
                BotConfig.discord_app_id == discord_app_id,
                BotConfig.is_active == True
            ))
            bot = res.scalars().first()
            if not bot:
                return {"type": 4, "data": {"content": "Bot not configured in AuthSys."}}

            # Verify signature if public key is set
            if bot.discord_public_key and x_signature_ed25519 and x_signature_timestamp:
                try:
                    verify_key = VerifyKey(bytes.fromhex(bot.discord_public_key))
                    verify_key.verify(
                        f"{x_signature_timestamp}{body.decode()}",
                        bytes.fromhex(x_signature_ed25519)
                    )
                except Exception:
                    return {"type": 4, "data": {"content": "Invalid signature"}}

            options = {o["name"]: o["value"] for o in command_data.get("options", [])}

            if command_name == "genkey":
                days = int(options.get("days", 1))
                note = options.get("note", "Discord Webhook")
                if days < 1:
                    return {"type": 4, "data": {"content": "Days must be at least 1."}}
                key_val = await BotService.generate_key(
                    db, bot.app_id, bot.developer_id,
                    key_type="time", duration=days, note=note,
                    prefix=get_prefix(bot)
                )
                if not key_val:
                    return {"type": 4, "data": {"content": "Failed to generate key."}}
                return {"type": 4, "data": {"content": f"Key Generated: `{key_val}` ({days} days)"}}

            if command_name == "keyinfo":
                key = options.get("key", "")
                info = await BotService.key_info(db, key, bot.developer_id)
                return {"type": 4, "data": {"content": info or "Key not found."}}

            if command_name == "pausekey":
                key = options.get("key", "")
                msg = await BotService.pause_key(db, key, bot.developer_id)
                return {"type": 4, "data": {"content": msg or "Key not found."}}

            if command_name == "resumekey":
                key = options.get("key", "")
                msg = await BotService.resume_key(db, key, bot.developer_id)
                return {"type": 4, "data": {"content": msg or "Key not found."}}

            if command_name == "delkey":
                key = options.get("key", "")
                msg = await BotService.delete_key(db, key, bot.developer_id)
                return {"type": 4, "data": {"content": msg or "Key not found."}}

    return {"type": 4, "data": {"content": "Unknown command"}}
