"""Resolve AI provider settings from DB (admin panel) with .env fallback."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.config import settings
from models.domain import SystemSetting
from services.ai_providers import PROVIDER_CATALOG, catalog_for_admin, default_models_for

AI_KEYS = (
    "ai_provider",
    "ai_model",
    "ai_api_key",
    "ai_base_url",
    "ai_enabled",
)

DEFAULT_MODEL = "gemini-2.0-flash"


async def _load_settings_map(db: AsyncSession) -> dict[str, str]:
    res = await db.execute(select(SystemSetting).where(SystemSetting.key.in_(AI_KEYS)))
    return {row.key: (row.value or "") for row in res.scalars().all()}


def mask_api_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "••••••••"
    return f"{'•' * (len(key) - 4)}{key[-4:]}"


def _env_fallback_key(provider: str) -> str:
    p = (provider or "google").lower()
    if p == "openai":
        return getattr(settings, "OPENAI_API_KEY", "") or ""
    if p == "anthropic":
        return getattr(settings, "ANTHROPIC_API_KEY", "") or ""
    if p == "groq":
        return getattr(settings, "GROQ_API_KEY", "") or ""
    if p == "openrouter":
        return getattr(settings, "OPENROUTER_API_KEY", "") or ""
    return settings.GEMINI_API_KEY or ""


async def get_ai_runtime_config(db: AsyncSession) -> dict:
    stored = await _load_settings_map(db)
    enabled = (stored.get("ai_enabled") or "true").lower() == "true"
    provider = (stored.get("ai_provider") or "google").strip().lower()
    if provider not in PROVIDER_CATALOG:
        provider = "google"
    model = (stored.get("ai_model") or PROVIDER_CATALOG[provider]["default_model"]).strip()
    api_key = (stored.get("ai_api_key") or _env_fallback_key(provider)).strip()
    base_url = (stored.get("ai_base_url") or "").strip()

    if model.startswith("models/"):
        model = model.replace("models/", "", 1)

    return {
        "enabled": enabled,
        "provider": provider,
        "model": model,
        "api_key": api_key,
        "base_url": base_url,
    }


async def get_ai_admin_view(db: AsyncSession) -> dict:
    runtime = await get_ai_runtime_config(db)
    key = runtime["api_key"]
    provider = runtime["provider"]
    return {
        "provider": provider,
        "model": runtime["model"],
        "enabled": runtime["enabled"],
        "api_key_set": bool(key),
        "api_key_preview": mask_api_key(key),
        "base_url": runtime["base_url"],
        "supported_models": default_models_for(provider),
        "providers": catalog_for_admin(),
    }
