import asyncio
from core.database import engine
from models.domain import AdminUser
from core.security import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def reset_admin():
    async with AsyncSession(engine) as db:
        res = await db.execute(select(AdminUser).where(AdminUser.username == "admin"))
        admin = res.scalars().first()
        
        if admin:
            admin.password_hash = get_password_hash("admin123")
            admin.role = "admin"
            print("Admin password reset to: admin123")
        else:
            admin = AdminUser(
                username="admin",
                email="admin@rinoxauth.com",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            print("Admin user created: admin / admin123")
        
        await db.commit()

if __name__ == "__main__":
    asyncio.run(reset_admin())
