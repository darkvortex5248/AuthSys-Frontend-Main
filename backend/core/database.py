import re
import ssl
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base

from core.config import settings

# ── CockroachDB compatibility ──────────────────────────────────────
# SQLAlchemy's PostgreSQL dialect fails to parse CockroachDB's version
# string (e.g. "CockroachDB CCL v26.2.1 ..."). Patch the parser so it
# extracts the version number and returns a tuple SQLAlchemy expects.
from sqlalchemy.dialects.postgresql.base import PGDialect

_pg_version_orig = PGDialect._get_server_version_info

def _pg_version_patched(self, connection):
    raw = connection.exec_driver_sql("SELECT version()").scalar()
    if raw and "CockroachDB" in raw:
        m = re.search(r"v?(\d+)\.(\d+)\.(\d+)", raw)
        if m:
            return tuple(int(x) for x in m.groups()) + (0,)
        return (26, 0, 0, 0)  # safe fallback
    return _pg_version_orig(self, connection)

PGDialect._get_server_version_info = _pg_version_patched

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
    is_cockroach = "cockroachlabs.cloud" in parsed.netloc
    ssl_required = is_cockroach or "neon.tech" in parsed.netloc or "railway.app" in parsed.netloc or "supabase.co" in parsed.netloc
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
    # Generous timeouts so schema migrations don't get killed mid-way
    connect_args["timeout"] = 30                    # connection timeout (sec)
    connect_args["command_timeout"] = 120           # per-query timeout (sec) — long enough for ALTER TABLE
    if is_cockroach:
        connect_args["server_settings"] = {
            "statement_timeout": "0",              # no per-statement timeout
            "lock_timeout": "30000",               # 30s lock wait
        }
    else:
        connect_args["server_settings"] = {
            "statement_timeout": "0",              # no per-statement timeout
            "lock_timeout": "30000",               # 30s lock wait
            "idle_in_transaction_session_timeout": "60000",
        }

    return clean_url, connect_args


db_url, _connect_args = build_async_database_url(settings.DATABASE_URL)

from sqlalchemy.pool import NullPool

engine = create_async_engine(
    db_url,
    connect_args=_connect_args,
    echo=False,
    poolclass=NullPool,
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


async def create_tables():
    """Create all tables in the database automatically"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
