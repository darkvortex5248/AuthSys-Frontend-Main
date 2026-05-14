import asyncio
import os
import sys

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import DeveloperAccount, Application

async def check():
    email = 'mdatikurrohomman524@gmail.com'
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == email))
        dev = res.scalars().first()
        if dev:
            print(f"Dev ID: {dev.id}")
            print(f"Username: {dev.username}")
            
            app_res = await db.execute(select(Application).where(Application.developer_id == dev.id))
            apps = app_res.scalars().all()
            print(f"Apps found (Application model): {len(apps)}")
            for a in apps:
                print(f" - {a.name} (ID: {a.id}, Status: {a.status})")
                
            # Also check raw IDs just in case mapping is weird
            from sqlalchemy import text
            raw_res = await db.execute(text("SELECT id, name FROM applications WHERE developer_id = :dev_id"), {"dev_id": dev.id})
            raw_apps = raw_res.all()
            print(f"Apps found (Raw SQL): {len(raw_apps)}")
            for ra in raw_apps:
                print(f" - {ra[1]} (ID: {ra[0]})")
        else:
            print(f"Dev not found with email: {email}")

if __name__ == "__main__":
    asyncio.run(check())
