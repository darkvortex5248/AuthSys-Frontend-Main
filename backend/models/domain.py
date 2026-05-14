from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="admin")
    two_factor_secret = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_login = Column(DateTime(timezone=True), nullable=True)

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    price_monthly = Column(Integer)
    price_yearly = Column(Integer)
    max_apps = Column(Integer)
    max_users_per_app = Column(Integer)
    max_keys_per_month = Column(Integer)
    features_json = Column(JSON, nullable=True)
    ai_agent_access = Column(Boolean, default=False)

class DeveloperAccount(Base):
    __tablename__ = "developer_accounts"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    google_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=True)
    subscription_tier = Column(String, default="tester")
    api_quota_used = Column(Integer, default=0)
    stripe_customer_id = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    apps = relationship("Application", back_populates="developer")
    plan = relationship("SubscriptionPlan")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_accounts.id"))
    name = Column(String)
    app_secret = Column(String, unique=True, index=True)
    owner_id = Column(String, unique=True, index=True)
    version = Column(String)
    min_version = Column(String)
    status = Column(String, default="active")
    hash_check = Column(Boolean, default=False)
    integrity_key = Column(String, nullable=True)
    webhook_url = Column(String, nullable=True)
    hwid_enabled = Column(Boolean, default=True)
    maintenance_mode = Column(Boolean, default=False)
    developer_lock = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    developer = relationship("DeveloperAccount", back_populates="apps")
    keys = relationship("LicenseKey", back_populates="app")
    users = relationship("EndUser", back_populates="app")
    webhook_endpoints = relationship("WebhookEndpoint", back_populates="app")

class LicenseKey(Base):
    __tablename__ = "license_keys"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    key_value = Column(String, unique=True, index=True)
    key_type = Column(String) # time/lifetime/uses_based
    duration_days = Column(Integer, nullable=True)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    note = Column(Text, nullable=True)
    seller_tag = Column(String, nullable=True)
    is_paused = Column(Boolean, default=False)
    created_by_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    app = relationship("Application", back_populates="keys")

class EndUser(Base):
    __tablename__ = "end_users"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    username = Column(String, index=True)
    password_hash = Column(String)
    email = Column(String, nullable=True)
    license_key_id = Column(Integer, ForeignKey("license_keys.id", ondelete="SET NULL"), nullable=True)
    hwid = Column(String, nullable=True)
    hwid_reset_count = Column(Integer, default=0)
    hwid_reset_allowed = Column(Integer, default=1)
    ip_address = Column(String, nullable=True)
    country_code = Column(String, nullable=True)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String, nullable=True)
    ban_expires_at = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_ip = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    variable_data = Column(JSON, nullable=True)
    is_shadow = Column(Boolean, default=False)

    app = relationship("Application", back_populates="users")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("end_users.id", ondelete="CASCADE"))
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    token_hash = Column(String, index=True)
    ip_address = Column(String)
    hwid = Column(String)
    user_agent = Column(String)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utc_now)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("end_users.id", ondelete="CASCADE"), nullable=True)
    action_type = Column(String)
    details = Column(JSON, nullable=True)
    ip_address = Column(String)
    country = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    hwid = Column(String, nullable=True)
    is_suspicious = Column(Boolean, default=False)
    risk_score = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

class Blacklist(Base):
    __tablename__ = "blacklist"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    type = Column(String) # ip/hwid/username/email
    value = Column(String)
    reason = Column(String, nullable=True)
    added_by = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Variable(Base):
    __tablename__ = "variables"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    key_name = Column(String)
    key_value = Column(String)
    is_global = Column(Boolean, default=True)
    allowed_users = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class WebhookLog(Base):
    __tablename__ = "webhooks_log"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    endpoint_id = Column(Integer, ForeignKey("webhook_endpoints.id", ondelete="CASCADE"), nullable=True)
    event_type = Column(String)
    payload = Column(JSON)
    response_status = Column(Integer, nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    url = Column(String)
    is_active = Column(Boolean, default=True)
    secret_token = Column(String, nullable=True)
    events = Column(JSON, nullable=True) # e.g. ["login", "register"]
    created_at = Column(DateTime(timezone=True), default=utc_now)

    app = relationship("Application", back_populates="webhook_endpoints")

class AIAgentLog(Base):
    __tablename__ = "ai_agent_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=True)
    developer_id = Column(Integer, nullable=True)
    command_text = Column(String)
    action_taken = Column(String)
    result = Column(JSON)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_accounts.id"))
    amount = Column(Integer) # In cents
    currency = Column(String, default="usd")
    status = Column(String) # pending, completed, failed
    stripe_session_id = Column(String, nullable=True)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"))
    payment_method = Column(String, nullable=True)
    wallet_number = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class SDKDownload(Base):
    __tablename__ = "sdk_downloads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # C++, C#, Python, etc.
    version = Column(String)
    download_url = Column(String)
    icon_name = Column(String, default="deployed_code")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # bKash, Nagad, Card, etc.
    type = Column(String) # local, international
    instructions = Column(Text, nullable=True) # "Send Money to 017..."
    exchange_rate = Column(Integer, default=120) # 1 USD = 120 BDT
    icon_name = Column(String, default="payments")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_accounts.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("developer_accounts.id", ondelete="CASCADE")) # The invited person
    role = Column(String) # admin, moderator, support
    created_at = Column(DateTime(timezone=True), default=utc_now)

    owner = relationship("DeveloperAccount", foreign_keys=[developer_id])
    member = relationship("DeveloperAccount", foreign_keys=[user_id])

class BotConfig(Base):
    __tablename__ = "bot_configs"
    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_accounts.id", ondelete="CASCADE"))
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    bot_type = Column(String) # discord, telegram
    bot_token = Column(String)
    discord_app_id = Column(String, nullable=True)
    discord_public_key = Column(String, nullable=True)
    webhook_url = Column(String, nullable=True) # For telegram webhooks
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True) # e.g. enabled commands
    created_at = Column(DateTime(timezone=True), default=utc_now)

class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    messages = relationship("ChatMessage", back_populates="room")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("end_users.id", ondelete="CASCADE"))
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("EndUser")

class SellerAccount(Base):
    __tablename__ = "seller_accounts"
    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_accounts.id", ondelete="CASCADE"))
    name = Column(String)
    api_key = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
