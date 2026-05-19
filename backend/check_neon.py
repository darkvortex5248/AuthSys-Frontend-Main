import asyncio
import asyncpg

async def check():
    url = "postgresql://neondb_owner:npg_tu4UOQCwTbY8@ep-empty-hat-aqo6fubx-pooler.c-8.us-east-1.aws.neon.tech/AuthSys"
    print("Connecting to Neon DB...")
    conn = await asyncpg.connect(url, ssl="require")
    try:
        print("Connected! Fetching tables...")
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        for t in tables:
            print(f"Table: {t['table_name']}")
        
        print("\nFetching columns of end_users...")
        cols = await conn.fetch("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'end_users'")
        for c in cols:
            print(f" - {c['column_name']} ({c['data_type']}, nullable: {c['is_nullable']})")

        print("\nFetching index info of end_users...")
        indexes = await conn.fetch("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'end_users'
        """)
        for idx in indexes:
            print(f" - {idx['indexname']}: {idx['indexdef']}")

        print("\nTesting user create on Neon (temporary transaction)...")
        tr = conn.transaction()
        await tr.start()
        try:
            # Let's get an application ID first
            app = await conn.fetchrow("SELECT id FROM applications LIMIT 1")
            if app:
                app_id = app['id']
                print(f"Found application ID: {app_id}")
                # Insert test user
                await conn.execute("""
                    INSERT INTO end_users (app_id, username, password_hash, email, is_shadow)
                    VALUES ($1, $2, $3, $4, $5)
                """, app_id, "neon_test_user_unique_123", "hash", "test@neon.com", False)
                print("User inserted successfully in transaction!")
            else:
                print("No applications found in production database!")
        except Exception as e:
            print(f"Insertion failed: {e}")
        finally:
            await tr.rollback()
            print("Transaction rolled back.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
