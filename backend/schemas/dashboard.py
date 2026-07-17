from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AppCreate(BaseModel):
    name: str
    version: str = "1.0"
    min_version: str = "1.0"
    hwid_enabled: bool = True

class AppUpdate(BaseModel):
    name: Optional[str] = None
    hash_check: Optional[bool] = None
    webhook_url: Optional[str] = None
    hwid_enabled: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    developer_lock: Optional[bool] = None

class AppResponse(BaseModel):
    id: int
    name: str
    version: str
    min_version: str
    app_secret: str
    owner_id: Optional[str] = None
    status: str
    hash_check: bool = False
    hwid_enabled: Optional[bool] = True
    maintenance_mode: bool = False
    developer_lock: bool = False
    webhook_url: Optional[str] = None
    created_at: Any
    total_users: int = 0
    total_keys: int = 0
    logins_today: int = 0
    
    class Config:
        from_attributes = True

class KeyGenerate(BaseModel):
    app_id: int
    key_type: str # time/lifetime/uses_based
    duration_days: Optional[int] = None
    max_uses: Optional[int] = None
    note: Optional[str] = None
    seller_tag: Optional[str] = None
    expires_at: Optional[datetime] = None
    custom_key: Optional[str] = None

class BulkKeyGenerate(KeyGenerate):
    count: int
    custom_keys: Optional[list[str]] = None

class BanRequest(BaseModel):
    reason: str
    days: Optional[int] = None

class UserCreateManual(BaseModel):
    app_id: int
    username: str
    password: str
    email: Optional[str] = None
    expires_at: Optional[datetime] = None
    duration_days: Optional[int] = None
    max_uses: int = 0

class BulkUserCreate(BaseModel):
    app_id: int
    count: int
    password_prefix: Optional[str] = None
    expires_at: Optional[datetime] = None
    users_list: Optional[list[dict]] = None
    max_uses: int = 0

class VariableCreate(BaseModel):
    app_id: int
    key_name: str
    key_value: str
    is_global: bool = True
    allowed_users: Optional[List[int]] = None

class BlacklistAdd(BaseModel):
    app_id: int
    type: str # ip, hwid, username, email
    value: str
    reason: Optional[str] = None

class AgentCommand(BaseModel):
    command: str
    context: Dict[str, Any] = {}

class WebhookEndpointCreate(BaseModel):
    app_id: int
    url: str
    description: str = ''
    events: List[str] = ["login", "register"]

class WebhookEndpointUpdate(BaseModel):
    url: Optional[str] = None
    description: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None

class WebhookEndpointResponse(BaseModel):
    id: int
    app_id: int
    url: str
    description: str = ''
    secret: str = ''
    events: List[str] = []
    is_active: bool = True
    last_sent_at: Optional[str] = None
    last_status: Optional[str] = None
    created_at: str = ''

    class Config:
        from_attributes = True


class DeviceAppCreate(BaseModel):
    name: str
    max_devices: int = 50


class DeviceAppUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    max_devices: Optional[int] = None


class DeviceAppResponse(BaseModel):
    id: int
    name: str
    device_secret: str
    is_active: bool
    max_devices: int
    device_count: int = 0
    created_at: Any

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: int
    hwid: str
    device_name: Optional[str] = None
    status: str
    ban_reason: Optional[str] = None
    last_checkin_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
