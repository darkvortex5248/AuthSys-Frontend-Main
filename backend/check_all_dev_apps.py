import asyncio
import asyncpg

async def check():
    DATABASE_URL = "postgresql://postgres:atik@localhost:5432/authsys"
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check dev 1 (mdatikurrohoman524@gmail.com)
        dev1_apps = await conn.fetch("SELECT id, name FROM applications WHERE developer_id = 1")
        print(f"Apps for Dev 1: {len(dev1_apps)}")
        for a in dev1_apps:
            print(f" - {a['name']} (ID: {a['id']})")
            
        # Check dev 2 (atikurrohomanmd839@gmail.com)
        dev2_apps = await conn.fetch("SELECT id, name FROM applications WHERE developer_id = 2")
        print(f"Apps for Dev 2: {len(dev2_apps)}")
        for a in dev2_apps:
            print(f" - {a['name']} (ID: {a['id']})")
            
        # Check dev 3 (mdatikurrohoman524860@gmail.com)
        dev3_apps = await conn.fetch("SELECT id, name FROM applications WHERE developer_id = 3")
        print(f"Apps for Dev 3: {len(dev3_apps)}")
        for a in dev3_apps:
            print(f" - {a['name']} (ID: {a['id']})")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
