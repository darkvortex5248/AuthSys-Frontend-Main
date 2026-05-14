from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.domain import Application, LicenseKey, EndUser, DeveloperAccount
from core.security import generate_secure_id
import secrets

class BotService:
    @staticmethod
    async def get_app_details(db: AsyncSession, developer_id: int, app_id: int):
        res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == developer_id))
        app = res.scalars().first()
        if not app:
            return "Application not found or unauthorized."
        
        return f"📱 **App**: {app.name} (ID: {app.id})\n" \
               f"Status: {app.status}\n" \
               f"Version: {app.version}\n" \
               f"HWID Enforced: {app.hwid_enabled}\n" \
               f"Maintenance: {app.maintenance_mode}"

    @staticmethod
    async def generate_key(db: AsyncSession, developer_id: int, app_id: int, key_type: str, duration: int = 0):
        # Verify ownership
        res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == developer_id))
        if not res.scalars().first():
            return "Unauthorized application access."
        
        new_key = LicenseKey(
            app_id=app_id,
            key_value=f"AUTH-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}",
            key_type=key_type,
            duration_days=duration if key_type == "time" else None
        )
        db.add(new_key)
        await db.commit()
        return f"✅ Key Generated: `{new_key.key_value}`"

    @staticmethod
    async def reset_hwid(db: AsyncSession, developer_id: int, app_id: int, username: str):
        # Verify app
        app_res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == developer_id))
        if not app_res.scalars().first():
            return "App not found."
            
        res = await db.execute(select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username))
        user = res.scalars().first()
        if not user:
            return "User not found."
        
        user.hwid = None
        await db.commit()
        return f"✅ HWID Reset for user: {username}"
