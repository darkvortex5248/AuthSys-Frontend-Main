import asyncio
from sqlalchemy import text
from core.database import engine

async def check():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, timestamp FROM activity_logs"))
        for r in res:
            print(r)

if __name__ == "__main__":
    asyncio.run(check())
