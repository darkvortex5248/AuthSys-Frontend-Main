from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
from starlette.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from typing import Any
import json

from core.config import settings
from core.limiter import limiter
from routers import (
    developer_auth, client_api, developer_apps, developer_keys,
    developer_users, blacklist, admin, developer_analytics,
    variables, webhooks, ai_chat, billing, developer_team, developer_bots,
    discord_interactions, chatrooms, seller_api, developer_responses, pricing,
    developer_notifications,
    developer_sessions, developer_security, developer_domains,
    developer_backups, developer_environments, developer_health,
    developer_organization, developer_usage, developer_scheduled,
    developer_devices, developer_subscription,
    admin_custom_plans, oauth, device_client, developer_device_groups,
)
import asyncio
import logging
import os
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# ── Safe Integer JSON Serialization ─────────────────────────────
# CockroachDB generates 64-bit IDs (e.g. 1196385953220427800) that
# exceed JavaScript's Number.MAX_SAFE_INTEGER (2^53 = 9007199254740992).
# Serialize them as strings so the frontend receives the exact value.
_JS_SAFE_INT_MAX = 1 << 53  # 9007199254740992

def _convert_large_ints(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _convert_large_ints(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_large_ints(v) for v in obj]
    if isinstance(obj, int) and (obj > _JS_SAFE_INT_MAX or obj < -_JS_SAFE_INT_MAX):
        return str(obj)
    return obj

class SafeIntJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            _convert_large_ints(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            default=str,
        ).encode("utf-8")

# ── End safe int serializer ─────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    default_response_class=SafeIntJSONResponse,
)

# Setup SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    import time
    start = time.time()
    logger.info("[STARTUP] Step 1: Beginning startup event...")
    # Signal that the app is ready to accept traffic immediately.
    # Heavy DB bootstrap runs in background so healthcheck isn't blocked.
    try:
        from core.database import AsyncSessionLocal, create_tables
        from services.bootstrap import run_bootstrap
        # Yield control so uvicorn can finish startup immediately
        async def _background_bootstrap():
            try:
                logger.info("[BOOTSTRAP-BG] Starting background DB schema/migration...")
                await asyncio.wait_for(create_tables(), timeout=300)
                logger.info("[BOOTSTRAP-BG] Tables created (%.1fs)", time.time() - start)
            except asyncio.TimeoutError:
                logger.error("[BOOTSTRAP-BG] create_tables() TIMEOUT (>300s). Tables may still exist; proceeding to seed...")
            except Exception as exc:
                logger.exception("[BOOTSTRAP-BG] create_tables() Failed: %s", exc)
                return
            try:
                async with AsyncSessionLocal() as db:
                    result = await asyncio.wait_for(run_bootstrap(db), timeout=600)
                    logger.info("[BOOTSTRAP-BG] Done (%.1fs): %s", time.time() - start, result)
            except asyncio.TimeoutError:
                logger.error("[BOOTSTRAP-BG] run_bootstrap() TIMEOUT (>600s). Will retry on next deploy.")
            except Exception as exc:
                logger.exception("[BOOTSTRAP-BG] run_bootstrap() Failed: %s", exc)

        asyncio.create_task(_background_bootstrap())
    except Exception as exc:
        logger.exception("[STARTUP] Could not schedule background bootstrap: %s", exc)

    logger.info("[STARTUP] Done. Background tasks running. App is live. (%.1fs)", time.time() - start)

@app.on_event("shutdown")
async def shutdown_event():
    pass

# CORS Middleware - Allow Vercel and localhost origins
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    # Hostnames treated as local development origins (matched exactly, not as
    # substrings — a substring check like `"localhost" in origin` is exploitable
    # by origins such as https://evil-localhost.attacker.com).
    _LOCAL_HOSTS = {"localhost", "127.0.0.1", "[::1]"}

    @classmethod
    def _is_local_origin(cls, origin: str) -> bool:
        try:
            parsed = urlparse(origin)
        except (ValueError, TypeError):
            return False
        host = parsed.hostname or ""
        # hostname is lowercased by urlparse; compare exactly against local hosts.
        return host in cls._LOCAL_HOSTS

    @classmethod
    def _origin_allowed(cls, origin: str, allowed_origins: list[str]) -> bool:
        if not origin:
            return False
        if origin in allowed_origins:
            return True
        # Allow common deployment hosts
        if origin.endswith(".vercel.app") or origin.endswith(".onrender.com") or origin.endswith(".railway.app") or origin.endswith(".up.railway.app"):
            return True
        return cls._is_local_origin(origin)

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        allowed_origins = settings.BACKEND_CORS_ORIGINS
        is_allowed = self._origin_allowed(origin, allowed_origins)

        if request.method == "OPTIONS":
            response = StarletteResponse(status_code=200)
            if is_allowed:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
            return response

        response = await call_next(request)

        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"

        return response

app.add_middleware(DynamicCORSMiddleware)

# Maintenance Middleware with caching
_system_mode_cache = {"mode": "live", "last_fetch": 0.0}
import time

@app.middleware("http")
async def maintenance_middleware(request: Request, call_next):
    path = request.url.path
    if path == "/" or path.startswith("/api/v1/admin") or "/login" in path:
        return await call_next(request)
    
    # Cache system_mode for 30 seconds to avoid DB hit on every request
    mode = _system_mode_cache["mode"]
    if time.time() - _system_mode_cache["last_fetch"] > 30:
        from core.database import AsyncSessionLocal
        from models.domain import SystemSetting
        from sqlalchemy.future import select
        try:
            async with AsyncSessionLocal() as db:
                res = await db.execute(select(SystemSetting).where(SystemSetting.key == "system_mode"))
                setting = res.scalars().first()
                mode = setting.value if setting else "live"
                _system_mode_cache["mode"] = mode
                _system_mode_cache["last_fetch"] = time.time()
        except Exception:
            pass

    if mode == "maintenance":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"detail": "Platform is under maintenance. Please try again later."}
        )
    elif mode == "lockdown":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=403,
            content={"detail": "Security lockdown active. All external API traffic suspended."}
        )

    return await call_next(request)

# Include Routers
app.include_router(developer_auth.router)
app.include_router(client_api.router)
app.include_router(developer_apps.router)
app.include_router(developer_keys.router)
app.include_router(developer_users.router)
app.include_router(blacklist.router)
app.include_router(admin.router)
app.include_router(developer_analytics.router)
app.include_router(variables.router)
app.include_router(webhooks.router)
app.include_router(pricing.router)
app.include_router(ai_chat.router)
app.include_router(billing.router)
app.include_router(developer_team.router)
app.include_router(developer_bots.router)
app.include_router(discord_interactions.router)
app.include_router(chatrooms.router)
app.include_router(seller_api.router)
app.include_router(developer_responses.router)
app.include_router(developer_notifications.router)
app.include_router(developer_sessions.router)
app.include_router(developer_security.router)
app.include_router(developer_domains.router)
app.include_router(developer_backups.router)
app.include_router(developer_environments.router)
app.include_router(developer_health.router)
app.include_router(developer_organization.router)
app.include_router(developer_usage.router)
app.include_router(developer_scheduled.router)
app.include_router(developer_devices.router)
app.include_router(developer_device_groups.router)
app.include_router(admin_custom_plans.router)
app.include_router(oauth.router)
app.include_router(device_client.router)
app.include_router(developer_subscription.router)

# Background scheduler loop
import asyncio
from services.scheduler import scheduler_loop

@app.on_event("startup")
async def start_scheduler():
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return
    asyncio.create_task(scheduler_loop())

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "AuthSys API is running. Ready to authenticate."}
