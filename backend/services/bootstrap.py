"""Ensure default plans, settings, and tables/columns exist (safe to call on every startup)."""

from __future__ import annotations

import logging
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base
from core.security import get_password_hash, verify_password
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
        "max_licenses": 30,
        "max_users_per_app": 30,
        "max_keys_per_month": 100,
        "max_variables": 40,
        "max_logs": 200,
        "max_hashes": 2,
        "max_staff": 0,
        "max_chatrooms": 0,
        "max_devices": 3,
        "features_json": ["Basic Auth", "HWID Lock", "License Keys", "Device Activation"],
        "ai_agent_access": False,
        "audit_log_limit": 50,
        "has_ip_tracking": False,
        "has_location_tracking": False,
        "has_user_panel": True,
        "has_staff_management": True,
        "has_discord_integration": False,
        "has_telegram_integration": False,
        "has_api_access": True,
        "has_custom_domain": False,
        "has_live_chat": False,
        "has_audit_logs": True,
        "has_webhooks": False,
        "has_white_label": False,
        "has_priority_support": False,
        "has_ssl": False,
        "has_global_chat": False,
        "has_custom_bot": False,
        "has_behavioral_threat_intel": False,
        "has_version_whitelist": True,
        "has_device_panel": True,
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
        "max_devices": 10,
        "features_json": ["Team Management", "Customer Panel", "Functions", "Webhooks", "Device Activation"],
        "ai_agent_access": True,
        "audit_log_limit": 150,
        "has_ip_tracking": True,
        "has_location_tracking": True,
        "has_user_panel": True,
        "has_staff_management": True,
        "has_discord_integration": False,
        "has_telegram_integration": False,
        "has_api_access": True,
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
        "has_device_panel": True,
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
        "max_devices": 50,
        "features_json": ["Chatrooms", "Discord Bot", "Telegram Bot", "Seller API", "Device Activation"],
        "ai_agent_access": True,
        "audit_log_limit": 250,
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
        "has_device_panel": True,
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
        "max_devices": 999999,
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
        "audit_log_limit": 500,
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
        "has_device_panel": True,
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
            "subscription_plans",
            "has_device_panel",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_device_panel BOOLEAN DEFAULT FALSE",
            "UPDATE subscription_plans SET has_device_panel = FALSE WHERE has_device_panel IS NULL"
        ),
        (
            "subscription_plans",
            "max_apps",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_apps INTEGER DEFAULT 2",
            "UPDATE subscription_plans SET max_apps = 2 WHERE max_apps IS NULL"
        ),
        (
            "subscription_plans",
            "max_users_per_app",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_users_per_app INTEGER DEFAULT 50",
            "UPDATE subscription_plans SET max_users_per_app = 50 WHERE max_users_per_app IS NULL"
        ),
        (
            "subscription_plans",
            "max_keys_per_month",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_keys_per_month INTEGER DEFAULT 100",
            "UPDATE subscription_plans SET max_keys_per_month = 100 WHERE max_keys_per_month IS NULL"
        ),
        (
            "subscription_plans",
            "audit_log_limit",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS audit_log_limit INTEGER DEFAULT 1000",
            "UPDATE subscription_plans SET audit_log_limit = 1000 WHERE audit_log_limit IS NULL"
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
        ),
        (
            "end_users",
            "max_uses",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1",
            "UPDATE end_users SET max_uses = 1 WHERE max_uses IS NULL"
        ),
        (
            "subscription_plans",
            "max_devices",
            "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 3",
            "UPDATE subscription_plans SET max_devices = 3 WHERE max_devices IS NULL"
        ),
        (
            "end_users",
            "user_category",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS user_category VARCHAR DEFAULT 'active'",
            "UPDATE end_users SET user_category = 'active' WHERE user_category IS NULL"
        ),
        (
            "end_users",
            "is_device_only",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS is_device_only BOOLEAN DEFAULT FALSE",
            "UPDATE end_users SET is_device_only = FALSE WHERE is_device_only IS NULL"
        ),
        (
            "end_users",
            "developer_id",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE",
            None
        ),
        (
            "developer_accounts",
            "device_api_key",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS device_api_key VARCHAR",
            None
        ),
        # ── Columns added to models AFTER last Alembic migration ──────
        (
            "admin_users",
            "must_change_password",
            "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE",
            "UPDATE admin_users SET must_change_password = FALSE WHERE must_change_password IS NULL"
        ),
        (
            "developer_accounts",
            "subscription_tier",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'tester'",
            "UPDATE developer_accounts SET subscription_tier = 'tester' WHERE subscription_tier IS NULL"
        ),
        (
            "developer_accounts",
            "discord_id",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS discord_id VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "github_id",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS github_id VARCHAR",
            None
        ),
        (
            "developer_accounts",
            "azure_id",
            "ALTER TABLE developer_accounts ADD COLUMN IF NOT EXISTS azure_id VARCHAR",
            None
        ),
        (
            "end_users",
            "hwids",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS hwids JSON DEFAULT '[]'::json",
            "UPDATE end_users SET hwids = '[]'::json WHERE hwids IS NULL"
        ),
        (
            "end_users",
            "max_devices",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1",
            "UPDATE end_users SET max_devices = 1 WHERE max_devices IS NULL"
        ),
        (
            "end_users",
            "expires_at",
            "ALTER TABLE end_users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE",
            None
        ),
        (
            "license_keys",
            "max_devices",
            "ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 0",
            "UPDATE license_keys SET max_devices = 0 WHERE max_devices IS NULL"
        ),

    ]
    
    indexes_to_ensure = [
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_end_users_app_id_username ON end_users(app_id, username)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_created_at ON end_users(created_at)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_last_login_at ON end_users(last_login_at)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_is_shadow ON end_users(is_shadow)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_user_category ON end_users(user_category)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_is_device_only ON end_users(is_device_only)",
        "CREATE INDEX IF NOT EXISTS ix_developer_accounts_created_at ON developer_accounts(created_at)",
        "CREATE INDEX IF NOT EXISTS ix_applications_created_at ON applications(created_at)",
        "CREATE INDEX IF NOT EXISTS ix_activation_codes_code ON activation_codes(code)",
        "CREATE INDEX IF NOT EXISTS ix_activation_codes_is_used ON activation_codes(is_used)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_developer_id ON end_users(developer_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_accounts_device_api_key ON developer_accounts(device_api_key) WHERE device_api_key IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_developer_accounts_discord_id ON developer_accounts(discord_id) WHERE discord_id IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_developer_accounts_github_id ON developer_accounts(github_id) WHERE github_id IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_developer_accounts_azure_id ON developer_accounts(azure_id) WHERE azure_id IS NOT NULL",
        "CREATE INDEX IF NOT EXISTS ix_admin_users_must_change_password ON admin_users(must_change_password)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_max_devices ON end_users(max_devices)",
        "CREATE INDEX IF NOT EXISTS ix_end_users_expires_at ON end_users(expires_at)",
        "CREATE INDEX IF NOT EXISTS ix_developer_accounts_subscription_tier ON developer_accounts(subscription_tier)",
    ]
    
    tables_to_ensure = [
        """
        CREATE TABLE IF NOT EXISTS activation_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR UNIQUE NOT NULL,
            plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE CASCADE NOT NULL,
            target_developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE SET NULL,
            is_used BOOLEAN DEFAULT FALSE,
            used_by_developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE SET NULL,
            used_at TIMESTAMPTZ,
            source VARCHAR DEFAULT 'admin',
            stripe_session_id VARCHAR,
            payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS device_groups (
            id SERIAL PRIMARY KEY,
            developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE NOT NULL,
            name VARCHAR NOT NULL,
            group_secret VARCHAR UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            max_devices INTEGER DEFAULT 50,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS devices (
            id SERIAL PRIMARY KEY,
            group_id INTEGER REFERENCES device_groups(id) ON DELETE CASCADE NOT NULL,
            hwid VARCHAR NOT NULL,
            device_name VARCHAR,
            status VARCHAR DEFAULT 'active',
            ban_reason VARCHAR,
            last_checkin_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """,
    ]
    for tbl_sql in tables_to_ensure:
        try:
            await db.execute(text(tbl_sql))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"Table creation failed: {e}")

    for idx_sql in indexes_to_ensure:
        try:
            await db.execute(text(idx_sql))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"Index creation failed: {e}")

    # Migrate device_apps → device_groups (legacy schema rename)
    try:
        # Rename column in devices table if it still uses old FK name
        col_res = await db.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='device_app_id')"
        ))
        if col_res.scalar():
            await db.execute(text("ALTER TABLE devices RENAME COLUMN device_app_id TO group_id"))
            await db.commit()
    except Exception as e:
        await db.rollback()
        logger.warning(f"Column rename device_app_id→group_id failed: {e}")

    try:
        # Migrate data from old device_apps table to device_groups if old table exists
        tbl_res = await db.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='device_apps')"
        ))
        if tbl_res.scalar():
            await db.execute(text(
                "INSERT INTO device_groups (id, developer_id, name, group_secret, is_active, max_devices, created_at, updated_at) SELECT id, developer_id, name, device_secret, is_active, max_devices, created_at, updated_at FROM device_apps ON CONFLICT (id) DO NOTHING"
            ))
            await db.commit()
            # Drop old device_apps table
            await db.execute(text("DROP TABLE IF EXISTS device_apps CASCADE"))
            await db.commit()
    except Exception as e:
        await db.rollback()
        logger.warning(f"Device group migration failed: {e}")

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

    # Rename activity_logs.timestamp → created_at if the old column name still exists
    try:
        ts_res = await db.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_logs' AND column_name='timestamp')"
        ))
        ct_res = await db.execute(text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_logs' AND column_name='created_at')"
        ))
        if ts_res.scalar() and not ct_res.scalar():
            await db.execute(text("ALTER TABLE activity_logs RENAME COLUMN timestamp TO created_at"))
            await db.commit()
            logger.info("Schema migration: Renamed activity_logs.timestamp → created_at")
    except Exception as e:
        await db.rollback()
        logger.warning(f"Column rename activity_logs.timestamp→created_at failed: {e}")

    # Dynamic safety net: detect any model columns still missing from the live DB
    try:
        from core.database import auto_sync_schema
        changes = await auto_sync_schema(db)
        if changes:
            logger.info(f"Schema auto-sync added {len(changes)} missing columns")
    except Exception as e:
        logger.warning(f"Schema auto-sync failed: {e}")

    # Ensure default plans exist immediately (not deferred to background bootstrap)
    try:
        created = await ensure_default_plans(db)
        if created:
            logger.info(f"Schema: seeded {created} default subscription plans")
    except Exception as e:
        logger.warning(f"Schema: failed to seed default plans: {e}")


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


