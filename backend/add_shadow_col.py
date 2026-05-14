import asyncio
from core.database import engine
from sqlalchemy import text

async def add_col():
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE end_users ADD COLUMN is_shadow BOOLEAN DEFAULT FALSE'))
            print('Column added successfully')
        except Exception as e:
            print(f'Note: {e}')

if __name__ == "__main__":
    asyncio.run(add_col())
