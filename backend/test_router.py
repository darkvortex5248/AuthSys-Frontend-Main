import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import DeveloperAccount, SubscriptionPlan
from routers.developer_apps import create_app
from schemas.dashboard import AppCreate

async def test():
    async with AsyncSessionLocal() as db:
        # Fetch dev 1
        res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == 1))
        dev = res.scalars().first()
        
        # Call create_app
        req = AppCreate(name="Router Test App", version="1.0", min_version="1.0", hwid_enabled=True)
        try:
            new_app = await create_app(req, dev, db)
            print(f"Successfully created app via router: {new_app.name}")
        except Exception as e:
            print(f"Error calling router: {e}")

if __name__ == "__main__":
    asyncio.run(test())