_ADMIN_EMAIL = "mdatikurrohoman524860@gmail.com"
_ADMIN_PASSWORD = "4G!PYJP*SvE2epy"

async def ensure_default_admin(db: AsyncSession) -> int:
    """Ensure the default super admin exists with the specified credentials."""
    from models.domain import AdminUser
    res = await db.execute(select(AdminUser).where(AdminUser.username == "atik"))
    existing = res.scalars().first()
    if existing:
        if existing.email != _ADMIN_EMAIL or existing.must_change_password or not existing.password_hash:
            existing.email = _ADMIN_EMAIL
            existing.password_hash = get_password_hash(_ADMIN_PASSWORD)
            existing.role = "super_admin"
            existing.is_active = True
            existing.must_change_password = False
            await db.commit()
            logger.info("[BOOTSTRAP] Default admin updated with fixed credentials.")
        return 0
    admin = AdminUser(
        username="atik",
        email=_ADMIN_EMAIL,
        password_hash=get_password_hash(_ADMIN_PASSWORD),
        role="super_admin",
        is_active=True,
        must_change_password=False,
    )
    db.add(admin)
    await db.commit()
    logger.info("[BOOTSTRAP] Default admin created: %s", _ADMIN_EMAIL)
    return 1


async def ensure_default_developer(db: AsyncSession) -> int:
    """Ensure a default developer account exists for client dashboard login."""
    from models.domain import DeveloperAccount, SubscriptionPlan
    from core.config import settings
    res = await db.execute(select(DeveloperAccount).where(
        DeveloperAccount.email == _ADMIN_EMAIL
    ))
    existing = res.scalars().first()
    if existing:
        if existing.password_hash == "license_only_login" or not existing.password_hash or existing.password_hash == "":
            existing.password_hash = get_password_hash(_ADMIN_PASSWORD)
            existing.email = _ADMIN_EMAIL
            await db.commit()
            logger.info("[BOOTSTRAP] Default developer credentials updated.")
            return 1
        return 0
    plan_res = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.price_monthly))
    plan = plan_res.scalars().first()
    dev = DeveloperAccount(
        username="admin",
        email=_ADMIN_EMAIL,
        password_hash=get_password_hash(_ADMIN_PASSWORD),
        is_verified=True,
        plan_id=plan.id if plan else None,
    )
    db.add(dev)
    await db.commit()
    logger.info("[BOOTSTRAP] Default developer created: %s", _ADMIN_EMAIL)
    return 1


