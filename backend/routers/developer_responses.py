from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Dict
from datetime import datetime

from core.database import get_db
from core.deps import get_current_developer
from models.domain import SystemSetting, DeveloperAccount

router = APIRouter(prefix="/api/v1/developer/settings", tags=["Developer Settings"])

STORAGE_KEY = "response_messages"

DEFAULT_RESPONSES = {
    "init": {
        "APP_DISABLED": "This app is disabled",
        "APP_NOT_FOUND": "App not registered for this owner",
        "COUNTRY_BLOCKED": "Access is not available in your region",
        "HASH_ERROR": "Invalid password hash format",
        "INVALID_HASH": "This build is not approved by the developer",
        "INVALID_SECRET": "Invalid app secret",
        "IP_BLOCKED": "Your IP address has been blocked",
        "IP_NOT_WHITELISTED": "IP address is not whitelisted",
        "UPDATE_REQUIRED": "Please update your app to the latest version",
        "VERSION_MISMATCH": "Client version does not match server version",
        "VPN_BLOCKED": "VPN and proxy connections are not allowed",
    },
    "auth": {
        "DEVICE_BANNED": "Device is banned",
        "DEVICE_EXPIRED": "Device expired",
        "DEVICE_LIMIT_REACHED": "Device limit reached",
        "DEVICE_NOT_FOUND": "Device not found",
        "DEVICE_PAUSED": "Device is paused",
        "INVALID_PASSWORD": "Password incorrect",
        "INVALID_SESSION": "Invalid or expired session",
        "LICENSE_BANNED": "License is banned",
        "LICENSE_EXPIRED": "License has expired",
        "LICENSE_IN_USE": "License is already in use",
        "LICENSE_NOT_FOUND": "License not found",
        "LICENSE_PAUSED": "License is paused",
        "MOTHERBOARD_BANNED": "Motherboard is banned",
        "MOTHERBOARD_EXPIRED": "Motherboard access has expired",
        "MOTHERBOARD_NOT_FOUND": "Motherboard not found",
        "MOTHERBOARD_PAUSED": "Motherboard is paused",
        "PROCESSOR_BANNED": "Processor is banned",
        "PROCESSOR_EXPIRED": "Processor access has expired",
        "PROCESSOR_NOT_FOUND": "Processor not found",
        "PROCESSOR_PAUSED": "Processor is paused",
        "SESSION_EXPIRED": "Session expired",
        "USER_BANNED": "This account is banned",
        "USER_EXPIRED": "This account has expired",
        "USER_NOT_FOUND": "User not found",
        "USER_PAUSED": "This account is paused",
    },
    "general": {
        "FORBIDDEN": "Access forbidden",
        "INVALID_TOKEN": "Invalid token",
        "MISSING_FIELDS": "Missing required fields",
        "RATE_LIMITED": "Too many requests, please try again later",
        "SID_BLOCKED": "Your system ID has been blocked",
        "SID_NOT_WHITELISTED": "System ID is not whitelisted",
        "UNAUTHORIZED": "Unauthorized access",
    },
}

class ResponseMessagesUpdate(BaseModel):
    init: Dict[str, str]
    auth: Dict[str, str]
    general: Dict[str, str]

@router.get("/response-messages")
async def get_response_messages(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(SystemSetting).where(SystemSetting.key == STORAGE_KEY))
    row = res.scalars().first()

    stored = {}
    if row:
        import json
        stored = json.loads(row.value)

    merged = {}
    for category in ("init", "auth", "general"):
        defaults = DEFAULT_RESPONSES.get(category, {})
        overrides = stored.get(category, {})
        merged[category] = {**defaults, **(overrides if isinstance(overrides, dict) else {})}

    return merged


@router.put("/response-messages")
async def update_response_messages(
    payload: ResponseMessagesUpdate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    import json

    res = await db.execute(select(SystemSetting).where(SystemSetting.key == STORAGE_KEY))
    row = res.scalars().first()

    merged = {}
    for category in ("init", "auth", "general"):
        defaults = DEFAULT_RESPONSES.get(category, {})
        incoming = getattr(payload, category, {})
        merged[category] = {**defaults, **incoming}

    if row:
        row.value = json.dumps(merged)
    else:
        row = SystemSetting(key=STORAGE_KEY, value=json.dumps(merged), description="Custom response messages")
        db.add(row)

    await db.commit()
    return {"status": "success", "messages": merged}


@router.delete("/response-messages")
async def reset_response_messages(
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(SystemSetting).where(SystemSetting.key == STORAGE_KEY))
    row = res.scalars().first()
    if row:
        await db.delete(row)
        await db.commit()
    return {"status": "success", "messages": DEFAULT_RESPONSES}
