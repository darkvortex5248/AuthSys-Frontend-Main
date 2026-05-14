import asyncio
from sqlalchemy import text
from core.database import engine

async def check():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, created_at FROM license_keys WHERE created_at IS NULL"))
        null_created = res.fetchall()
        print(f"License keys with NULL created_at: {len(null_created)}")
        
        res = await conn.execute(text("SELECT id FROM end_users WHERE created_at IS NULL"))
        null_users = res.fetchall()
        print(f"Users with NULL created_at: {len(null_users)}")

if __name__ == "__main__":
    asyncio.run(check())
