import asyncio
from sqlalchemy import text
from core.database import engine

async def create():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("INSERT INTO applications (developer_id, name, app_secret, owner_id, version, min_version, status, hwid_enabled) VALUES (1, 'Test App', 'secret123', 'owner123', '1.0', '1.0', 'active', true)"))
            print("Inserted test app")
            res = await conn.execute(text("SELECT count(*) FROM applications"))
            print(f"Count after insert: {res.scalar()}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create())
