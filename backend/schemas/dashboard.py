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

class BanRequest(BaseModel):
    reason: str
    days: Optional[int] = None

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
    events: List[str] = ["login", "register"]

class WebhookEndpointUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None
