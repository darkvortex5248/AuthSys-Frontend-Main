from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from core.config import settings
from core.limiter import limiter
from routers import (
    developer_auth, client_api, developer_apps, developer_keys, 
    developer_users, blacklist, ai_agent, admin, developer_analytics,
    variables, webhooks, ai_chat, billing, developer_team, developer_bots,
    discord_interactions, chatrooms, seller_api
)
from services.bot_manager import manager as bot_manager
import asyncio
import logging
import os

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    # Long-running Discord/Telegram bots cannot run on Vercel serverless
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        logger.info("Skipping bot manager on serverless runtime")
        return

    async def _safe_start_bots():
        try:
            await bot_manager.start_all_bots()
        except Exception as exc:
            logger.warning("Bot manager failed to start: %s", exc)

    asyncio.create_task(_safe_start_bots())

# CORS Middleware - Allow Vercel and localhost origins
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        
        allowed_origins = settings.BACKEND_CORS_ORIGINS
        
        # Dynamically allow any vercel.app subdomain
        is_allowed = (
            origin in allowed_origins or
            origin.endswith(".vercel.app") or
            origin.endswith(".onrender.com") or
            "localhost" in origin or
            "127.0.0.1" in origin
        )
        
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

# Maintenance Middleware
@app.middleware("http")
async def maintenance_middleware(request: Request, call_next):
    # Skip for root, static, and admin routes
    path = request.url.path
    if path == "/" or path.startswith("/api/v1/admin") or "/login" in path:
        return await call_next(request)
        
    # Check System Mode
    from core.database import AsyncSessionLocal
    from models.domain import SystemSetting
    from sqlalchemy.future import select
    
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(SystemSetting).where(SystemSetting.key == "system_mode"))
            setting = res.scalars().first()
            mode = setting.value if setting else "live"
            
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
    except Exception:
        # If DB is down, assume live or handle gracefully
        pass
        
    return await call_next(request)

# Include Routers
app.include_router(developer_auth.router)
app.include_router(client_api.router)
app.include_router(developer_apps.router)
app.include_router(developer_keys.router)
app.include_router(developer_users.router)
app.include_router(blacklist.router)
app.include_router(ai_agent.router)
app.include_router(admin.router)
app.include_router(developer_analytics.router)
app.include_router(variables.router)
app.include_router(webhooks.router)
app.include_router(ai_chat.router)
app.include_router(billing.router)
app.include_router(developer_team.router)
app.include_router(developer_bots.router)
app.include_router(discord_interactions.router)
app.include_router(chatrooms.router)
app.include_router(seller_api.router)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "AuthSys API is running. Ready to authenticate."}
