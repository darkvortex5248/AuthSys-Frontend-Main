import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine
from core.config import settings
from models.domain import Application

async def check_apps():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        res = await conn.execute(select(Application))
        apps = res.all()
        for a in apps:
            print(f"ID: {a.id} | Name: {a.name} | Secret: {a.app_secret} | OwnerID: {a.owner_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_apps())