_ENTERPRISE_EMAIL = "atikurrohomanmd839@gmail.com"
_ENTERPRISE_PASSWORD = "4G!PYJP*SvE2epy"

async def ensure_enterprise_developer(db: AsyncSession) -> int:
    """Ensure the enterprise developer account exists with Enterprise plan."""
    from models.domain import DeveloperAccount, SubscriptionPlan
    res = await db.execute(select(DeveloperAccount).where(
        DeveloperAccount.email == _ENTERPRISE_EMAIL
    ))
    existing = res.scalars().first()
    if existing:
        existing.password_hash = get_password_hash(_ENTERPRISE_PASSWORD)
        existing.is_verified = True
        plan_res = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.name == "Enterprise")
        )
        enterprise_plan = plan_res.scalars().first()
        if enterprise_plan:
            existing.plan_id = enterprise_plan.id
        await db.commit()
        logger.info("[BOOTSTRAP] Enterprise developer updated: %s", _ENTERPRISE_EMAIL)
        return 1
    plan_res = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.name == "Enterprise")
    )
    enterprise_plan = plan_res.scalars().first()
    dev = DeveloperAccount(
        username="enterprise",
        email=_ENTERPRISE_EMAIL,
        password_hash=get_password_hash(_ENTERPRISE_PASSWORD),
        is_verified=True,
        plan_id=enterprise_plan.id if enterprise_plan else None,
    )
    db.add(dev)
    await db.commit()
    logger.info("[BOOTSTRAP] Enterprise developer created: %s", _ENTERPRISE_EMAIL)
    return 1


