from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List

from core.database import get_db
from core.deps import get_current_developer
from core.limiter import limiter
from models.domain import DeveloperAccount
from services.ai_config import get_ai_runtime_config
from services.ai_runtime import SYSTEM_PROMPT, generate_chat_response
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.get("/config")
async def get_public_ai_config(db: AsyncSession = Depends(get_db)):
    """Lightweight config for the chat widget (no secrets)."""
    cfg = await get_ai_runtime_config(db)
    return {
        "enabled": cfg["enabled"],
        "model": cfg["model"],
        "provider": cfg["provider"],
    }


@router.post("/chat")
@limiter.limit("20/minute")
async def ai_chat(
    request: Request,
    req: ChatRequest,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    cfg = await get_ai_runtime_config(db)

    if not cfg["enabled"]:
        raise HTTPException(status_code=503, detail="AI assistant is disabled by administrator.")

    if not cfg["api_key"]:
        raise HTTPException(
            status_code=503,
            detail="AI API key not configured. Admin can set it under Super Admin → AI Control.",
        )

    try:
        text = await generate_chat_response(
            provider=cfg["provider"],
            api_key=cfg["api_key"],
            model_name=cfg["model"],
            messages=[m.model_dump() for m in req.messages],
            system_instruction=SYSTEM_PROMPT,
            base_url=cfg.get("base_url", ""),
        )
        return {"response": text, "model": cfg["model"], "provider": cfg["provider"]}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"response": "AI rate limit reached. Please wait a moment and try again.", "model": cfg["model"]}
        if "API_KEY_INVALID" in error_msg:
            raise HTTPException(status_code=503, detail="Invalid AI API key. Update it in the admin panel.")
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")
