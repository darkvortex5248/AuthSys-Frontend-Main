import asyncio
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine
from core.config import settings

async def fix_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Check columns of webhooks_log
        def get_cols(connection):
            inspector = inspect(connection)
            return [c['name'] for c in inspector.get_columns("webhooks_log")]
        
        columns = await conn.run_sync(get_cols)
        print(f"Current columns in webhooks_log: {columns}")
        
        if "endpoint_id" not in columns:
            print("Adding endpoint_id column to webhooks_log...")
            await conn.execute(text("ALTER TABLE webhooks_log ADD COLUMN endpoint_id INTEGER"))
            print("Column added.")
        else:
            print("endpoint_id column already exists.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_db())
