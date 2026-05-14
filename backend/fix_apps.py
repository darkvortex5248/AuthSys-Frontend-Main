import asyncio
import secrets
import string
from sqlalchemy import text
from core.database import engine

def generate_secure_id(length=12):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def fix():
    async with engine.begin() as conn:
        try:
            # Fetch ALL apps
            res = await conn.execute(text("SELECT id, owner_id, hwid_enabled FROM applications"))
            rows = res.all()
            
            print(f"Checking {len(rows)} applications...")
            
            for row in rows:
                app_id, owner_id, hwid_enabled = row
                updates = []
                if owner_id is None:
                    new_owner_id = generate_secure_id(16)
                    updates.append(f"owner_id = '{new_owner_id}'")
                if hwid_enabled is None:
                    updates.append("hwid_enabled = true")
                
                if updates:
                    update_str = ", ".join(updates)
                    await conn.execute(text(f"UPDATE applications SET {update_str} WHERE id = {app_id}"))
                    print(f"Fixed App ID: {app_id}")
            
            print("Successfully repaired all applications.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix())
