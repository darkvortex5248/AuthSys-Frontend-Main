from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.config import settings
from core.security import get_password_hash, create_access_token
from models.domain import DeveloperAccount, SubscriptionPlan
from routers.developer_sessions import record_session
import httpx
import uuid
from datetime import timedelta
from typing import Optional

router = APIRouter(prefix="/api/v1/developer/auth", tags=["Developer OAuth"])


async def _find_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_id: str,
    email: str,
    name: str,
    avatar_url: Optional[str] = None,
):
    provider_field_map = {
        "google": "google_id",
        "github": "github_id",
        "discord": "discord_id",
        "azure": "azure_id",
    }
    id_field = provider_field_map.get(provider)
    if not id_field:
        return None, "Unsupported provider"

    filter_cond = getattr(DeveloperAccount, id_field) == provider_id
    result = await db.execute(select(DeveloperAccount).where(filter_cond))
    user = result.scalars().first()

    if user:
        if user.is_banned:
            return None, "Your account has been banned. Please contact support."
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        await db.commit()
        await db.refresh(user)
        return user, None

    existing_email = await db.execute(
        select(DeveloperAccount).where(DeveloperAccount.email == email)
    )
    email_user = existing_email.scalars().first()
    if email_user:
        setattr(email_user, id_field, provider_id)
        if avatar_url and not email_user.avatar_url:
            email_user.avatar_url = avatar_url
        await db.commit()
        await db.refresh(email_user)
        return email_user, None

    random_password = str(uuid.uuid4())
    hashed_password = get_password_hash(random_password)
    base_username = email.split("@")[0]
    username_result = await db.execute(
        select(DeveloperAccount).where(DeveloperAccount.username == base_username)
    )
    if username_result.scalars().first():
        base_username = f"{base_username}_{str(uuid.uuid4())[:6]}"

    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.name == "Free")
    )
    free_plan = plan_result.scalars().first()

    user = DeveloperAccount(
        username=base_username,
        email=email,
        password_hash=hashed_password,
        is_verified=True,
        plan_id=free_plan.id if free_plan else None,
        subscription_tier="tester",
    )
    setattr(user, id_field, provider_id)
    if avatar_url:
        user.avatar_url = avatar_url

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, None


async def _issue_jwt(user: DeveloperAccount, request: Request, db: AsyncSession):
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    await record_session(
        user.id, access_token,
        request.client.host if request.client else "unknown",
        request.headers.get("user-agent", ""),
        db,
    )
    secure = request.url.scheme == "https"
    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path=settings.COOKIE_PATH,
    )
    return response


@router.post("/oauth/callback")
async def oauth_callback(
    request: Request,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    code = body.get("code")
    provider = body.get("provider")
    if not code or not provider:
        raise HTTPException(status_code=400, detail="Missing code or provider")

    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise HTTPException(status_code=400, detail="Google OAuth not configured")
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": body.get("redirect_uri", ""),
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token", data=token_data
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange Google code")
            tokens = token_res.json()

        id_token = tokens.get("id_token")
        access_token = tokens.get("access_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="No id_token from Google")

        async with httpx.AsyncClient() as client:
            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get Google user info")
            userinfo = userinfo_res.json()

        provider_id = userinfo.get("sub")
        email = userinfo.get("email", "")
        name = userinfo.get("name", "")
        avatar_url = userinfo.get("picture", "")

    elif provider == "github":
        if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
            raise HTTPException(status_code=400, detail="GitHub OAuth not configured")
        token_data = {
            "code": code,
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "redirect_uri": body.get("redirect_uri", ""),
        }
        headers = {"Accept": "application/json"}
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                data=token_data,
                headers=headers,
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange GitHub code")
            tokens = token_res.json()

        gh_token = tokens.get("access_token")
        if not gh_token:
            raise HTTPException(status_code=400, detail="No access_token from GitHub")

        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github.v3+json"},
            )
            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get GitHub user")
            gh_user = user_res.json()

            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github.v3+json"},
            )
            emails = email_res.json() if email_res.status_code == 200 else []
            primary_email = next(
                (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                gh_user.get("email", ""),
            )

        provider_id = str(gh_user.get("id"))
        email = primary_email
        name = gh_user.get("name") or gh_user.get("login", "")
        avatar_url = gh_user.get("avatar_url", "")

    elif provider == "discord":
        if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
            raise HTTPException(status_code=400, detail="Discord OAuth not configured")
        token_data = {
            "code": code,
            "client_id": settings.DISCORD_CLIENT_ID,
            "client_secret": settings.DISCORD_CLIENT_SECRET,
            "redirect_uri": body.get("redirect_uri", ""),
            "grant_type": "authorization_code",
            "scope": "identify email",
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://discord.com/api/oauth2/token", data=token_data, headers=headers
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange Discord code")
            tokens = token_res.json()

        discord_token = tokens.get("access_token")
        if not discord_token:
            raise HTTPException(status_code=400, detail="No access_token from Discord")

        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {discord_token}"},
            )
            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get Discord user")
            dc_user = user_res.json()

        provider_id = dc_user.get("id")
        email = dc_user.get("email", "")
        name = dc_user.get("global_name") or dc_user.get("username", "")
        avatar_hash = dc_user.get("avatar", "")
        avatar_url = f"https://cdn.discordapp.com/avatars/{provider_id}/{avatar_hash}.png" if avatar_hash else ""

    elif provider == "azure":
        if not settings.AZURE_CLIENT_ID or not settings.AZURE_CLIENT_SECRET:
            raise HTTPException(status_code=400, detail="Azure OAuth not configured")
        tenant = settings.AZURE_TENANT_ID
        token_data = {
            "code": code,
            "client_id": settings.AZURE_CLIENT_ID,
            "client_secret": settings.AZURE_CLIENT_SECRET,
            "redirect_uri": body.get("redirect_uri", ""),
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
                data=token_data,
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange Azure code")
            tokens = token_res.json()

        azure_token = tokens.get("access_token")
        if not azure_token:
            raise HTTPException(status_code=400, detail="No access_token from Azure")

        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {azure_token}"},
            )
            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get Azure user")
            az_user = user_res.json()

        provider_id = az_user.get("id")
        email = az_user.get("userPrincipalName", "")
        name = az_user.get("displayName", "")
        avatar_url = ""

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not provider_id or not email:
        raise HTTPException(status_code=400, detail="Failed to get user identity from provider")

    user, error = await _find_or_create_oauth_user(
        db, provider, provider_id, email, name, avatar_url
    )
    if error:
        raise HTTPException(status_code=403, detail=error)

    return await _issue_jwt(user, request, db)


@router.post("/google-login")
async def google_login(
    request: Request,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    credential = body.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing credential")

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")

    async with httpx.AsyncClient() as client:
        verify_res = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        )
        if verify_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google credential")
        userinfo = verify_res.json()

    aud = userinfo.get("aud")
    if aud != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Token audience mismatch")

    provider_id = userinfo.get("sub")
    email = userinfo.get("email", "")
    name = userinfo.get("name", "")
    avatar_url = userinfo.get("picture", "")

    user, error = await _find_or_create_oauth_user(
        db, "google", provider_id, email, name, avatar_url
    )
    if error:
        raise HTTPException(status_code=403, detail=error)

    return await _issue_jwt(user, request, db)
