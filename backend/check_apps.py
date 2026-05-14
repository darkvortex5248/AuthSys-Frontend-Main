import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import Application, DeveloperAccount

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DeveloperAccount))
        devs = res.scalars().all()
        for dev in devs:
            app_res = await db.execute(select(Application).where(Application.developer_id == dev.id))
            apps = app_res.scalars().all()
            print(f"Dev: {dev.username} (ID: {dev.id}), Apps: {[a.id for a in apps]}")

if __name__ == "__main__":
    asyncio.run(check())
