import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import DeveloperAccount, Application, EndUser
from routers.developer_apps import create_app
from routers.developer_users import create_user_manual, UserCreateManual
from schemas.dashboard import AppCreate
import secrets

async def test_full_flow():
    async with AsyncSessionLocal() as db:
        # Fetch dev 1 (Enterprise)
        res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == 1))
        dev = res.scalars().first()
        
        print(f"Testing for Developer: {dev.email} (Tier: {dev.subscription_tier})")
        
        # 1. Test App Creation
        app_name = f"Auto App {secrets.token_hex(4)}"
        req_app = AppCreate(name=app_name, version="1.0", min_version="1.0", hwid_enabled=True)
        try:
            new_app = await create_app(req_app, dev, db)
            print(f"SUCCESS: App Creation -> {new_app.name} (ID: {new_app.id})")
            
            # 2. Test User Creation for this new app
            req_user = UserCreateManual(app_id=new_app.id, username=f"user_{secrets.token_hex(4)}", password="password123")
            new_user = await create_user_manual(req_user, dev, db)
            print(f"SUCCESS: User Creation -> {new_user.username} for App ID {new_app.id}")
            
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
