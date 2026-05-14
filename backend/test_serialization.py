import asyncio
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import Application
from schemas.dashboard import AppResponse
from pydantic import TypeAdapter

async def test_serialization():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Application).where(Application.developer_id == 1))
        apps = res.scalars().all()
        print(f"Found {len(apps)} apps in DB")
        
        try:
            adapter = TypeAdapter(list[AppResponse])
            validated = adapter.validate_python(apps)
            print(f"Successfully validated {len(validated)} apps with AppResponse schema")
        except Exception as e:
            print(f"Serialization Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_serialization())
