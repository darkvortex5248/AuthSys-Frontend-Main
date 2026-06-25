import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AuthSys"
    API_V1_STR: str = "/api/v1"
    # WARNING: this in-code default is for local development only. A real,
    # strong SECRET_KEY MUST be provided via the SECRET_KEY env var in any
    # staging/production deployment — tokens signed with the dev key are not
    # trustworthy and are regenerated on every boot (invalidating sessions).
    SECRET_KEY: str = "dev-only-insecure-secret-key-change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180  # 3 hours default
    ACCESS_TOKEN_REMEMBER_DAYS: int = 1  # 24 hours with remember-me
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_NAME: str = "rinox_token"
    COOKIE_PATH: str = "/"
    COOKIE_SAMESITE: str = "lax"

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

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    # service_role key — server-only, NEVER expose to frontend. Required to
    # verify Supabase-issued JWTs server-side and to call the Auth Admin API.
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    # Project ref derived from SUPABASE_URL (e.g. vbnjhqnkmbjmvlfdlrpv).
    # Used to build the JWKS URL for RS256 verification.
    SUPABASE_PROJECT_REF: str = ""
    # When True, get_current_developer accepts Supabase-issued RS256 JWTs
    # alongside the legacy HS256 tokens (dual-verifier during migration).
    SUPABASE_AUTH_ENABLED: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def auto_enable_supabase_auth(self) -> "Settings":
        if not self.SUPABASE_AUTH_ENABLED:
            if self.SUPABASE_URL and self.SUPABASE_SERVICE_ROLE_KEY:
                self.SUPABASE_AUTH_ENABLED = True
        if self.SUPABASE_URL and not self.SUPABASE_PROJECT_REF:
            # e.g. https://vbnjhqnkmbjmvlfdlrpv.supabase.co → vbnjhqnkmbjmvlfdlrpv
            host = self.SUPABASE_URL.rstrip("/").split("//")[-1]
            self.SUPABASE_PROJECT_REF = host.split(".")[0]
        return self

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

if settings.SECRET_KEY == "dev-only-insecure-secret-key-change-me-in-production":
    import logging as _logging
    _logging.getLogger(__name__).warning(
        "SECRET_KEY is using the insecure built-in default. Set a strong "
        "SECRET_KEY environment variable — the dev default must never be used "
        "in staging/production (signed tokens are untrustworthy and rotate "
        "across restarts)."
    )
