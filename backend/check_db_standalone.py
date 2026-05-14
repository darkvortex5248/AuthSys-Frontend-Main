import asyncio
import asyncpg
import os

async def check():
    # Use the URL from the .env file directly
    DATABASE_URL = "postgresql://postgres:atik@localhost:5432/authsys"
    
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        email = 'mdatikurrohomman524@gmail.com'
        dev = await conn.fetchrow("SELECT id, username FROM developer_accounts WHERE email = $1", email)
        
        if dev:
            print(f"Dev ID: {dev['id']}")
            print(f"Username: {dev['username']}")
            
            apps = await conn.fetch("SELECT id, name, status FROM applications WHERE developer_id = $1", dev['id'])
            print(f"Apps found: {len(apps)}")
            for a in apps:
                print(f" - {a['name']} (ID: {a['id']}, Status: {a['status']})")
        else:
            print(f"Dev not found with email: {email}")
            
            # Check all developers just in case
            all_devs = await conn.fetch("SELECT id, email, username FROM developer_accounts")
            print("\nAll Developers in DB:")
            for d in all_devs:
                print(f" - {d['id']}: {d['email']} ({d['username']})")
                
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
