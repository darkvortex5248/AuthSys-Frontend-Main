"""Ensure default plans, settings, and tables/columns exist (safe to call on every startup)."""

from __future__ import annotations

import logging
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base
from models.domain import * # Import all models to register with Base.metadata

logger = logging.getLogger(__name__)

DEFAULT_PLANS = [
    {
        "name": "Free",
        "price_monthly": 0,
        "price_yearly": 0,
        "max_apps": 2,
        "max_users_per_app": 50,
        "max_keys_per_month": 100,
        "features_json": ["Basic Auth", "HWID Lock", "License Keys"],
        "ai_agent_access": False,
    },
    {
        "name": "Tester",
        "price_monthly": 0,
        "price_yearly": 0,
        "max_apps": 5,
        "max_users_per_app": 500,
        "max_keys_per_month": 1000,
        "features_json": ["All Auth Methods", "Token System", "Hash Checks", "2FA"],
        "ai_agent_access": False,
    },
    {
        "name": "Developer",
        "price_monthly": 2999,
        "price_yearly": 29990,
        "max_apps": 20,
        "max_users_per_app": 10000,
        "max_keys_per_month": 50000,
        "features_json": ["Team Management", "Customer Panel", "Functions", "Webhooks"],
        "ai_agent_access": True,
    },
    {
        "name": "Seller",
        "price_monthly": 4999,
        "price_yearly": 49990,
        "max_apps": 999999,
        "max_users_per_app": 999999,
        "max_keys_per_month": 999999,
        "features_json": ["Chatrooms", "Discord Bot", "Telegram Bot", "Seller API"],
        "ai_agent_access": True,
    },
    {
        "name": "Enterprise",
        "price_monthly": 9999,
        "price_yearly": 99990,
        "max_apps": 999999,
        "max_users_per_app": 999999,
        "max_keys_per_month": 999999,
        "features_json": [
            "Team Management",
            "Customer Panel",
            "Functions",
            "Chatrooms",
            "Discord Bot",
            "Telegram Bot",
            "Seller API",
            "Priority AI",
            "White Label",
            "Dedicated Support",
        ],
        "ai_agent_access": True,
    },
]

DEFAULT_SETTINGS: dict[str, tuple[str, str]] = {
    "system_mode": ("live", "Platform operational mode"),
    "maintenance_mode": ("false", "Legacy maintenance flag"),
    "platform_name": ("AuthSys", "Public platform name"),
    "platform_logo": ("/logo.png", "Logo URL"),
    "platform_favicon": ("/favicon.ico", "Favicon URL"),
    "watch_demo_url": ("https://youtube.com/watch?v=demo", "Hero demo video URL"),
    "landing_paragraph": (
        "The modern standard for software authentication, license management, and AI-powered threat protection.",
        "Landing hero text",
    ),
    "contact_email": ("support@authsys.com", "Support email"),
    "contact_phone": ("+1 (800) 123-4567", "Support phone"),
    "contact_address": ("San Francisco, CA", "Office address"),
    "strict_hwid": ("false", "Strict HWID enforcement"),
    "ip_risk_scoring": ("false", "IP risk scoring"),
    "developer_2fa": ("false", "Mandatory developer 2FA"),
    "rate_limiting": ("true", "API rate limiting"),
    "ai_provider": ("google", "AI provider id"),
    "ai_model": ("gemini-2.0-flash", "AI model id"),
    "ai_enabled": ("true", "AI assistant enabled"),
}


async def ensure_database_schema(db: AsyncSession) -> None:
    """Ensure all tables exist and all required columns are present in the database."""
    try:
        logger.info("Schema migration: Initializing/checking tables...")
        async with db.bind.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Schema migration: Tables check complete.")
    except Exception as e:
        logger.warning(f"Schema migration: Error ensuring database tables: {e}")

    # Columns to check and add dynamically if missing
    columns_to_ensure = [
        (
            "end_users",
            "is_shadow",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT FALSE",
            "UPDATE end_users SET is_shadow = FALSE WHERE is_shadow IS NULL"
        ),
        (
            "applications",
            "maintenance_mode",
            "ALTER TABLE applications ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE",
            "UPDATE applications SET maintenance_mode = FALSE WHERE maintenance_mode IS NULL"
        ),
        (
            "applications",
            "developer_lock",
            "ALTER TABLE applications ADD COLUMN IF NOT EXISTS developer_lock BOOLEAN DEFAULT FALSE",
            "UPDATE applications SET developer_lock = FALSE WHERE developer_lock IS NULL"
        ),
        (
            "webhooks_log",
            "endpoint_id",
            "ALTER TABLE webhooks_log ADD COLUMN IF NOT EXISTS endpoint_id INTEGER",
            None
        )
    ]
    
    for table, col, alter_sql, update_sql in columns_to_ensure:
        try:
            res = await db.execute(text(
                f"SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '{table}' AND column_name = '{col}')"
            ))
            exists = res.scalar()
            
            if not exists:
                logger.info(f"Schema migration: Adding missing column '{col}' to table '{table}'")
                await db.execute(text(alter_sql))
                if update_sql:
                    await db.execute(text(update_sql))
                await db.commit()
                logger.info(f"Schema migration: Column '{col}' added and populated successfully.")
            else:
                if update_sql:
                    await db.execute(text(update_sql))
                    await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"Schema migration failed for {table}.{col}: {e}")


async def ensure_default_plans(db: AsyncSession) -> int:
    res = await db.execute(select(SubscriptionPlan))
    existing = {p.name.lower(): p for p in res.scalars().all()}
    created = 0
    for data in DEFAULT_PLANS:
        key = data["name"].lower()
        if key not in existing:
            db.add(SubscriptionPlan(**data))
            created += 1
        elif key == "enterprise":
            row = existing[key]
            row.features_json = data["features_json"]
            row.ai_agent_access = True
            row.max_apps = data["max_apps"]
            row.max_users_per_app = data["max_users_per_app"]
            row.max_keys_per_month = data["max_keys_per_month"]
    if created:
        await db.commit()
    else:
        await db.commit()
    return created


async def ensure_default_settings(db: AsyncSession) -> int:
    res = await db.execute(select(SystemSetting))
    existing = {s.key for s in res.scalars().all()}
    created = 0
    for key, (value, desc) in DEFAULT_SETTINGS.items():
        if key not in existing:
            db.add(SystemSetting(key=key, value=value, description=desc))
            created += 1
    if created:
        await db.commit()
    return created


async def run_bootstrap(db: AsyncSession) -> dict:
    # 1. First ensure database schema and tables are 100% correct
    await ensure_database_schema(db)
    
    # 2. Seed plans and settings
    plans = await ensure_default_plans(db)
    settings = await ensure_default_settings(db)
    return {"plans_created": plans, "settings_created": settings}
