"""Resolve AI provider settings from DB (admin panel) with .env fallback."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.config import settings
from models.domain import SystemSetting

AI_KEYS = (
    "ai_provider",
    "ai_model",
    "ai_api_key",
    "ai_enabled",
)

DEFAULT_MODEL = "gemini-2.0-flash"
SUPPORTED_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-2.5-flash-preview-05-20",
]


async def _load_settings_map(db: AsyncSession) -> dict[str, str]:
    res = await db.execute(select(SystemSetting).where(SystemSetting.key.in_(AI_KEYS)))
    return {row.key: (row.value or "") for row in res.scalars().all()}


def mask_api_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "••••••••"
    return f"{'•' * (len(key) - 4)}{key[-4:]}"


async def get_ai_runtime_config(db: AsyncSession) -> dict:
    """Config used when generating AI responses."""
    stored = await _load_settings_map(db)
    enabled = (stored.get("ai_enabled") or "true").lower() == "true"
    provider = (stored.get("ai_provider") or "google").strip().lower()
    model = (stored.get("ai_model") or DEFAULT_MODEL).strip()
    api_key = (stored.get("ai_api_key") or settings.GEMINI_API_KEY or "").strip()

    if model.startswith("models/"):
        model = model.replace("models/", "", 1)

    return {
        "enabled": enabled,
        "provider": provider,
        "model": model,
        "api_key": api_key,
    }


async def get_ai_admin_view(db: AsyncSession) -> dict:
    """Safe view for admin UI (masked key)."""
    runtime = await get_ai_runtime_config(db)
    key = runtime["api_key"]
    return {
        "provider": runtime["provider"],
        "model": runtime["model"],
        "enabled": runtime["enabled"],
        "api_key_set": bool(key),
        "api_key_preview": mask_api_key(key),
        "supported_models": SUPPORTED_MODELS,
    }
