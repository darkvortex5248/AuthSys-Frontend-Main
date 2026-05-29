# 🗄️ AuthSys Database Schema (PostgreSQL)

If you need to manually create the tables in your database (e.g., Neon, Render, or Local PG), run the following SQL commands in your SQL Query Editor.

## 1. Core Platform Tables

```sql
-- Admin Users Table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    role VARCHAR DEFAULT 'admin',
    two_factor_secret VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE,
    price_monthly INTEGER,
    price_yearly INTEGER,
    max_apps INTEGER,
    max_users_per_app INTEGER,
    max_keys_per_month INTEGER,
    features_json JSONB,
    ai_agent_access BOOLEAN DEFAULT FALSE
);

-- Developer Accounts Table
CREATE TABLE developer_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    google_id VARCHAR UNIQUE,
    avatar_url VARCHAR,
    plan_id INTEGER REFERENCES subscription_plans(id),
    subscription_tier VARCHAR DEFAULT 'tester',
    api_quota_used INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id),
    name VARCHAR,
    app_secret VARCHAR UNIQUE, -- Unique application secret key for SDK communications
    owner_id VARCHAR UNIQUE,   -- Unique owner identification hash for authorization verification
    version VARCHAR,
    min_version VARCHAR,
    status VARCHAR DEFAULT 'active',
    hash_check BOOLEAN DEFAULT FALSE,
    integrity_key VARCHAR,
    webhook_url VARCHAR,
    hwid_enabled BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    developer_lock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Licensing & User Management

```sql
-- License Keys Table
CREATE TABLE license_keys (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    key_value VARCHAR UNIQUE,
    key_type VARCHAR, -- time/lifetime/uses_based
    duration_days INTEGER,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    note TEXT,
    seller_tag VARCHAR,
    is_paused BOOLEAN DEFAULT FALSE,
    created_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- End Users Table
CREATE TABLE end_users (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    username VARCHAR,
    password_hash VARCHAR,
    email VARCHAR,
    license_key_id INTEGER REFERENCES license_keys(id) ON DELETE SET NULL,
    hwid VARCHAR,
    hwid_reset_count INTEGER DEFAULT 0,
    hwid_reset_allowed INTEGER DEFAULT 1,
    ip_address VARCHAR,
    country_code VARCHAR,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR,
    ban_expires_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_ip VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    variable_data JSONB,
    is_shadow BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

## 3. Advanced Features (Bots, Chat, Sellers)

```sql
-- Bot Configurations Table
CREATE TABLE bot_configs (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    bot_type VARCHAR, -- discord, telegram
    bot_token VARCHAR,
    discord_app_id VARCHAR,
    discord_public_key VARCHAR,
    webhook_url VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Rooms Table
CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES end_users(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seller Accounts Table
CREATE TABLE seller_accounts (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    name VARCHAR,
    api_key VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. System Tables

```sql
-- Blacklist Table
CREATE TABLE blacklist (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    type VARCHAR, -- ip/hwid/username/email
    value VARCHAR,
    reason VARCHAR,
    added_by INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Variables (Functions) Table
CREATE TABLE variables (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    key_name VARCHAR,
    key_value VARCHAR,
    is_global BOOLEAN DEFAULT TRUE,
    allowed_users JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES end_users(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    token_hash VARCHAR,
    ip_address VARCHAR,
    hwid VARCHAR,
    user_agent VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES end_users(id) ON DELETE CASCADE,
    action_type VARCHAR,
    details JSONB,
    ip_address VARCHAR,
    country VARCHAR,
    user_agent VARCHAR,
    hwid VARCHAR,
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Endpoints Table
CREATE TABLE webhook_endpoints (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    url VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    secret_token VARCHAR,
    events JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks Log Table
CREATE TABLE webhooks_log (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    endpoint_id INTEGER REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR,
    payload JSONB,
    response_status INTEGER,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- AI Agent Logs Table
CREATE TABLE ai_agent_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    developer_id INTEGER,
    command_text VARCHAR,
    action_taken VARCHAR,
    result JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR UNIQUE,
    value TEXT,
    description VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id),
    amount INTEGER,
    currency VARCHAR DEFAULT 'usd',
    status VARCHAR,
    stripe_session_id VARCHAR,
    plan_id INTEGER REFERENCES subscription_plans(id),
    payment_method VARCHAR,
    wallet_number VARCHAR,
    transaction_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SDK Downloads Table
CREATE TABLE sdk_downloads (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    version VARCHAR,
    download_url VARCHAR,
    icon_name VARCHAR DEFAULT 'deployed_code',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods Table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    type VARCHAR,
    instructions TEXT,
    exchange_rate INTEGER DEFAULT 120,
    icon_name VARCHAR DEFAULT 'payments',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    role VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔀 Database Update / Migration Guide

If you have an existing database from previous versions of AuthSys and need to update it to support the latest features (including `owner_id`, Shadow Users, Manual Payments, and Webhook logging), run the following SQL commands in your Neon or Supabase SQL Editor:

```sql
-- 1. Update Applications Table (Adding owner_id, maintenance_mode, developer_lock, etc.)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS owner_id VARCHAR UNIQUE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hwid_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS developer_lock BOOLEAN DEFAULT FALSE;

-- Populate default values if there are existing rows
UPDATE applications SET hwid_enabled = TRUE WHERE hwid_enabled IS NULL;
UPDATE applications SET maintenance_mode = FALSE WHERE maintenance_mode IS NULL;
UPDATE applications SET developer_lock = FALSE WHERE developer_lock IS NULL;

-- 2. Update End Users Table (Adding is_shadow for License-Only key logins and expires_at for user expiry)
ALTER TABLE end_users ADD COLUMN IF NOT EXISTS is_shadow BOOLEAN DEFAULT FALSE;
UPDATE end_users SET is_shadow = FALSE WHERE is_shadow IS NULL;
ALTER TABLE end_users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Update Payments Table (Adding manual payment tracking fields)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wallet_number VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR;

-- 4. Update Webhooks Log Table (Adding endpoint_id relationship)
ALTER TABLE webhooks_log ADD COLUMN IF NOT EXISTS endpoint_id INTEGER REFERENCES webhook_endpoints(id) ON DELETE CASCADE;
```
