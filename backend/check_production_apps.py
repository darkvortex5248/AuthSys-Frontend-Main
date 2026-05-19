import asyncio
import asyncpg

async def check():
    url = "postgresql://neondb_owner:npg_tu4UOQCwTbY8@ep-empty-hat-aqo6fubx-pooler.c-8.us-east-1.aws.neon.tech/AuthSys"
    print("Connecting to Production Neon DB...")
    conn = await asyncpg.connect(url, ssl="require")
    try:
        print("Connected! Fetching applications...")
        apps = await conn.fetch("SELECT id, name, app_secret, owner_id FROM applications")
        for a in apps:
            print(f"ID: {a['id']} | Name: {a['name']} | Secret: {a['app_secret']} | OwnerID: {a['owner_id']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
