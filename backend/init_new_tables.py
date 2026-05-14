import asyncio
from core.database import engine, Base
from models.domain import TeamMember, BotConfig # Import to register with Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
