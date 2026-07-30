import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AuthSys"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180  # 3 hours default
    ACCESS_TOKEN_REMEMBER_DAYS: int = 1  # 24 hours with remember-me
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_NAME: str = "rinox_token"
    ADMIN_COOKIE_NAME: str = "rinox_admin_token"
    COOKIE_PATH: str = "/"
    COOKIE_SAMESITE: str = "none"

    DATABASE_URL: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "https://authsys.dpdns.org",
        "https://api.authsys.dpdns.org",
        "https://authsys-00-production.up.railway.app",
    ]

    # OAuth provider credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    AZURE_TENANT_ID: str = "common"

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@authsys.com"
    EMAILS_FROM_NAME: str = "AuthSys"
    
    MOCK_EMAIL: bool = False
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    TURNSTILE_SECRET_KEY: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def resolve_env_aliases(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data

        if not data.get("DATABASE_URL"):
            for key in (
                "POSTGRES_URL",
                "POSTGRES_URL_NON_POOLING",
                "POSTGRES_PRISMA_URL",
                "DATABASE_URL_UNPOOLED",
                "DATABASE_PUBLIC_URL",
            ):
                value = os.getenv(key)
                if value:
                    data["DATABASE_URL"] = value
                    break

        if not data.get("REDIS_URL"):
            for key in ("REDIS_URL", "UPSTASH_REDIS_URL", "KV_URL"):
                value = os.getenv(key)
                if value:
                    data["REDIS_URL"] = value
                    break

        return data


settings = Settings()

if not settings.SECRET_KEY:
    import sys as _sys
    import logging as _logging
    _logging.getLogger(__name__).critical(
        "SECRET_KEY is not set! Generate a strong key and set it via "
        "the SECRET_KEY environment variable or .env file."
    )
    _sys.exit(1)
