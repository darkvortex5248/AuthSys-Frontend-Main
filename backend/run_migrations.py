"""Run Alembic migrations safely, handling existing tables from create_all."""
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("migrations")

from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from core.config import settings
from core.database import build_async_database_url

def has_migration_history(database_url: str) -> bool:
    """Check if alembic_version table exists and has entries."""
    # Use sync URL for a quick check (async not needed for inspection)
    sync_url = database_url
    if sync_url.startswith("postgresql+asyncpg://"):
        sync_url = sync_url.replace("+asyncpg", "", 1)
    elif sync_url.startswith("postgresql+psycopg2://"):
        sync_url = sync_url.replace("+psycopg2", "", 1)
    elif sync_url.startswith("postgres://"):
        sync_url = sync_url.replace("postgres://", "postgresql://", 1)
    try:
        engine = create_engine(sync_url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            tables = [row[0] for row in conn.execute(
                text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'")
            )]
            if "alembic_version" not in tables:
                engine.dispose()
                return False
            count = conn.execute(text("SELECT COUNT(*) FROM alembic_version")).scalar()
            engine.dispose()
            return count > 0
    except Exception as exc:
        logger.warning("Migration history check failed (non-fatal): %s", exc)
        return False  # Assume no history so we stamp

def main():
    async_url, _ = build_async_database_url(settings.DATABASE_URL)
    
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", async_url)

    if not has_migration_history(settings.DATABASE_URL):
        logger.info("[MIGRATE] No migration history found. Stamping with current schema state...")
        try:
            # Stamp as the parent of our new migration, so only f1a2b3c4d5e6 runs
            command.stamp(cfg, "e1f2a3b4c5d6")
            logger.info("[MIGRATE] Stamped at e1f2a3b4c5d6 (migrations 1-5 assumed applied via create_all)")
        except Exception as exc:
            logger.warning("[MIGRATE] Stamp failed (may already have history): %s", exc)
    else:
        logger.info("[MIGRATE] Migration history found. Proceeding to upgrade...")

    try:
        command.upgrade(cfg, "head")
        logger.info("[MIGRATE] All migrations applied successfully.")
    except Exception as exc:
        logger.error("[MIGRATE] Upgrade failed: %s", exc)
        sys.exit(1)

if __name__ == "__main__":
    main()
