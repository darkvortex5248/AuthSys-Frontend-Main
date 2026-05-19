import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import Application, LicenseKey, EndUser
from routers.client_api import register_user, ClientRegisterRequest
from fastapi import Request
from fastapi.datastructures import Headers

from starlette.datastructures import State

class DummyRequest(Request):
    def __init__(self, ip="127.0.0.1", user_agent="Test"):
        self.scope = {
            "type": "http",
            "client": (ip, 8000),
            "headers": [(b"user-agent", user_agent.encode())],
            "state": {},
            "path": "/api/v1/client/register"
        }
        self._state = State(self.scope["state"])
    @property
    def client(self):
        return type('Client', (), {'host': self.scope['client'][0]})
    @property
    def headers(self):
        return Headers(scope=self.scope)

async def test():
    async with AsyncSessionLocal() as db:
        # Get an app
        app_res = await db.execute(select(Application).limit(1))
        app = app_res.scalars().first()
        if not app:
            print("No app found")
            return
            
        print(f"App secret: {app.app_secret}")
        
        # Start a transaction so we don't pollute the DB
        async with db.begin_nested() as transaction:
            # Create a new, unused license key
            from routers.developer_keys import generate_key_string
            key_val = generate_key_string()
            new_key = LicenseKey(
                app_id=app.id,
                key_value=key_val,
                key_type="time",
                duration_days=30
            )
            db.add(new_key)
            await db.flush()
            
            print(f"Temporary unused key created: {key_val}")
            
            # Test register
            import time
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
                print("Registration success:", res)
            except Exception as e:
                print("Registration failed:", e)
                import traceback
                traceback.print_exc()
            finally:
                # Rollback transaction
                await transaction.rollback()
                print("Transaction rolled back successfully.")

if __name__ == "__main__":
    asyncio.run(test())
