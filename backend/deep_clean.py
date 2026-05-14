import asyncio
from sqlalchemy import text
from core.database import engine
from datetime import datetime, timezone

async def clean_db():
    async with engine.begin() as conn:
        # Fix hash_check
        await conn.execute(text("UPDATE applications SET hash_check = False WHERE hash_check IS NULL"))
        
        # Fix created_at
        now = datetime.now(timezone.utc)
        await conn.execute(text("UPDATE applications SET created_at = :now WHERE created_at IS NULL"), {"now": now})
        
        # Fix status
        await conn.execute(text("UPDATE applications SET status = 'active' WHERE status IS NULL"))
        
        # Fix version/min_version
        await conn.execute(text("UPDATE applications SET version = '1.0', min_version = '1.0' WHERE version IS NULL OR min_version IS NULL"))
        
        print("Database deep clean completed successfully.")

if __name__ == "__main__":
    asyncio.run(clean_db())
