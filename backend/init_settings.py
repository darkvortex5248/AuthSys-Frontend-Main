import asyncio
from sqlalchemy import text
from core.database import engine

async def init_settings():
    settings = [
        ('maintenance_mode', 'false', 'Global maintenance toggle'),
        ('contact_email', 'support@rinoxauth.com', 'Support contact email'),
        ('contact_phone', '+1 (555) 000-0000', 'Support contact phone'),
        ('contact_address', 'Silicon Valley, CA', 'Physical office location'),
        ('landing_paragraph', 'RinoxAuth provides the modern standard for software authentication, licensing, and security monitoring. Built for developers who demand enterprise-grade protection.', 'The main hero text on the landing and documentation pages'),
        ('watch_demo_url', 'https://youtube.com/watch?v=demo', 'URL for the demo video'),
        ('strict_hwid', 'true', 'Lock sessions to hardware'),
        ('ip_risk_scoring', 'false', 'Auto-ban high risk traffic'),
        ('developer_2fa', 'false', 'Mandatory 2FA for developers'),
        ('rate_limiting', 'true', 'Global API rate limiting')
    ]
    
    async with engine.begin() as conn:
        for key, val, desc in settings:
            # Insert if not exists
            await conn.execute(text("""
                INSERT INTO system_settings (key, value, description)
                VALUES (:key, :val, :desc)
                ON CONFLICT (key) DO NOTHING
            """), {"key": key, "val": val, "desc": desc})
        print("System settings initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_settings())
