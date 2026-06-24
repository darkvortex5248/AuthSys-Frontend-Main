"""
Run this script to create all database tables automatically.
Usage: python create_tables.py
"""
import asyncio
from core.database import create_tables

async def main():
    print("Creating database tables...")
    try:
        await create_tables()
        print("✅ All tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
