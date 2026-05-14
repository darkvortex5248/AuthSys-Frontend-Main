import asyncio
import asyncpg

async def fix():
    DATABASE_URL = "postgresql://postgres:atik@localhost:5432/authsys"
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("Adding maintenance_mode column...")
        await conn.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE")
        
        print("Adding developer_lock column...")
        await conn.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS developer_lock BOOLEAN DEFAULT FALSE")
        
        # Also ensure existing records have the default value
        await conn.execute("UPDATE applications SET maintenance_mode = FALSE WHERE maintenance_mode IS NULL")
        await conn.execute("UPDATE applications SET developer_lock = FALSE WHERE developer_lock IS NULL")
        
        print("Migration complete.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix())
