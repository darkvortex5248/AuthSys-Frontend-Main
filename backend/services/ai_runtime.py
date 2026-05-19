"""Backward-compatible re-exports — use services.ai_providers."""

from services.ai_providers import (
    SYSTEM_PROMPT,
    catalog_for_admin,
    default_models_for,
    generate_chat_response,
    list_live_models as list_available_models,
)
