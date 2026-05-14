import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import DeveloperAccount
from routers.developer_analytics import get_overview

async def test():
    async with AsyncSessionLocal() as db:
        # Fetch dev 1
        res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == 1))
        dev = res.scalars().first()
        
        # Call get_overview
        stats = await get_overview(7, dev, db)
        print(f"Overview for Dev 1: {stats['total_apps']} apps")

if __name__ == "__main__":
    asyncio.run(test())
