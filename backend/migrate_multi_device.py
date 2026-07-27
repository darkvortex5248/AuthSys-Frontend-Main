"""
Migration script: Add multi-device HWID support columns.

Adds:
- end_users.hwids (JSON) - list of allowed HWIDs per user
- end_users.max_devices (Integer) - device limit per user
- license_keys.max_devices (Integer) - device limit per license key

Backfills existing data:
- end_users.hwids: populated from existing hwid value
- end_users.max_devices: set from license_key.max_uses or default 1
- license_keys.max_devices: set from max_uses or default 1

Usage: python migrate_multi_device.py
"""
import asyncio
import logging
from sqlalchemy import text, select, update
from core.database import engine, AsyncSessionLocal
from models.domain import EndUser, LicenseKey

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_column_exists(conn, table_name, column_name):
    result = await conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :col"
    ), {"table": table_name, "col": column_name})
    return result.fetchone() is not None


async def add_column(conn, table_name, column_name, column_def):
    exists = await check_column_exists(conn, table_name, column_name)
    if exists:
        logger.info(f"  Column {table_name}.{column_name} already exists, skipping")
        return
    await conn.execute(text(
        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}"
    ))
    logger.info(f"  Added column {table_name}.{column_name}")


async def migrate():
    logger.info("Starting multi-device HWID migration...")

    async with engine.begin() as conn:
        # Add new columns
        await add_column(conn, "end_users", "hwids", "JSON DEFAULT '[]'::jsonb")
        await add_column(conn, "end_users", "max_devices", "INTEGER DEFAULT 1")
        await add_column(conn, "license_keys", "max_devices", "INTEGER DEFAULT 1")

    # Backfill data
    async with AsyncSessionLocal() as db:
        # Backfill end_users.hwids from existing hwid
        result = await db.execute(
            select(EndUser).where(EndUser.hwid.isnot(None), EndUser.hwid != '')
        )
        users = result.scalars().all()
        for user in users:
            if not user.hwids:
                user.hwids = [user.hwid]
            if user.max_devices is None or user.max_devices < 1:
                user.max_devices = 1
        logger.info(f"  Backfilled hwids for {len(users)} users")

        # Backfill end_users.max_devices from license_key.max_uses
        result = await db.execute(
            select(EndUser).where(EndUser.license_key_id.isnot(None))
        )
        users_with_keys = result.scalars().all()
        for user in users_with_keys:
            if user.max_devices is None or user.max_devices < 1:
                key_result = await db.execute(
                    select(LicenseKey).where(LicenseKey.id == user.license_key_id)
                )
                key = key_result.scalars().first()
                if key and key.max_uses is not None and key.max_uses >= 1:
                    user.max_devices = key.max_uses
                else:
                    user.max_devices = 1
        logger.info(f"  Backfilled max_devices for {len(users_with_keys)} users")

        # Backfill license_keys.max_devices from max_uses
        result = await db.execute(select(LicenseKey))
        keys = result.scalars().all()
        for key in keys:
            if key.max_devices is None or key.max_devices < 1:
                if key.max_uses is not None and key.max_uses >= 1:
                    key.max_devices = key.max_uses
                else:
                    key.max_devices = 1
        logger.info(f"  Backfilled max_devices for {len(keys)} license keys")

        await db.commit()

    logger.info("Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
