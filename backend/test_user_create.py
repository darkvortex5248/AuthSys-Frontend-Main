import asyncio
import os
import sys

# Setup paths to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import AsyncSessionLocal
from models.domain import EndUser
from sqlalchemy.future import select

async def test_create_user():
    async with AsyncSessionLocal() as db:
        print("Testing DB connection...")
        try:
            # check apps
            from models.domain import Application
            apps = await db.execute(select(Application))
            app = apps.scalars().first()
            if not app:
                print("No apps found.")
                return

            print(f"Found app: {app.id} - {app.name}")

            # Try to create a user
            from core.security import get_password_hash
            new_user = EndUser(
                app_id=app.id,
                username="test_script_user",
                password_hash=get_password_hash("testpassword"),
                email="test@example.com"
            )
            db.add(new_user)
            await db.commit()
            print("User created successfully!")
            
            # Clean up
            await db.delete(new_user)
            await db.commit()
            print("Cleanup successful.")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_create_user())
