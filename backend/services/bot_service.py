from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from models.domain import Application, LicenseKey, EndUser, Blacklist, ChatRoom, ChatMessage
import secrets
import string
from datetime import datetime, timezone, timedelta
from core.security import get_password_hash

def make_key(prefix: str = "AUTH") -> str:
    alpha = string.ascii_uppercase + string.digits
    return f"{prefix}-{''.join(secrets.choice(alpha) for _ in range(8))}-{''.join(secrets.choice(alpha) for _ in range(8))}"

def _app_guard(res, developer_id: int) -> bool:
    app = res.scalars().first()
    return app is not None and app.developer_id == developer_id

class BotService:

    @staticmethod
    async def get_app(db: AsyncSession, app_id: int, developer_id: int):
        res = await db.execute(
            select(Application).where(Application.id == app_id, Application.developer_id == developer_id)
        )
        return res.scalars().first()

    @staticmethod
    async def app_details(db: AsyncSession, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        return (
            f"\U0001f4f1 **App**: {app.name} (ID: {app.id})\n"
            f"Status: {app.status}\n"
            f"Version: {app.version}\n"
            f"HWID Lock: {'On' if app.hwid_enabled else 'Off'}\n"
            f"Maintenance: {'On' if app.maintenance_mode else 'Off'}"
        )

    @staticmethod
    async def generate_key(db: AsyncSession, app_id: int, developer_id: int,
                           key_type: str = "time", duration: int = 1, note: str = "",
                           prefix: str = "AUTH"):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        key_val = make_key(prefix)
        new_key = LicenseKey(
            app_id=app_id,
            key_value=key_val,
            key_type=key_type,
            duration_days=duration if key_type == "time" else None,
            note=note or None,
        )
        db.add(new_key)
        await db.commit()
        return key_val

    @staticmethod
    async def key_info(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        status = "Paused \u23f8\ufe0f" if key.is_paused else "Active \u2705"
        return (
            f"\U0001f511 **Key Info**\n"
            f"Value: `{key.key_value}`\n"
            f"Type: {key.key_type}\n"
            f"Duration: {key.duration_days or 'N/A'} days\n"
            f"Uses: {key.current_uses or 0}/{key.max_uses or 'Unlimited'}\n"
            f"Status: {status}\n"
            f"Note: {key.note or 'None'}"
        )

    @staticmethod
    async def pause_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        key.is_paused = True
        await db.commit()
        return f"\u23f8\ufe0f Key `{key_value}` paused"

    @staticmethod
    async def resume_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        key.is_paused = False
        await db.commit()
        return f"\u25b6\ufe0f Key `{key_value}` resumed"

    @staticmethod
    async def delete_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        await db.delete(key)
        await db.commit()
        return f"\u274c Key `{key_value}` deleted"

    @staticmethod
    async def user_info(db: AsyncSession, username: str, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        banned_emoji = chr(0x26D4)
        return (
            f"\U0001f464 **User Info**\n"
            f"Username: {user.username}\n"
            f"Email: {user.email or 'N/A'}\n"
            f"Banned: {'Yes ' + banned_emoji if user.is_banned else 'No'}\n"
            f"HWID: `{user.hwid or 'None'}`\n"
            f"HWID Resets: {user.hwid_reset_count}/{user.hwid_reset_allowed}\n"
            f"Logins: {user.login_count}"
        )

    @staticmethod
    async def ban_user(db: AsyncSession, username: str, app_id: int, developer_id: int, reason: str = ""):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        user.is_banned = True
        user.ban_reason = reason or None
        await db.commit()
        return f"\u26d4 User `{username}` banned{chr(10)}Reason: {reason or 'N/A'}"

    @staticmethod
    async def unban_user(db: AsyncSession, username: str, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        user.is_banned = False
        user.ban_reason = None
        await db.commit()
        return f"\u2705 User `{username}` unbanned"

    @staticmethod
    async def reset_hwid(db: AsyncSession, username: str, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        user.hwid = None
        user.hwid_reset_count = (user.hwid_reset_count or 0) + 1
        await db.commit()
        return f"\U0001f504 HWID reset for `{username}`"

    @staticmethod
    async def app_stats(db: AsyncSession, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        user_count = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id == app_id))
        key_count = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id))
        active_keys = await db.execute(
            select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id, LicenseKey.is_paused == False)
        )
        return (
            f"\U0001f4ca **{app.name} Stats**\n"
            f"Users: {user_count.scalar() or 0}\n"
            f"Total Keys: {key_count.scalar() or 0}\n"
            f"Active Keys: {active_keys.scalar() or 0}"
        )

    @staticmethod
    async def list_keys(db: AsyncSession, app_id: int, developer_id: int, limit: int = 10):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(LicenseKey).where(LicenseKey.app_id == app_id)
            .order_by(desc(LicenseKey.created_at)).limit(limit)
        )
        keys = res.scalars().all()
        if not keys:
            return "No keys found for this app."
        lines = [f"\U0001f511 **Recent Keys** (last {len(keys)})"]
        for k in keys:
            status = "\u23f8\ufe0f" if k.is_paused else "\u2705"
            lines.append(f"`{k.key_value}` {status} ({k.key_type}, {k.duration_days or 'N/A'}d)")
        return "\n".join(lines)

    @staticmethod
    async def list_users(db: AsyncSession, app_id: int, developer_id: int, limit: int = 10):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id)
            .order_by(desc(EndUser.created_at)).limit(limit)
        )
        users = res.scalars().all()
        if not users:
            return "No users found for this app."
        lines = [f"\U0001f464 **Recent Users** (last {len(users)})"]
        for u in users:
            banned = "\u26d4" if u.is_banned else "\u2705"
            hwid = f"HWID: `{u.hwid[:16]}...`" if u.hwid else "No HWID"
            lines.append(f"`{u.username}` {banned} | {hwid} | Logins: {u.login_count or 0}")
        return "\n".join(lines)

    @staticmethod
    async def add_user(db: AsyncSession, app_id: int, developer_id: int,
                       username: str, password: str, days: int = 30):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None, "App not found"
        existing = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        if existing.scalars().first():
            return None, "Username already exists"
        hashed = get_password_hash(password)
        expires = datetime.now(timezone.utc) + timedelta(days=days)
        new_user = EndUser(
            app_id=app_id,
            username=username,
            password_hash=hashed,
            subscription_expires_at=expires,
        )
        db.add(new_user)
        await db.commit()
        return new_user, None

    @staticmethod
    async def delete_user(db: AsyncSession, username: str, app_id: int, developer_id: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        await db.delete(user)
        await db.commit()
        return f"\u274c User `{username}` deleted"

    @staticmethod
    async def extend_user(db: AsyncSession, username: str, app_id: int, developer_id: int, days: int):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = res.scalars().first()
        if not user:
            return None
        now = datetime.now(timezone.utc)
        if user.subscription_expires_at and user.subscription_expires_at > now:
            user.subscription_expires_at += timedelta(days=days)
        else:
            user.subscription_expires_at = now + timedelta(days=days)
        await db.commit()
        return f"\U0001f4c5 Subscription for `{username}` extended by {days} days"

    @staticmethod
    async def verify_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None, "Key not found"
        if key.is_paused:
            return key, "Key is paused/suspended"
        now = datetime.now(timezone.utc)
        if key.expires_at and key.expires_at < now:
            return key, "Key has expired"
        app = await db.get(Application, key.app_id)
        return key, None

    @staticmethod
    async def license_check(db: AsyncSession, key_value: str, developer_id: int):
        key, error = await BotService.verify_key(db, key_value, developer_id)
        if error:
            return f"\u274c **License Invalid**: {error}"
        return (
            f"\u2705 **License Valid**\n"
            f"Key: `{key.key_value}`\n"
            f"Type: {key.key_type}\n"
            f"Uses: {key.current_uses or 0}/{key.max_uses or 'Unlimited'}"
        )

    @staticmethod
    async def ban_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        key.is_paused = True
        await db.commit()
        return f"\u26d4 Key `{key_value}` banned"

    @staticmethod
    async def unban_key(db: AsyncSession, key_value: str, developer_id: int):
        res = await db.execute(
            select(LicenseKey).join(Application).where(
                LicenseKey.key_value == key_value,
                Application.developer_id == developer_id
            )
        )
        key = res.scalars().first()
        if not key:
            return None
        key.is_paused = False
        await db.commit()
        return f"\u2705 Key `{key_value}` unbanned"

    @staticmethod
    async def blacklist_add(db: AsyncSession, app_id: int, developer_id: int,
                            bl_type: str, value: str, reason: str = ""):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        existing = await db.execute(
            select(Blacklist).where(
                Blacklist.app_id == app_id,
                Blacklist.type == bl_type,
                Blacklist.value == value
            )
        )
        if existing.scalars().first():
            return f"\u26a0\ufe0f `{value}` is already blacklisted ({bl_type})"
        entry = Blacklist(
            app_id=app_id,
            type=bl_type,
            value=value,
            reason=reason or None,
        )
        db.add(entry)
        await db.commit()
        return f"\u26d4 Added `{value}` to blacklist ({bl_type}){chr(10)}Reason: {reason or 'N/A'}"

    @staticmethod
    async def blacklist_remove(db: AsyncSession, app_id: int, developer_id: int,
                               bl_type: str, value: str):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        res = await db.execute(
            select(Blacklist).where(
                Blacklist.app_id == app_id,
                Blacklist.type == bl_type,
                Blacklist.value == value
            )
        )
        entry = res.scalars().first()
        if not entry:
            return f"\u274c `{value}` not found in blacklist ({bl_type})"
        await db.delete(entry)
        await db.commit()
        return f"\u2705 Removed `{value}` from blacklist ({bl_type})"

    @staticmethod
    async def chat_send(db: AsyncSession, app_id: int, developer_id: int,
                        username: str, message: str):
        app = await BotService.get_app(db, app_id, developer_id)
        if not app:
            return None
        user_res = await db.execute(
            select(EndUser).where(EndUser.app_id == app_id, EndUser.username == username)
        )
        user = user_res.scalars().first()
        if not user:
            return None
        room_res = await db.execute(
            select(ChatRoom).where(ChatRoom.app_id == app_id).limit(1)
        )
        room = room_res.scalars().first()
        if not room:
            room = ChatRoom(app_id=app_id, name="General")
            db.add(room)
            await db.flush()
        msg = ChatMessage(room_id=room.id, user_id=user.id, message=message)
        db.add(msg)
        await db.commit()
        return f"\U0001f4ac Message sent to `{username}` in {room.name}"

    @staticmethod
    async def seller_info(db: AsyncSession, developer_id: int):
        from models.domain import SellerAccount
        res = await db.execute(
            select(SellerAccount).where(SellerAccount.developer_id == developer_id)
        )
        sellers = res.scalars().all()
        if not sellers:
            return "No seller accounts found."
        lines = ["\U0001f464 **Your Seller Accounts**"]
        for s in sellers:
            status = "\u2705" if s.is_active else "\u26d4"
            lines.append(f"`{s.name}` {status} | Key: `{s.api_key[:16]}...`")
        return "\n".join(lines)
