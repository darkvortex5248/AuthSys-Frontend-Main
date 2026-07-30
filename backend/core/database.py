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
    connect_args["timeout"] = 30
    connect_args["command_timeout"] = 120
    if is_cockroach:
        connect_args["server_settings"] = {
            "statement_timeout": "0",
            "lock_timeout": "30000",
        }
    else:
        connect_args["server_settings"] = {
            "statement_timeout": "0",
            "lock_timeout": "30000",
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
        try:
            yield session
        except Exception:
            if session.in_transaction():
                await session.rollback()
            raise


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


_TYPE_MAP = {
    "INTEGER": "INTEGER",
    "BIGINT": "BIGINT",
    "SMALLINT": "SMALLINT",
    "VARCHAR": "VARCHAR",
    "TEXT": "TEXT",
    "BOOLEAN": "BOOLEAN",
    "FLOAT": "FLOAT",
    "REAL": "REAL",
    "NUMERIC": "NUMERIC",
    "JSON": "JSON",
    "DATETIME": "TIMESTAMP WITH TIME ZONE",
    "TIMESTAMP": "TIMESTAMP WITH TIME ZONE",
    "DATE": "DATE",
    "BLOB": "BYTEA",
    "LargeBinary": "BYTEA",
}


def _col_type_sql(col) -> str:
    t = col.type
    type_name = t.__class__.__name__.upper()
    if type_name in _TYPE_MAP:
        return _TYPE_MAP[type_name]
    if hasattr(t, "impl") and t.impl is not None:
        return _col_type_sql(t.impl)
    return "VARCHAR"


def _col_default_sql(col) -> str | None:
    if col.default is not None and col.default.is_scalar:
        v = col.default.arg
        if isinstance(v, bool):
            return "TRUE" if v else "FALSE"
        if isinstance(v, int):
            return str(v)
        if isinstance(v, str):
            return f"'{v}'"
    if col.server_default is not None:
        raw = str(col.server_default.arg)
        if raw:
            return raw
    return None


def _get_model_columns() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for table_name, table in Base.metadata.tables.items():
        cols: dict[str, object] = {}
        for col in table.columns:
            cols[col.name] = col
        result[table_name] = cols
    return result


async def auto_sync_schema(db: AsyncSession) -> list[str]:
    """
    Detect model columns missing from the live DB and add them via ALTER TABLE.
    This is a safety net for schema drift that Alembic migrations miss.
    Returns a list of ALTER TABLE statements that were executed.
    """
    import logging
    logger = logging.getLogger(__name__)
    from sqlalchemy import text

    applied: list[str] = []
    model_cols = _get_model_columns()
    total_tables = len(model_cols)
    checked = 0
    repaired = 0

    logger.info("[SCHEMA] Starting schema verification for %d tables...", total_tables)

    for table_name, cols in model_cols.items():
        checked += 1
        logger.info("[SCHEMA]   Checking table %s... (%d/%d)", table_name, checked, total_tables)

        try:
            res = await db.execute(text(
                "SELECT column_name, data_type, is_nullable, column_default "
                "FROM information_schema.columns "
                f"WHERE table_name = '{table_name}' "
                "ORDER BY ordinal_position"
            ))
            existing_rows = res.fetchall()
            existing = {row[0]: row for row in existing_rows}
        except Exception as exc:
            logger.warning("[SCHEMA]   ⚠ Cannot read columns for %s: %s", table_name, exc)
            continue

        for col_name, col in sorted(cols.items(), key=lambda x: x[0]):
            if col_name in existing:
                row = existing[col_name]
                # Check type compatibility
                db_type = row[1].upper() if row[1] else ""
                model_type = _col_type_sql(col).upper()
                is_nullable = row[2] == "YES"
                model_nullable = col.nullable
                if model_type.startswith("TIMESTAMP") and db_type.startswith("TIMESTAMP"):
                    pass  # timezone variant is OK
                elif model_type.startswith("VARCHAR") and db_type.startswith("VARCHAR"):
                    pass  # VARCHAR without length is OK
                elif model_type.startswith("INTEGER") and db_type.startswith("INTEGER"):
                    pass
                elif model_type != db_type and "TIME" not in model_type:
                    logger.info(
                        "[SCHEMA]   ∼ %s: type differs (model=%s, db=%s)",
                        col_name, model_type, db_type,
                    )
                continue

            col_type = _col_type_sql(col)
            default = _col_default_sql(col)
            default_clause = f" DEFAULT {default}" if default else ""

            alter = (
                f"ALTER TABLE {table_name} "
                f"ADD COLUMN IF NOT EXISTS {col_name} {col_type}{default_clause}"
            )
            try:
                logger.info("[SCHEMA]   + Adding missing column: %s (%s)", col_name, col_type)
                await db.execute(text(alter))
                applied.append(f"ADD {table_name}.{col_name} ({col_type})")
                repaired += 1
            except Exception as exc:
                logger.warning("[SCHEMA]   ✗ Failed to add %s.%s: %s", table_name, col_name, exc)
                applied.append(f"FAILED: {table_name}.{col_name} — {exc}")

    if applied:
        await db.commit()
        logger.info("[SCHEMA] ✓ Schema auto-sync complete: %d columns added across %d tables", repaired, checked)
        for stmt in applied:
            logger.info("[SCHEMA]   → %s", stmt)
    else:
        await db.commit()
        logger.info("[SCHEMA] ✓ All %d columns in all %d tables verified — no changes needed", 
                     sum(len(c) for c in model_cols.values()), checked)

    return applied
