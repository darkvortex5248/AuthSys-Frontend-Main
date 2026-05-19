from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class AdminLogin(BaseModel):
    username: str
    password: str

class PlanBase(BaseModel):
    name: str
    price_monthly: int
    price_yearly: int
    max_apps: int
    max_users_per_app: int
    max_keys_per_month: int
    features_json: Optional[Any] = None
    ai_agent_access: bool = False

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price_monthly: Optional[int] = None
    price_yearly: Optional[int] = None
    max_apps: Optional[int] = None
    max_users_per_app: Optional[int] = None
    max_keys_per_month: Optional[int] = None
    features_json: Optional[Any] = None
    ai_agent_access: Optional[bool] = None

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
