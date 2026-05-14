import asyncio
from sqlalchemy import text
from core.database import engine
from models.domain import Base

async def init_new_features():
    async with engine.begin() as conn:
        # This will create tables that don't exist
        await conn.run_sync(Base.metadata.create_all)
        print("New feature tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_new_features())
