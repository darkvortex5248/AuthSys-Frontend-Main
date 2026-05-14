import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import DeveloperAccount, Application
from routers.developer_users import create_user_manual, UserCreateManual

async def test():
    async with AsyncSessionLocal() as db:
        # Fetch dev 1
        res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == 1))
        dev = res.scalars().first()
        
        # Fetch an app owned by dev 1
        res = await db.execute(select(Application).where(Application.developer_id == 1))
        app = res.scalars().first()
        
        if not app:
            print("No app found for dev 1. Please create an app first.")
            return
            
        # Call create_user_manual
        req = UserCreateManual(app_id=app.id, username="router_test_user", password="password123")
        try:
            new_user = await create_user_manual(req, dev, db)
            print(f"Successfully created user via router: {new_user.username}")
        except Exception as e:
            print(f"Error calling router: {e}")

if __name__ == "__main__":
    asyncio.run(test())
