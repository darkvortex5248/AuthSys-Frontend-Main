import asyncio
import time
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import Application, LicenseKey, EndUser
from routers.client_api import register_user, ClientRegisterRequest
from test_register import DummyRequest

async def test():
    async with AsyncSessionLocal() as db:
        # Get an app
        app_res = await db.execute(select(Application).limit(1))
        app = app_res.scalars().first()
        if not app:
            print("No app found")
            return
            
        print(f"App secret: {app.app_secret}")
        
        # Create a real license key
        from routers.developer_keys import generate_key_string
        key_val = generate_key_string()
        license_key = LicenseKey(
            app_id=app.id,
            key_value=key_val,
            key_type="time",
            duration_days=30
        )
        db.add(license_key)
        await db.commit()
        print(f"Created license key: {key_val}")
        
        # Test register without begin_nested
        username = f"test_reg_{int(time.time())}"
        print(f"Trying registration with username: {username}")
        req = ClientRegisterRequest(
            app_secret=app.app_secret,
            username=username,
            password="testpassword",
            license_key=key_val,
            hwid="test_hwid_123",
            email="test_reg_fresh@example.com"
        )
        
        dummy_req = DummyRequest()
        try:
            res = await register_user(dummy_req, req, db)
            print("Registration success! Result:", res)
            
            # Clean up user and key
            # Let's find the user
            user_res = await db.execute(select(EndUser).where(EndUser.username == username))
            user = user_res.scalars().first()
            if user:
                await db.delete(user)
            
            # Find and delete the key
            key_res = await db.execute(select(LicenseKey).where(LicenseKey.key_value == key_val))
            key = key_res.scalars().first()
            if key:
                await db.delete(key)
                
            await db.commit()
            print("Cleanup completed successfully.")
        except Exception as e:
            print("Registration failed:", e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
