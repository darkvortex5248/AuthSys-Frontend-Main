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


def _normalize_provider(provider: str) -> str:
    """Map legacy/admin provider labels onto the canonical PROVIDER_CATALOG keys."""
    p = (provider or "").strip().lower()
    # Legacy aliases used by older admin UI rows / older config.
    aliases = {
        "gemini": "google",
        "claude": "anthropic",
        "google": "google",
        "openai": "openai",
        "anthropic": "anthropic",
        "groq": "groq",
        "openrouter": "openrouter",
        "custom": "custom",
    }
    return aliases.get(p, p)


async def _load_active_provider_config(db: AsyncSession):
    """Highest-priority active AIProviderConfig row managed by the admin UI."""
    from models.domain import AIProviderConfig

    res = await db.execute(
        select(AIProviderConfig)
        .where(AIProviderConfig.is_active == True)  # noqa: E712
        .order_by(AIProviderConfig.priority.asc())
        .limit(1)
    )
    return res.scalar_one_or_none()


from core.security import decrypt_field

async def get_ai_runtime_config(db: AsyncSession) -> dict:
    stored = await _load_settings_map(db)
    enabled = (stored.get("ai_enabled") or "true").lower() == "true"

    # Resolve from the admin-managed AIProviderConfig row first (this is what the
    # Super Admin -> AI Control page writes), then fall back to SystemSetting,
    # then to .env. Previously the order was reversed, so admin-configured Groq /
    # OpenRouter / Anthropic keys were silently ignored.
    provider = ""
    model = ""
    api_key = ""
    base_url = ""

    pc = await _load_active_provider_config(db)
    if pc and pc.api_key_encrypted:
        api_key = decrypt_field(pc.api_key_encrypted)
        provider = pc.provider or ""
        model = pc.model_name or ""
        if pc.settings and pc.settings.get("api_endpoint"):
            base_url = pc.settings["api_endpoint"]

    # Fall back to SystemSetting keys when the provider-config row is missing/empty.
    if not api_key:
        provider = (stored.get("ai_provider") or "").strip()
        model = (stored.get("ai_model") or "").strip()
        api_key = (stored.get("ai_api_key") or "").strip()
        base_url = (stored.get("ai_base_url") or "").strip()

    # Final fallback to environment variables.
    if not api_key:
        api_key = _env_fallback_key(_normalize_provider(provider))

    provider = _normalize_provider(provider) or "google"
    if provider not in PROVIDER_CATALOG:
        provider = "google"
    if not model:
        model = PROVIDER_CATALOG[provider]["default_model"]
    model = model.strip()

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
