import asyncio
from sqlalchemy import text
from core.database import engine

async def check():
    async with engine.begin() as conn:
        try:
            res = await conn.execute(text("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'end_users'"))
            for r in res:
                print(r)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
