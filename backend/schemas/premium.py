from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


# ── Sessions ─────────────────────────────────────────────────────────────

class DeveloperSessionResponse(BaseModel):
    id: int
    ip_address: str
    user_agent: Optional[str] = None
    device_name: Optional[str] = None
    location: Optional[str] = None
    is_current: bool
    last_activity: datetime
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── IP Whitelist / Geo-Fencing ───────────────────────────────────────────

class IPWhitelistRuleCreate(BaseModel):
    app_id: int
    rule_type: str
    value: str
    is_blocklist: bool = False
    note: Optional[str] = None

class IPWhitelistRuleResponse(BaseModel):
    id: int
    app_id: int
    rule_type: str
    value: str
    is_blocklist: bool
    note: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── API Keys ─────────────────────────────────────────────────────────────

class APIKeyCreate(BaseModel):
    name: str
    scopes: list[str] = []
    ip_restrictions: Optional[list[str]] = None
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    scopes: list
    ip_restrictions: Optional[list] = None
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyCreatedResponse(APIKeyResponse):
    raw_key: str  # Only shown once at creation


# ── Custom Domain ────────────────────────────────────────────────────────

class CustomDomainCreate(BaseModel):
    domain: str

class CustomDomainResponse(BaseModel):
    id: int
    domain: str
    ssl_enabled: bool
    is_verified: bool
    verification_token: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Backup ───────────────────────────────────────────────────────────────

class BackupCreate(BaseModel):
    app_id: int
    name: str

class BackupResponse(BaseModel):
    id: int
    app_id: int
    name: str
    config_snapshot: Any
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Environment ──────────────────────────────────────────────────────────

class AppEnvironmentCreate(BaseModel):
    parent_app_id: int
    name: str

class AppEnvironmentResponse(BaseModel):
    id: int
    parent_app_id: int
    name: str
    app_secret: str
    owner_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Health ───────────────────────────────────────────────────────────────

class HealthCheckResponse(BaseModel):
    id: int
    app_id: int
    endpoint: str
    status_code: int
    response_time_ms: int
    is_up: bool
    checked_at: datetime

    class Config:
        from_attributes = True


# ── Log Retention ────────────────────────────────────────────────────────

class LogRetentionUpdate(BaseModel):
    app_id: int
    retention_days: int = 30
    auto_cleanup: bool = True

class LogRetentionResponse(BaseModel):
    id: int
    app_id: int
    retention_days: int
    auto_cleanup: bool
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Organization ─────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    slug: str
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationMemberResponse(BaseModel):
    id: int
    organization_id: int
    developer_id: int
    role: str
    invited_by: Optional[int] = None
    is_accepted: bool
    joined_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InviteMemberRequest(BaseModel):
    developer_email: str
    role: str = "developer"


# ── Usage ────────────────────────────────────────────────────────────────

class UsageRecordResponse(BaseModel):
    id: int
    developer_id: int
    metric: str
    quantity: int
    billing_period_start: datetime
    billing_period_end: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ── Custom Plan ──────────────────────────────────────────────────────────

class CustomPlanOverrideCreate(BaseModel):
    developer_id: int
    feature_key: str
    feature_value: Any
    label: Optional[str] = None

class CustomPlanOverrideResponse(BaseModel):
    id: int
    developer_id: int
    feature_key: str
    feature_value: Any
    label: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Scheduled Actions ────────────────────────────────────────────────────

class ScheduledActionCreate(BaseModel):
    app_id: Optional[int] = None
    action_type: str
    target_type: str
    target_filter: Optional[dict] = None
    payload: Optional[dict] = None
    scheduled_at: datetime

class ScheduledActionResponse(BaseModel):
    id: int
    developer_id: int
    app_id: Optional[int] = None
    action_type: str
    target_type: str
    target_filter: Optional[dict] = None
    payload: Optional[dict] = None
    status: str
    result_summary: Optional[dict] = None
    scheduled_at: datetime
    executed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Webhook Delivery ─────────────────────────────────────────────────────

class WebhookDeliveryResponse(BaseModel):
    id: int
    endpoint_id: int
    event_type: str
    payload: Any
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    attempt_number: int
    max_attempts: int
    next_retry_at: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True
