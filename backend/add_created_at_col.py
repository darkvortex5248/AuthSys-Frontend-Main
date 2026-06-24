"""Add created_at column to activity_logs table."""
import asyncio, os, sys

# Make sure core modules can be imported
sys.path.insert(0, os.path.dirname(__file__))

from core.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='activity_logs' AND column_name='created_at'
        """))
        if result.first():
            print("✓ Column 'created_at' already exists")
        else:
            await conn.execute(text("""
                ALTER TABLE activity_logs 
                ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()
            """))
            print("✓ Column 'created_at' added to activity_logs table")
    await engine.dispose()

asyncio.run(main())
