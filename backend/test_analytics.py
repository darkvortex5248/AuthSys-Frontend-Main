import asyncio
import httpx

async def test():
    # Use the token from the developer login (I'll need to login first)
    # Actually, I can just use the DB to simulate the request logic.
    pass

from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from routers.developer_analytics import calculate_app_stats

async def simulate():
    async with AsyncSessionLocal() as db:
        try:
            print("Starting simulation...")
            stats = await calculate_app_stats(db, [17]) # Use one of the app IDs I found
            print("Stats calculated successfully!")
            print(stats.keys())
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(simulate())
