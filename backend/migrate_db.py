import asyncio
from sqlalchemy import text
from core.database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            # Check if columns exist
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'subscription_plans'"))
            cols = [r[0] for r in res]
            
            if 'ai_agent_access' not in cols:
                print("Adding ai_agent_access to subscription_plans...")
                await conn.execute(text("ALTER TABLE subscription_plans ADD COLUMN ai_agent_access BOOLEAN DEFAULT FALSE"))
            
            # Also check DeveloperAccount for any new columns I might have missed
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'developer_accounts'"))
            cols = [r[0] for r in res]
            # (None for now)
            
            print("Migration successful.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
