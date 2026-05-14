from pydantic import BaseModel
from typing import Optional, Dict, Any

class ClientInitRequest(BaseModel):
    app_name: str
    app_secret: str
    version: str
    hwid: str

class ClientInitResponse(BaseModel):
    status: str
    current_version: str
    message: str
    variables: Dict[str, Any]

class ClientRegisterRequest(BaseModel):
    app_secret: str
    username: str
    password: str
    license_key: str
    email: Optional[str] = None
    hwid: str

class ClientLoginRequest(BaseModel):
    app_secret: str
    username: str
    password: str
    hwid: str
    session_length: Optional[int] = 3600

class ClientLicenseCheckRequest(BaseModel):
    app_secret: str
    license_key: str

class ClientLicenseLoginRequest(BaseModel):
    app_secret: str
    license_key: str
    hwid: str
    session_length: Optional[int] = 3600
