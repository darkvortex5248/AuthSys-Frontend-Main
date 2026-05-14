import asyncio
from core.database import engine
from sqlalchemy import text

async def run_fix():
    async with engine.begin() as conn:
        try:
            # 1. Update existing records
            await conn.execute(text("UPDATE end_users SET is_shadow = TRUE WHERE password_hash = 'license_only_login'"))
            print('Updated existing shadow users')
        except Exception as e:
            print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(run_fix())
