import asyncio
from sqlalchemy import text
from core.database import engine

async def fix_bot_db():
    async with engine.begin() as conn:
        try:
            print("Checking BotConfig table for new columns...")
            # Get existing columns
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'bot_configs'"))
            cols = [r[0] for r in res.all()]
            
            if 'discord_app_id' not in cols:
                print("Adding discord_app_id to bot_configs...")
                await conn.execute(text("ALTER TABLE bot_configs ADD COLUMN discord_app_id VARCHAR"))
            
            if 'discord_public_key' not in cols:
                print("Adding discord_public_key to bot_configs...")
                await conn.execute(text("ALTER TABLE bot_configs ADD COLUMN discord_public_key VARCHAR"))
            
            print("Database fix applied successfully!")
        except Exception as e:
            print(f"Error applying fix: {e}")

if __name__ == "__main__":
    asyncio.run(fix_bot_db())
