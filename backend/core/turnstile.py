import httpx
from core.config import settings

async def verify_turnstile(token: str, ip: str = None) -> bool:
    if not settings.TURNSTILE_SECRET_KEY:
        # In production, fail closed if Turnstile is not configured
        if settings.ENVIRONMENT == "production":
            return False
        # In development, skip verification
        return True
    if not token:
        return False

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": ip
            }
        )
        res_data = response.json()
        return res_data.get("success", False)
