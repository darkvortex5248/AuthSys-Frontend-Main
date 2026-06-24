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
        "description": "Essential auth, HWID lock, license keys, 2 apps",
        "price_monthly": 0,
        "price_yearly": 0,
        "discount": 0,
        "badge_text": "",
        "badge_color": "",
        "is_recommended": False,
        "button_text": "Get Started",
        "button_color": "var(--primary)",
        "icon": "explore",
        "sort_order": 1,
        "is_active": True,
        "max_apps": 2,
        "max_licenses": 50,
        "max_users_per_app": 50,
        "max_keys_per_month": 100,
        "max_variables": 40,
        "max_logs": 200,
        "max_hashes": 2,
        "max_staff": 0,
        "max_chatrooms": 0,
        "features_json": ["Basic Auth", "HWID Lock", "License Keys"],
        "ai_agent_access": False,
        "audit_log_limit": 500,
        "has_ip_tracking": False,
        "has_location_tracking": False,
        "has_user_panel": False,
        "has_staff_management": False,
        "has_discord_integration": False,
        "has_telegram_integration": False,
        "has_api_access": False,
        "has_custom_domain": False,
        "has_live_chat": False,
        "has_audit_logs": False,
        "has_webhooks": False,
        "has_white_label": False,
        "has_priority_support": False,
        "has_ssl": False,
        "has_global_chat": False,
        "has_custom_bot": False,
        "has_behavioral_threat_intel": False,
        "has_version_whitelist": True,
    },
    {
        "name": "Developer",
        "description": "AI agent, webhooks, team mgmt, IP tracking, user panel",
        "price_monthly": 99,
        "price_yearly": 999,
        "discount": 16,
        "badge_text": "",
        "badge_color": "",
        "is_recommended": True,
        "button_text": "Choose Plan",
        "button_color": "#3b82f6",
        "icon": "workspace_premium",
        "sort_order": 2,
        "is_active": True,
        "max_apps": 20,
        "max_licenses": 10000,
        "max_users_per_app": 10000,
        "max_keys_per_month": 50000,
        "max_variables": 999999,
        "max_logs": 5000,
        "max_hashes": 20,
        "max_staff": 10,
        "max_chatrooms": 0,
        "features_json": ["Team Management", "Customer Panel", "Functions", "Webhooks"],
        "ai_agent_access": True,
        "audit_log_limit": 10000,
        "has_ip_tracking": True,
        "has_location_tracking": True,
        "has_user_panel": True,
        "has_staff_management": True,
        "has_discord_integration": False,
        "has_telegram_integration": False,
        "has_api_access": False,
        "has_custom_domain": False,
        "has_live_chat": False,
        "has_audit_logs": True,
        "has_webhooks": True,
        "has_white_label": False,
        "has_priority_support": False,
        "has_ssl": False,
        "has_global_chat": False,
        "has_custom_bot": False,
        "has_behavioral_threat_intel": False,
        "has_version_whitelist": True,
    },
    {
        "name": "Seller",
        "description": "Chatrooms, Discord/Telegram bots, seller API, unlimited",
        "price_monthly": 199,
        "price_yearly": 1999,
        "discount": 16,
        "badge_text": "BEST VALUE",
        "badge_color": "#10b981",
        "is_recommended": False,
        "button_text": "Choose Plan",
        "button_color": "var(--primary)",
        "icon": "rocket",
        "sort_order": 3,
        "is_active": True,
        "max_apps": 999999,
        "max_licenses": 999999,
        "max_users_per_app": 999999,
        "max_keys_per_month": 999999,
        "max_variables": 999999,
        "max_logs": 999999,
        "max_hashes": 999999,
        "max_staff": 999999,
        "max_chatrooms": 999999,
        "features_json": ["Chatrooms", "Discord Bot", "Telegram Bot", "Seller API"],
        "ai_agent_access": True,
        "audit_log_limit": 50000,
        "has_ip_tracking": True,
        "has_location_tracking": True,
        "has_user_panel": True,
        "has_staff_management": True,
        "has_discord_integration": True,
        "has_telegram_integration": True,
        "has_api_access": True,
        "has_custom_domain": False,
        "has_live_chat": True,
        "has_audit_logs": True,
        "has_webhooks": True,
        "has_white_label": False,
        "has_priority_support": False,
        "has_ssl": False,
        "has_global_chat": False,
        "has_custom_bot": False,
        "has_behavioral_threat_intel": False,
        "has_version_whitelist": True,
    },
    {
        "name": "Enterprise",
        "description": "White-label, custom domain, SSL, dedicated priority support",
        "price_monthly": 299,
        "price_yearly": 2999,
        "discount": 16,
        "badge_text": "",
        "badge_color": "",
        "is_recommended": False,
        "button_text": "Contact Sales",
        "button_color": "var(--primary)",
        "icon": "diamond",
        "sort_order": 4,
        "is_active": True,
        "max_apps": 999999,
        "max_licenses": 999999,
        "max_users_per_app": 999999,
        "max_keys_per_month": 999999,
        "max_variables": 999999,
        "max_logs": 999999,
        "max_hashes": 999999,
        "max_staff": 999999,
        "max_chatrooms": 999999,
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
        "audit_log_limit": 100000,
        "has_ip_tracking": True,
        "has_location_tracking": True,
        "has_user_panel": True,
        "has_staff_management": True,
        "has_discord_integration": True,
        "has_telegram_integration": True,
        "has_api_access": True,
        "has_custom_domain": True,
        "has_live_chat": True,
        "has_audit_logs": True,
        "has_webhooks": True,
        "has_white_label": True,
        "has_priority_support": True,
        "has_ssl": True,
        "has_global_chat": True,
        "has_custom_bot": True,
        "has_behavioral_threat_intel": True,
        "has_version_whitelist": True,
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

    columns_to_ensure = [
        (
            "end_users",
            "is_shadow",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT FALSE",
            "UPDATE end_users SET is_shadow = FALSE WHERE is_shadow IS NULL"
        ),
        (
            "applications",
            "owner_id",
            "ALTER TABLE applications ADD COLUMN IF NOT EXISTS owner_id VARCHAR UNIQUE",
            None
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
        ),
        (
            "payments",
            "payment_method",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR",
            None
        ),
        (
            "payments",
            "wallet_number",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_number VARCHAR",
            None
        ),
        (
            "payments",
            "transaction_id",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR",
            None
        ),
        (
            "subscription_plans",
            "features_json",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features_json JSON",
            None
        ),
        (
            "subscription_plans",
            "ai_agent_access",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ai_agent_access BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET ai_agent_access = FALSE WHERE ai_agent_access IS NULL"
        ),
        (
            "subscription_plans",
            "description",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description VARCHAR DEFAULT ''",
            "UPDATE subscription_plans SET description = '' WHERE description IS NULL"
        ),
        (
            "subscription_plans",
            "discount",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0",
            "UPDATE subscription_plans SET discount = 0 WHERE discount IS NULL"
        ),
        (
            "subscription_plans",
            "badge_text",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS badge_text VARCHAR DEFAULT ''",
            "UPDATE subscription_plans SET badge_text = '' WHERE badge_text IS NULL"
        ),
        (
            "subscription_plans",
            "badge_color",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS badge_color VARCHAR DEFAULT ''",
            "UPDATE subscription_plans SET badge_color = '' WHERE badge_color IS NULL"
        ),
        (
            "subscription_plans",
            "is_recommended",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET is_recommended = FALSE WHERE is_recommended IS NULL"
        ),
        (
            "subscription_plans",
            "button_text",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS button_text VARCHAR DEFAULT 'Choose Plan'",
            "UPDATE subscription_plans SET button_text = 'Choose Plan' WHERE button_text IS NULL"
        ),
        (
            "subscription_plans",
            "button_color",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS button_color VARCHAR DEFAULT 'var(--primary)'",
            "UPDATE subscription_plans SET button_color = 'var(--primary)' WHERE button_color IS NULL"
        ),
        (
            "subscription_plans",
            "icon",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT 'card_membership'",
            "UPDATE subscription_plans SET icon = 'card_membership' WHERE icon IS NULL"
        ),
        (
            "subscription_plans",
            "sort_order",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0",
            "UPDATE subscription_plans SET sort_order = 0 WHERE sort_order IS NULL"
        ),
        (
            "subscription_plans",
            "is_active",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
            "UPDATE subscription_plans SET is_active = TRUE WHERE is_active IS NULL"
        ),
        (
            "subscription_plans",
            "max_licenses",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_licenses INTEGER DEFAULT 50",
            "UPDATE subscription_plans SET max_licenses = 50 WHERE max_licenses IS NULL"
        ),
        (
            "subscription_plans",
            "max_variables",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_variables INTEGER DEFAULT 40",
            "UPDATE subscription_plans SET max_variables = 40 WHERE max_variables IS NULL"
        ),
        (
            "subscription_plans",
            "max_logs",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_logs INTEGER DEFAULT 200",
            "UPDATE subscription_plans SET max_logs = 200 WHERE max_logs IS NULL"
        ),
        (
            "subscription_plans",
            "max_hashes",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_hashes INTEGER DEFAULT 2",
            "UPDATE subscription_plans SET max_hashes = 2 WHERE max_hashes IS NULL"
        ),
        (
            "subscription_plans",
            "max_staff",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_staff INTEGER DEFAULT 0",
            "UPDATE subscription_plans SET max_staff = 0 WHERE max_staff IS NULL"
        ),
        (
            "subscription_plans",
            "max_chatrooms",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_chatrooms INTEGER DEFAULT 0",
            "UPDATE subscription_plans SET max_chatrooms = 0 WHERE max_chatrooms IS NULL"
        ),
        (
            "subscription_plans",
            "has_ip_tracking",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_ip_tracking BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_ip_tracking = FALSE WHERE has_ip_tracking IS NULL"
        ),
        (
            "subscription_plans",
            "has_location_tracking",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_location_tracking BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_location_tracking = FALSE WHERE has_location_tracking IS NULL"
        ),
        (
            "subscription_plans",
            "has_user_panel",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_user_panel BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_user_panel = FALSE WHERE has_user_panel IS NULL"
        ),
        (
            "subscription_plans",
            "has_staff_management",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_staff_management BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_staff_management = FALSE WHERE has_staff_management IS NULL"
        ),
        (
            "subscription_plans",
            "has_discord_integration",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_discord_integration BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_discord_integration = FALSE WHERE has_discord_integration IS NULL"
        ),
        (
            "subscription_plans",
            "has_telegram_integration",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_telegram_integration BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_telegram_integration = FALSE WHERE has_telegram_integration IS NULL"
        ),
        (
            "subscription_plans",
            "has_api_access",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_api_access BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_api_access = FALSE WHERE has_api_access IS NULL"
        ),
        (
            "subscription_plans",
            "has_custom_domain",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_custom_domain BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_custom_domain = FALSE WHERE has_custom_domain IS NULL"
        ),
        (
            "subscription_plans",
            "has_live_chat",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_live_chat BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_live_chat = FALSE WHERE has_live_chat IS NULL"
        ),
        (
            "subscription_plans",
            "has_audit_logs",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_audit_logs BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_audit_logs = FALSE WHERE has_audit_logs IS NULL"
        ),
        (
            "subscription_plans",
            "has_webhooks",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_webhooks BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_webhooks = FALSE WHERE has_webhooks IS NULL"
        ),
        (
            "subscription_plans",
            "has_white_label",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_white_label BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_white_label = FALSE WHERE has_white_label IS NULL"
        ),
        (
            "subscription_plans",
            "has_priority_support",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_priority_support BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_priority_support = FALSE WHERE has_priority_support IS NULL"
        ),
        (
            "subscription_plans",
            "has_ssl",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_ssl BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_ssl = FALSE WHERE has_ssl IS NULL"
        ),
        (
            "subscription_plans",
            "has_global_chat",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_global_chat BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_global_chat = FALSE WHERE has_global_chat IS NULL"
        ),
        (
            "subscription_plans",
            "has_custom_bot",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_custom_bot BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_custom_bot = FALSE WHERE has_custom_bot IS NULL"
        ),
        (
            "subscription_plans",
            "has_behavioral_threat_intel",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_behavioral_threat_intel BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_behavioral_threat_intel = FALSE WHERE has_behavioral_threat_intel IS NULL"
        ),
        (
            "subscription_plans",
            "has_version_whitelist",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_version_whitelist BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_version_whitelist = FALSE WHERE has_version_whitelist IS NULL"
        ),
        (
            "webhook_endpoints",
            "description",
            "ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS description VARCHAR DEFAULT ''",
            "UPDATE webhook_endpoints SET description = '' WHERE description IS NULL"
        ),
        (
            "webhook_endpoints",
            "last_sent_at",
            "ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE",
            None
        ),
        (
            "webhook_endpoints",
            "last_status",
            "ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS last_status VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "avatar_url",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "display_name",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS display_name VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "bio",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS bio VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "timezone",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'UTC+00:00'",
            "UPDATE developer_accounts SET timezone = 'UTC+00:00' WHERE timezone IS NULL"
        ),
        (
            "developer_accounts",
            "preferences",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS preferences JSON",
            None
        ),
        (
            "developer_accounts",
            "last_read_at",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE",
            None
        ),
        (
            "developer_accounts",
            "two_factor_enabled",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE",
            "UPDATE developer_accounts SET two_factor_enabled = FALSE WHERE two_factor_enabled IS NULL"
        ),
        (
            "developer_accounts",
            "two_factor_secret",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "two_factor_backup_codes",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSON",
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
        else:
            row = existing[key]
            for k, v in data.items():
                setattr(row, k, v)
            existing.pop(key)
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
    settings_count = await ensure_default_settings(db)

    # 3. Seed default payment method for international (Stripe)
    pm_res = await db.execute(select(PaymentMethod).where(PaymentMethod.type == "international"))
    if not pm_res.scalars().first():
        db.add(PaymentMethod(
            name="Stripe",
            type="international",
            instructions="Pay securely via credit/debit card through Stripe.",
            exchange_rate=100,
            icon_name="credit_card",
            is_active=True,
        ))
        await db.commit()

    return {"plans_created": plans, "settings_created": settings_count}
