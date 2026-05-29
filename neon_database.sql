-- AuthSys Complete Database Schema for Neon PostgreSQL
-- এই SQL ফাইলটি Neon PostgreSQL ডাটাবেসের জন্য সম্পূর্ণ স্কিমা

-- ============================================
-- ১. কোর প্ল্যাটফর্ম টেবিল
-- ============================================

-- অ্যাডমিন ইউজার টেবিল
CREATE TABLE IF NOT EXISTS admin_users (
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

-- সাবস্ক্রিপশন প্ল্যান টেবিল
CREATE TABLE IF NOT EXISTS subscription_plans (
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

-- ডেভেলপার অ্যাকাউন্ট টেবিল
CREATE TABLE IF NOT EXISTS developer_accounts (
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

-- অ্যাপ্লিকেশন টেবিল
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id),
    name VARCHAR,
    app_secret VARCHAR UNIQUE,
    owner_id VARCHAR UNIQUE,
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

-- ============================================
-- ২. পাসওয়ার্ড রিসেট টেবিল
-- ============================================

-- পাসওয়ার্ড রিসেট টোকেন টেবিল
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    token VARCHAR UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- পাসওয়ার্ড রিসেট হিস্ট্রি টেবিল
CREATE TABLE IF NOT EXISTS password_reset_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR,
    user_agent VARCHAR,
    success BOOLEAN DEFAULT TRUE
);

-- ============================================
-- ৩. লাইসেন্সিং এবং ইউজার ম্যানেজমেন্ট
-- ============================================

-- লাইসেন্স কি টেবিল
CREATE TABLE IF NOT EXISTS license_keys (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    key_value VARCHAR UNIQUE,
    key_type VARCHAR,
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

-- এন্ড ইউজার টেবিল
CREATE TABLE IF NOT EXISTS end_users (
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

-- ============================================
-- ৪. সেশন এবং অথেন্টিকেশন
-- ============================================

-- সেশন টেবিল
CREATE TABLE IF NOT EXISTS sessions (
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

-- টু-ফ্যাক্টর অথেন্টিকেশন টেবিল
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    secret VARCHAR,
    backup_codes JSONB,
    enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ৫. অ্যাডভান্সড ফিচার (বট, চ্যাট, সেলার)
-- ============================================

-- বট কনফিগারেশন টেবিল
CREATE TABLE IF NOT EXISTS bot_configs (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    bot_type VARCHAR,
    bot_token VARCHAR,
    discord_app_id VARCHAR,
    discord_public_key VARCHAR,
    webhook_url VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- চ্যাট রুম টেবিল
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- চ্যাট মেসেজ টেবিল
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES end_users(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- সেলার অ্যাকাউন্ট টেবিল
CREATE TABLE IF NOT EXISTS seller_accounts (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    name VARCHAR,
    api_key VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ৬. সিস্টেম টেবিল
-- ============================================

-- ব্ল্যাকলিস্ট টেবিল
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    type VARCHAR,
    value VARCHAR,
    reason VARCHAR,
    added_by INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ভেরিয়েবল টেবিল
CREATE TABLE IF NOT EXISTS variables (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    key_name VARCHAR,
    key_value VARCHAR,
    is_global BOOLEAN DEFAULT TRUE,
    allowed_users JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- অ্যাক্টিভিটি লগ টেবিল
CREATE TABLE IF NOT EXISTS activity_logs (
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

-- ওয়েবহুক এন্ডপয়েন্ট টেবিল
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    url VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    secret_token VARCHAR,
    events JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ওয়েবহুক লগ টেবিল
CREATE TABLE IF NOT EXISTS webhooks_log (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    endpoint_id INTEGER REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR,
    payload JSONB,
    response_status INTEGER,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- AI এজেন্ট লগ টেবিল
CREATE TABLE IF NOT EXISTS ai_agent_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    developer_id INTEGER,
    command_text VARCHAR,
    action_taken VARCHAR,
    result JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI কনভার্সেশন টেবিল (AI Assistant এর জন্য)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    role VARCHAR CHECK (role IN ('admin', 'user')),
    messages JSONB,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI অ্যাকশন লগ টেবিল (AI Assistant এর জন্য)
CREATE TABLE IF NOT EXISTS ai_action_logs (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
    action_type VARCHAR,
    parameters JSONB,
    status VARCHAR CHECK (status IN ('success', 'failed', 'pending')),
    result JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI নলেজ বেস টেবিল (Documentation এর জন্য)
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR,
    content TEXT,
    category VARCHAR,
    tags JSONB,
    embedding_vector VECTOR(1536),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI প্রোভাইডার কনফিগারেশন টেবিল
CREATE TABLE IF NOT EXISTS ai_provider_config (
    id SERIAL PRIMARY KEY,
    provider VARCHAR CHECK (provider IN ('openai', 'gemini', 'claude', 'custom')),
    api_key_encrypted TEXT,
    model_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- সিস্টেম সেটিংস টেবিল
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR UNIQUE,
    value TEXT,
    description VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- পেমেন্ট টেবিল
CREATE TABLE IF NOT EXISTS payments (
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

-- SDK ডাউনলোড টেবিল
CREATE TABLE IF NOT EXISTS sdk_downloads (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    version VARCHAR,
    download_url VARCHAR,
    icon_name VARCHAR DEFAULT 'deployed_code',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- পেমেন্ট মেথড টেবিল
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    type VARCHAR,
    instructions TEXT,
    exchange_rate INTEGER DEFAULT 120,
    icon_name VARCHAR DEFAULT 'payments',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- টিম মেম্বার টেবিল
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES developer_accounts(id) ON DELETE CASCADE,
    role VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ৭. ইনডেক্স তৈরি (পারফরম্যান্সের জন্য)
-- ============================================

-- ডেভেলপার অ্যাকাউন্ট ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_developer_accounts_username ON developer_accounts(username);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_email ON developer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_google_id ON developer_accounts(google_id);

-- অ্যাপ্লিকেশন ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_applications_developer_id ON applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_applications_app_secret ON applications(app_secret);
CREATE INDEX IF NOT EXISTS idx_applications_owner_id ON applications(owner_id);

-- লাইসেন্স কি ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_license_keys_app_id ON license_keys(app_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_key_value ON license_keys(key_value);

-- এন্ড ইউজার ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_end_users_app_id ON end_users(app_id);
CREATE INDEX IF NOT EXISTS idx_end_users_username ON end_users(username);
CREATE INDEX IF NOT EXISTS idx_end_users_license_key_id ON end_users(license_key_id);

-- সেশন ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- পাসওয়ার্ড রিসেট টোকেন ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- অ্যাক্টিভিটি লগ ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_activity_logs_app_id ON activity_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- AI কনভার্সেশন ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_role ON ai_conversations(role);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);

-- AI অ্যাকশন লগ ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_conversation_id ON ai_action_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_action_type ON ai_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_status ON ai_action_logs(status);

-- AI নলেজ বেস ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_tags ON ai_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_is_active ON ai_knowledge_base(is_active);

-- AI প্রোভাইডার কনফিগ ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_ai_provider_config_provider ON ai_provider_config(provider);
CREATE INDEX IF NOT EXISTS idx_ai_provider_config_is_active ON ai_provider_config(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_provider_config_priority ON ai_provider_config(priority);

-- ============================================
-- ৮. ট্রিগার এবং ফাংশন
-- ============================================

-- updated_at অটোমেটিক আপডেট ফাংশন
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- অ্যাপ্লিকেশন টেবিলের জন্য ট্রিগার
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SDK ডাউনলোড টেবিলের জন্য ট্রিগার
CREATE TRIGGER update_sdk_downloads_updated_at
    BEFORE UPDATE ON sdk_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI কনভার্সেশন টেবিলের জন্য ট্রিগার
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI নলেজ বেস টেবিলের জন্য ট্রিগার
CREATE TRIGGER update_ai_knowledge_base_updated_at
    BEFORE UPDATE ON ai_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI প্রোভাইডার কনফিগ টেবিলের জন্য ট্রিগার
CREATE TRIGGER update_ai_provider_config_updated_at
    BEFORE UPDATE ON ai_provider_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ৯. ডিফল্ট ডেটা
-- ============================================

-- ডিফল্ট সাবস্ক্রিপশন প্ল্যান
INSERT INTO subscription_plans (name, price_monthly, price_yearly, max_apps, max_users_per_app, max_keys_per_month, features_json, ai_agent_access)
VALUES 
    ('Free', 0, 0, 1, 10, 50, '{"basic_features": true}', false),
    ('Pro', 29, 290, 5, 100, 500, '{"basic_features": true, "advanced_features": true}', true),
    ('Enterprise', 99, 990, -1, -1, -1, '{"all_features": true, "priority_support": true}', true)
ON CONFLICT (name) DO NOTHING;

-- ডিফল্ট সিস্টেম সেটিংস
INSERT INTO system_settings (key, value, description)
VALUES 
    ('maintenance_mode', 'false', 'System maintenance mode'),
    ('registration_enabled', 'true', 'Allow new user registration'),
    ('max_login_attempts', '5', 'Maximum failed login attempts before lockout')
ON CONFLICT (key) DO NOTHING;

-- ডিফল্ট পেমেন্ট মেথড
INSERT INTO payment_methods (name, type, instructions, exchange_rate, icon_name, is_active)
VALUES 
    ('Credit Card', 'international', 'Pay with your credit card via Stripe', 120, 'credit_card', true),
    ('PayPal', 'international', 'Pay with your PayPal account', 120, 'paypal', true),
    ('bKash', 'local', 'Send money to 017XXXXXXXX', 120, 'bkash', true),
    ('Nagad', 'local', 'Send money to 018XXXXXXXX', 120, 'nagad', true)
ON CONFLICT DO NOTHING;

-- ডিফল্ট AI প্রোভাইডার কনফিগারেশন (API keys পরে environment variables থেকে সেট করতে হবে)
INSERT INTO ai_provider_config (provider, model_name, is_active, priority, settings)
VALUES 
    ('openai', 'gpt-4o', false, 1, '{"temperature": 0.7, "max_tokens": 2000}'),
    ('gemini', 'gemini-pro', false, 2, '{"temperature": 0.7, "max_tokens": 2000}'),
    ('claude', 'claude-3-opus-20240229', false, 3, '{"temperature": 0.7, "max_tokens": 2000}')
ON CONFLICT DO NOTHING;

-- ============================================
-- ১০. নোট: Neon PostgreSQL এর জন্য
-- ============================================
-- Neon PostgreSQL সাধারণ PostgreSQL এর মতোই কাজ করে
-- RLS (Row Level Security) Supabase এর বিশেষ ফিচার, Neon এ প্রয়োজন নেই
-- ব্যাকএন্ড অ্যাপ্লিকেশন থেকেই সব অথেন্টিকেশন এবং অথোরাইজেশন handle করা হবে
