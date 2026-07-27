from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class AdminLogin(BaseModel):
    username: str
    password: str

class PlanBase(BaseModel):
    name: str
    description: str = ''
    price_monthly: int
    price_yearly: int
    discount: int = 0
    badge_text: str = ''
    badge_color: str = ''
    is_recommended: bool = False
    button_text: str = 'Choose Plan'
    button_color: str = 'var(--primary)'
    icon: str = 'card_membership'
    sort_order: int = 0
    is_active: bool = True
    max_apps: int = 2
    max_licenses: int = 50
    max_users_per_app: int = 50
    max_keys_per_month: int = 100
    max_variables: int = 40
    max_logs: int = 200
    max_hashes: int = 2
    max_staff: int = 0
    max_chatrooms: int = 0
    features_json: Optional[Any] = None
    ai_agent_access: bool = False
    audit_log_limit: int = 1000
    has_ip_tracking: bool = False
    has_location_tracking: bool = False
    has_user_panel: bool = False
    has_staff_management: bool = False
    has_discord_integration: bool = False
    has_telegram_integration: bool = False
    has_api_access: bool = False
    has_custom_domain: bool = False
    has_live_chat: bool = False
    has_audit_logs: bool = False
    has_webhooks: bool = False
    has_white_label: bool = False
    has_priority_support: bool = False
    has_ssl: bool = False
    has_global_chat: bool = False
    has_custom_bot: bool = False
    has_behavioral_threat_intel: bool = False
    has_version_whitelist: bool = False

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[int] = None
    price_yearly: Optional[int] = None
    discount: Optional[int] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None
    is_recommended: Optional[bool] = None
    button_text: Optional[str] = None
    button_color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    max_apps: Optional[int] = None
    max_licenses: Optional[int] = None
    max_users_per_app: Optional[int] = None
    max_keys_per_month: Optional[int] = None
    max_variables: Optional[int] = None
    max_logs: Optional[int] = None
    max_hashes: Optional[int] = None
    max_staff: Optional[int] = None
    max_chatrooms: Optional[int] = None
    features_json: Optional[Any] = None
    ai_agent_access: Optional[bool] = None
    audit_log_limit: Optional[int] = None
    has_ip_tracking: Optional[bool] = None
    has_location_tracking: Optional[bool] = None
    has_user_panel: Optional[bool] = None
    has_staff_management: Optional[bool] = None
    has_discord_integration: Optional[bool] = None
    has_telegram_integration: Optional[bool] = None
    has_api_access: Optional[bool] = None
    has_custom_domain: Optional[bool] = None
    has_live_chat: Optional[bool] = None
    has_audit_logs: Optional[bool] = None
    has_webhooks: Optional[bool] = None
    has_white_label: Optional[bool] = None
    has_priority_support: Optional[bool] = None
    has_ssl: Optional[bool] = None
    has_global_chat: Optional[bool] = None
    has_custom_bot: Optional[bool] = None
    has_behavioral_threat_intel: Optional[bool] = None
    has_version_whitelist: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int
    class Config:
        from_attributes = True

class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class SystemSettingResponse(SystemSettingBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True

class AIConfigUpdate(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    enabled: Optional[bool] = None

class AIProviderInfo(BaseModel):
    id: str
    label: str
    default_model: str
    models: List[str]
    key_hint: str
    docs: str = ""

class AIConfigResponse(BaseModel):
    provider: str
    model: str
    enabled: bool
    api_key_set: bool
    api_key_preview: str
    base_url: str = ""
    supported_models: List[str]
    providers: List[AIProviderInfo] = []

class AIConfigTestResponse(BaseModel):
    success: bool
    message: str
    model: Optional[str] = None

class PlatformStats(BaseModel):
    total_developers: int
    total_apps: int
    total_end_users: int
    total_revenue_cents: int
    active_subscriptions: int

class SDKDownloadBase(BaseModel):
    name: str
    version: str
    download_url: str
    icon_name: str = "deployed_code"
    is_active: bool = True

class SDKDownloadCreate(SDKDownloadBase):
    pass

class SDKDownloadUpdate(SDKDownloadBase):
    pass

class SDKDownloadResponse(SDKDownloadBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class PaymentMethodBase(BaseModel):
    name: str
    type: str # local, international
    instructions: Optional[str] = None
    exchange_rate: int = 120
    icon_name: str = "payments"
    is_active: bool = True

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(PaymentMethodBase):
    pass

class PaymentMethodResponse(PaymentMethodBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class DeveloperAdminResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    plan_id: Optional[int] = None
    subscription_tier: Optional[str] = "tester"
    is_banned: bool = False
    is_verified: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    severity: str = "info"
    created_by: Optional[int] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    created_by: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True
