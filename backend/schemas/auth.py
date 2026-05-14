from pydantic import BaseModel, EmailStr
from typing import Optional

class DeveloperCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    turnstile_token: Optional[str] = None

class PlanSummary(BaseModel):
    id: int
    name: str
    max_apps: int
    max_users_per_app: int
    max_keys_per_month: int
    features_json: Optional[list] = []

    class Config:
        from_attributes = True

class DeveloperResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_verified: bool
    subscription_tier: Optional[str] = "tester"
    plan: Optional[PlanSummary] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DeveloperGoogleLogin(BaseModel):
    email: EmailStr
    name: str
    google_id: str
    avatar_url: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str
    purpose: str # 'verification' or 'password_reset'

class NewPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class DeveloperUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
