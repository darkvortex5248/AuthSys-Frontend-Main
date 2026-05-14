import asyncio
from sqlalchemy import text
from core.database import engine
from datetime import datetime, timezone

async def deep_fix():
    async with engine.begin() as conn:
        now = datetime.now(timezone.utc)
        
        # Fix Users
        await conn.execute(text("UPDATE end_users SET created_at = :now WHERE created_at IS NULL"), {"now": now})
        await conn.execute(text("UPDATE end_users SET login_count = 0 WHERE login_count IS NULL"))
        await conn.execute(text("UPDATE end_users SET hwid_reset_count = 0 WHERE hwid_reset_count IS NULL"))
        await conn.execute(text("UPDATE end_users SET hwid_reset_allowed = 1 WHERE hwid_reset_allowed IS NULL"))
        
        # Fix License Keys
        await conn.execute(text("UPDATE license_keys SET created_at = :now WHERE created_at IS NULL"), {"now": now})
        await conn.execute(text("UPDATE license_keys SET current_uses = 0 WHERE current_uses IS NULL"))
        await conn.execute(text("UPDATE license_keys SET is_paused = False WHERE is_paused IS NULL"))
        
        # Fix Applications (just in case)
        await conn.execute(text("UPDATE applications SET created_at = :now WHERE created_at IS NULL"), {"now": now})
        await conn.execute(text("UPDATE applications SET hash_check = False WHERE hash_check IS NULL"))
        
        print("Database deep fix completed.")

if __name__ == "__main__":
    asyncio.run(deep_fix())
