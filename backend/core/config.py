import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AuthSys"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000"
    ]

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@authsys.com"
    EMAILS_FROM_NAME: str = "AuthSys"
    
    MOCK_EMAIL: bool = True
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    TURNSTILE_SECRET_KEY: str = ""

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
