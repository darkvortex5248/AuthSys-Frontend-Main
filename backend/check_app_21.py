import asyncio
import asyncpg

async def check():
    DATABASE_URL = "postgresql://postgres:atik@localhost:5432/authsys"
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow("SELECT * FROM applications WHERE id = 21")
        if row:
            print("Application 21 Details:")
            for key in row.keys():
                print(f" - {key}: {row[key]} ({type(row[key])})")
        else:
            print("Application 21 not found.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
