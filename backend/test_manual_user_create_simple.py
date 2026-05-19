import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import Application, DeveloperAccount, EndUser
from routers.developer_users import create_user_manual, UserCreateManual

async def test():
    async with AsyncSessionLocal() as db:
        # Get an app and its developer
        app_res = await db.execute(select(Application).limit(1))
        app = app_res.scalars().first()
        if not app:
            print("No app found")
            return
            
        dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == app.developer_id))
        dev = dev_res.scalars().first()
        if not dev:
            print("No developer found for app")
            return
            
        req = UserCreateManual(
            app_id=app.id,
            username="test_manual_user_100",
            password="testpassword123",
            email="test_manual@example.com"
        )
        
        try:
            res = await create_user_manual(req, dev, db)
            print("Manual user creation success!")
            print(f"Created user ID: {res.id}, username: {res.username}")
            
            # Now delete the created user to clean up
            await db.delete(res)
            await db.commit()
            print("Cleaned up created user successfully.")
        except Exception as e:
            print("Manual user creation failed:", e)

if __name__ == "__main__":
    asyncio.run(test())
