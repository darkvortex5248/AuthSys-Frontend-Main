import asyncio
import secrets
import string
from core.database import engine
from sqlalchemy import text

def generate_secure_id(length=12):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def test():
    async with engine.begin() as conn:
        try:
            # Try to insert an app
            app_secret = secrets.token_hex(32)
            owner_id = generate_secure_id(12)
            await conn.execute(text(f"INSERT INTO applications (developer_id, name, app_secret, owner_id, version, min_version, status, hwid_enabled) VALUES (1, 'Test App Final', '{app_secret}', '{owner_id}', '1.0', '1.0', 'active', true)"))
            print("Successfully inserted app into DB manually.")
            
            # Try to insert a user
            await conn.execute(text("INSERT INTO end_users (app_id, username, password_hash) VALUES (1, 'test_user_final', 'hash')"))
            print("Successfully inserted user into DB manually.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
