import asyncio
from core.database import engine, get_db
from models.domain import AdminUser, SubscriptionPlan, SystemSetting, PaymentMethod
from core.security import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def init_admin():
    async with AsyncSession(engine) as db:
        # Create default admin
        res = await db.execute(select(AdminUser).where(AdminUser.username == "admin"))
        if not res.scalars().first():
            admin = AdminUser(
                username="admin",
                email="admin@rinoxauth.com",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            print("Admin user created: admin / admin123")
        
        # Create default plans
        res = await db.execute(select(SubscriptionPlan))
        if not res.scalars().all():
            plans = [
                SubscriptionPlan(
                    name="Tester", 
                    price_monthly=0, 
                    price_yearly=0, 
                    max_apps=5, 
                    max_users_per_app=10, 
                    max_keys_per_month=100,
                    features_json=["All Auth Methods", "Token System", "Hash Checks", "Client Two Factor Authentication"]
                ),
                SubscriptionPlan(
                    name="Developer", 
                    price_monthly=299, 
                    price_yearly=1499, 
                    max_apps=20, 
                    max_users_per_app=10000, 
                    max_keys_per_month=50000,
                    features_json=["Everything in Tester +", "Team Management", "Customer Panel", "Function Management"]
                ),
                SubscriptionPlan(
                    name="Seller", 
                    price_monthly=499, 
                    price_yearly=2499, 
                    max_apps=999999, 
                    max_users_per_app=999999, 
                    max_keys_per_month=999999,
                    features_json=["Everything in Developer +", "Chatrooms", "Discord Bot", "Telegram Bot", "Seller API"]
                )
            ]
            db.add_all(plans)
            print("Default plans created with new features")

        # Create default settings
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == "maintenance_mode"))
        if not res.scalars().first():
            settings = [
                SystemSetting(key="maintenance_mode", value="false", description="Platform Maintenance Mode"),
                SystemSetting(key="watch_demo_url", value="https://youtube.com/watch?v=demo", description="Main Hero Watch Demo URL"),
                SystemSetting(key="contact_email", value="support@authsys.com", description="Public Support Email"),
                SystemSetting(key="contact_phone", value="+1 (800) 123-4567", description="Public Support Phone"),
                SystemSetting(key="contact_address", value="San Francisco, CA", description="Public Office Address"),
                SystemSetting(key="landing_paragraph", value="The modern standard for software authentication, license management, and AI-powered threat protection.", description="Main landing page hero subtitle/paragraph"),
                SystemSetting(key="sdk_cpp_url", value="https://rinoxauth.com/downloads/sdk-cpp.zip", description="C++ SDK Download Link"),
                SystemSetting(key="sdk_csharp_url", value="https://rinoxauth.com/downloads/sdk-csharp.zip", description="C# SDK Download Link"),
                SystemSetting(key="sdk_python_url", value="https://rinoxauth.com/downloads/sdk-python.zip", description="Python SDK Download Link"),
            ]
            db.add_all(settings)
            print("Default settings created")

        # Create default payment methods
        res = await db.execute(select(PaymentMethod))
        if not res.scalars().all():
            methods = [
                PaymentMethod(name="bKash", type="local", instructions="Send Money (Personal) to: 01700000000", exchange_rate=120, icon_name="phone_iphone"),
                PaymentMethod(name="Nagad", type="local", instructions="Send Money (Personal) to: 01800000000", exchange_rate=120, icon_name="phone_android"),
                PaymentMethod(name="Card", type="international", instructions="We accept Visa, Mastercard, and Amex via manual processing.", exchange_rate=1, icon_name="credit_card")
            ]
            db.add_all(methods)
            print("Default payment methods created")

        await db.commit()

if __name__ == "__main__":
    asyncio.run(init_admin())
