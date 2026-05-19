import ssl
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base

from core.config import settings

# libpq query params that asyncpg/SQLAlchemy must not forward to connect()
_STRIP_QUERY_KEYS = frozenset(
    {
        "sslmode",
        "ssl",
        "sslcert",
        "sslkey",
        "sslrootcert",
        "channel_binding",
        "options",
    }
)


def build_async_database_url(raw_url: str) -> tuple[str, dict]:
    """Normalize Postgres URLs for SQLAlchemy + asyncpg on Vercel/Railway/Neon."""
    url = str(raw_url or "").strip().strip("\"'")
    if not url:
        raise ValueError(
            "DATABASE_URL is not set. Configure DATABASE_URL or POSTGRES_URL in Vercel."
        )

    if "://" not in url:
        url = f"postgresql+asyncpg://{url}"
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    ssl_required = "neon.tech" in parsed.netloc
    clean_pairs: list[tuple[str, str]] = []

    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        key_lower = key.lower()
        if key_lower in _STRIP_QUERY_KEYS:
            if key_lower in ("sslmode", "ssl") and value.lower() not in (
                "disable",
                "allow",
                "prefer",
                "false",
                "0",
                "",
            ):
                ssl_required = True
            continue
        clean_pairs.append((key, value))

    clean_url = urlunparse(parsed._replace(query=urlencode(clean_pairs)))

    connect_args: dict = {}
    if ssl_required:
        connect_args["ssl"] = ssl.create_default_context()

    return clean_url, connect_args


db_url, _connect_args = build_async_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    db_url,
    connect_args=_connect_args,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