async def normalize_usernames(db: AsyncSession) -> None:
    """Lowercase all existing usernames for case-insensitive auth.
    Removes case-duplicate users keeping the oldest one.
    """
    from sqlalchemy import text

    # First lowercase all end_users usernames
    await db.execute(text("""
        UPDATE end_users SET username = LOWER(username)
        WHERE username != LOWER(username)
    """))

    # Remove case-duplicate end_users — keep the row with smallest id
    await db.execute(text("""
        DELETE FROM end_users
        WHERE id NOT IN (
            SELECT MIN(id) FROM end_users GROUP BY app_id, username
        )
    """))

    # Lowercase developer_accounts usernames and emails
    await db.execute(text("""
        UPDATE developer_accounts SET username = LOWER(username)
        WHERE username != LOWER(username)
    """))
    await db.execute(text("""
        UPDATE developer_accounts SET email = LOWER(email)
        WHERE email != LOWER(email)
    """))

    await db.commit()
    logger.info("Usernames normalized to lowercase")


async def run_bootstrap(db: AsyncSession) -> dict:
    # 1. First ensure database schema and tables are 100% correct
    await ensure_database_schema(db)

    # 2. Normalize existing usernames to lowercase (case-insensitive migration)
    await normalize_usernames(db)
    
    # 3. Seed plans and settings
    plans = await ensure_default_plans(db)
    settings_count = await ensure_default_settings(db)
    
    # 3. Seed default super admin if none exists
    admin_created = await ensure_default_admin(db)

    # 4. Seed default developer (client dashboard)
    dev_created = await ensure_default_developer(db)

    # 5. Seed enterprise developer (Enterprise plan)
    enterprise_created = await ensure_enterprise_developer(db)

    # 6. Seed default payment method for international (Stripe)
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

    import secrets

    # Migrate legacy device_api_key to DeviceGroup
    devs_res = await db.execute(select(DeveloperAccount))
    all_devs = devs_res.scalars().all()
    for dev in all_devs:
        has_group = await db.execute(
            select(DeviceGroup).where(DeviceGroup.developer_id == dev.id).limit(1)
        )
        if not has_group.scalars().first():
            legacy_key = dev.device_api_key
            group = DeviceGroup(
                developer_id=dev.id,
                name="Default Device Group",
                group_secret=legacy_key or f"dv_{secrets.token_urlsafe(32)}",
                max_devices=50,
            )
            db.add(group)
            await db.flush()

            old_devices = await db.execute(
                select(EndUser).where(
                    EndUser.developer_id == dev.id,
                    EndUser.is_device_only == True,
                )
            )
            for old in old_devices.scalars().all():
                device = Device(
                    group_id=group.id,
                    hwid=old.hwid or "unknown",
                    device_name=old.device_name,
                    status="active" if not old.is_banned else "banned",
                    ban_reason=old.ban_reason,
                    last_checkin_at=old.last_login_at,
                )
                db.add(device)
                db.delete(old)
    await db.commit()

    return {"plans_created": plans, "settings_created": settings_count, "admin_created": admin_created}
