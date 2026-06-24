import asyncio
import discord
from discord import app_commands
from telegram import Bot, Update
from telegram.ext import Application as TelegramApp, CommandHandler, ContextTypes
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import BotConfig
from services.bot_service import BotService
import logging

logger = logging.getLogger("BotManager")

def get_settings(config) -> dict:
    return config.settings or {}

def get_prefix(config) -> str:
    s = get_settings(config)
    return s.get("key_prefix", "AUTH")

def parse_days(args, default=1) -> int | None:
    try:
        val = int(args)
        if val < 1:
            return None
        return val
    except (ValueError, TypeError, IndexError):
        return default if default else None

# ─── Discord ────────────────────────────────────────────────────────────────────

class MultiBotClient(discord.Client):
    def __init__(self, bot_config):
        intents = discord.Intents.all()
        super().__init__(intents=intents)
        self.config = bot_config
        self.tree = app_commands.CommandTree(self)

    async def is_authorized(self, interaction: discord.Interaction) -> bool:
        s = get_settings(self.config)
        allowed_roles = s.get("allowed_roles", [])
        if not allowed_roles:
            return True
        if interaction.guild:
            member = interaction.guild.get_member(interaction.user.id)
            if member:
                if member.guild_permissions.administrator:
                    return True
                user_role_names = {r.name for r in member.roles}
                if any(role in user_role_names for role in allowed_roles):
                    return True
        return False

    async def setup_hook(self):

        @self.tree.command(name="genkey", description="Generate a license key")
        @app_commands.describe(days="Duration in days", note="Optional note")
        async def genkey(interaction: discord.Interaction, days: int = 1, note: str = ""):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 You are not authorized to use this command.", ephemeral=True)
            if days < 1:
                return await interaction.response.send_message("\u274c Days must be at least 1.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                app = await BotService.get_app(db, self.config.app_id, self.config.developer_id)
                if not app:
                    return await interaction.followup.send("\u274c Application not found for this bot.")
                key_val = await BotService.generate_key(
                    db, app.id, self.config.developer_id,
                    key_type="time", duration=days, note=note or "Discord",
                    prefix=get_prefix(self.config)
                )
                if not key_val:
                    return await interaction.followup.send("\u274c Failed to generate key.")
                await interaction.followup.send(
                    f"\u2705 **Key Generated for {app.name}**\nKey: `{key_val}`\nDuration: {days} day(s)"
                )

        @self.tree.command(name="keyinfo", description="Look up a license key")
        @app_commands.describe(key="The license key value")
        async def keyinfo(interaction: discord.Interaction, key: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                info = await BotService.key_info(db, key, self.config.developer_id)
                if not info:
                    return await interaction.followup.send("\u274c Key not found.")
                await interaction.followup.send(info)

        @self.tree.command(name="pausekey", description="Pause a license key")
        @app_commands.describe(key="The license key value")
        async def pausekey(interaction: discord.Interaction, key: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.pause_key(db, key, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c Key not found.")

        @self.tree.command(name="resumekey", description="Resume a paused license key")
        @app_commands.describe(key="The license key value")
        async def resumekey(interaction: discord.Interaction, key: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.resume_key(db, key, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c Key not found.")

        @self.tree.command(name="delkey", description="Delete a license key")
        @app_commands.describe(key="The license key value")
        async def delkey(interaction: discord.Interaction, key: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.delete_key(db, key, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c Key not found.")

        @self.tree.command(name="userinfo", description="Look up an end user")
        @app_commands.describe(username="The username to look up")
        async def userinfo(interaction: discord.Interaction, username: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                info = await BotService.user_info(db, username, self.config.app_id, self.config.developer_id)
                await interaction.followup.send(info or "\u274c User not found.")

        @self.tree.command(name="ban", description="Ban an end user")
        @app_commands.describe(username="The username to ban", reason="Optional reason")
        async def ban(interaction: discord.Interaction, username: str, reason: str = ""):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.ban_user(db, username, self.config.app_id, self.config.developer_id, reason)
                await interaction.followup.send(msg or "\u274c User not found.")

        @self.tree.command(name="unban", description="Unban an end user")
        @app_commands.describe(username="The username to unban")
        async def unban(interaction: discord.Interaction, username: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.unban_user(db, username, self.config.app_id, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c User not found.")

        @self.tree.command(name="hwidreset", description="Reset HWID for a user")
        @app_commands.describe(username="The username")
        async def hwidreset(interaction: discord.Interaction, username: str):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.reset_hwid(db, username, self.config.app_id, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c User not found.")

        @self.tree.command(name="appinfo", description="Show linked application details")
        async def appinfo(interaction: discord.Interaction):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                info = await BotService.app_details(db, self.config.app_id, self.config.developer_id)
                await interaction.followup.send(info or "\u274c App not found.")

        @self.tree.command(name="stats", description="Show quick application stats")
        async def stats(interaction: discord.Interaction):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.app_stats(db, self.config.app_id, self.config.developer_id)
                await interaction.followup.send(msg or "\u274c App not found.")

        @self.tree.command(name="listkeys", description="List recent license keys")
        @app_commands.describe(limit="Number of keys to show (max 25)")
        async def listkeys(interaction: discord.Interaction, limit: int = 10):
            if not await self.is_authorized(interaction):
                return await interaction.response.send_message("\u26d4 Not authorized.", ephemeral=True)
            limit = max(1, min(limit, 25))
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                msg = await BotService.list_keys(db, self.config.app_id, self.config.developer_id, limit)
                await interaction.followup.send(msg or "\u274c App not found.")

        await self.tree.sync()
        logger.info(f"Discord bot {self.user} synced and online.")

# ─── Manager ─────────────────────────────────────────────────────────────────────

class BotManager:
    def __init__(self):
        self.active_discord_bots = {}
        self.active_telegram_bots = {}
        self._discord_clients = {}
        self._telegram_apps = {}

    async def start_all_bots(self):
        logger.info("Starting all active customer bots (Discord & Telegram)...")
        try:
            async with AsyncSessionLocal() as db:
                res = await db.execute(select(BotConfig).where(BotConfig.is_active == True))
                configs = res.scalars().all()
                for config in configs:
                    if config.bot_type == "discord" and config.id not in self.active_discord_bots:
                        task = asyncio.create_task(self.run_discord_bot(config))
                        self.active_discord_bots[config.id] = task
                    elif config.bot_type == "telegram" and config.id not in self.active_telegram_bots:
                        task = asyncio.create_task(self.run_telegram_bot(config))
                        self.active_telegram_bots[config.id] = task
        except Exception as e:
            logger.error("Failed to start bots: %s", e)

    async def run_discord_bot(self, config):
        try:
            client = MultiBotClient(config)
            self._discord_clients[config.id] = client
            await client.start(config.bot_token)
        except Exception as e:
            logger.error(f"Discord bot {config.id} error: {e}")

    async def _tg_auth(self, update: Update, config) -> bool:
        s = get_settings(config)
        whitelist = s.get("allowed_telegram_users", [])
        if not whitelist:
            return True
        uid = str(update.effective_user.id)
        return uid in whitelist

    def _make_tg_handlers(self, config):
        prefix = get_prefix(config)

        async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
            await update.message.reply_text(
                f"\U0001f44b Welcome! I am your AuthSys bot.\n"
                f"App ID: {config.app_id}\n"
                f"Use /genkey to generate keys, /help for all commands."
            )

        async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            cmds = [
                "/genkey [days] - Generate a license key",
                "/keyinfo [key] - Look up a key",
                "/pausekey [key] - Pause a key",
                "/resumekey [key] - Resume a key",
                "/delkey [key] - Delete a key",
                "/userinfo [username] - Look up a user",
                "/ban [username] [reason] - Ban a user",
                "/unban [username] - Unban a user",
                "/hwidreset [username] - Reset HWID",
                "/appinfo - App details",
                "/stats - Quick stats",
                "/listkeys [limit] - Recent keys",
            ]
            await update.message.reply_text("\u2139\ufe0f **Commands**\n" + "\n".join(cmd.strip() for cmd in cmds))

        async def genkey(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            days = parse_days(context.args[0] if context.args else None, 1)
            if days is None:
                return await update.message.reply_text("\u274c Days must be a positive number.")
            async with AsyncSessionLocal() as db:
                key_val = await BotService.generate_key(
                    db, config.app_id, config.developer_id,
                    key_type="time", duration=days, note="Telegram",
                    prefix=prefix
                )
                if not key_val:
                    return await update.message.reply_text("\u274c App not found.")
                await update.message.reply_text(f"\u2705 Key Generated!\nKey: `{key_val}`\nDuration: {days} day(s)")

        async def keyinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /keyinfo <key_value>")
            key = context.args[0]
            async with AsyncSessionLocal() as db:
                msg = await BotService.key_info(db, key, config.developer_id)
                await update.message.reply_text(msg or "\u274c Key not found.")

        async def pausekey(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /pausekey <key_value>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.pause_key(db, context.args[0], config.developer_id)
                await update.message.reply_text(msg or "\u274c Key not found.")

        async def resumekey(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /resumekey <key_value>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.resume_key(db, context.args[0], config.developer_id)
                await update.message.reply_text(msg or "\u274c Key not found.")

        async def delkey(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /delkey <key_value>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.delete_key(db, context.args[0], config.developer_id)
                await update.message.reply_text(msg or "\u274c Key not found.")

        async def userinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /userinfo <username>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.user_info(db, context.args[0], config.app_id, config.developer_id)
                await update.message.reply_text(msg or "\u274c User not found.")

        async def ban(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /ban <username> [reason]")
            username = context.args[0]
            reason = " ".join(context.args[1:]) if len(context.args) > 1 else ""
            async with AsyncSessionLocal() as db:
                msg = await BotService.ban_user(db, username, config.app_id, config.developer_id, reason)
                await update.message.reply_text(msg or "\u274c User not found.")

        async def unban(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /unban <username>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.unban_user(db, context.args[0], config.app_id, config.developer_id)
                await update.message.reply_text(msg or "\u274c User not found.")

        async def hwidreset(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            if not context.args:
                return await update.message.reply_text("Usage: /hwidreset <username>")
            async with AsyncSessionLocal() as db:
                msg = await BotService.reset_hwid(db, context.args[0], config.app_id, config.developer_id)
                await update.message.reply_text(msg or "\u274c User not found.")

        async def appinfo(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            async with AsyncSessionLocal() as db:
                msg = await BotService.app_details(db, config.app_id, config.developer_id)
                await update.message.reply_text(msg or "\u274c App not found.")

        async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            async with AsyncSessionLocal() as db:
                msg = await BotService.app_stats(db, config.app_id, config.developer_id)
                await update.message.reply_text(msg or "\u274c App not found.")

        async def listkeys(update: Update, context: ContextTypes.DEFAULT_TYPE):
            if not await self._tg_auth(update, config):
                return await update.message.reply_text("\u26d4 Not authorized.")
            limit = 10
            if context.args:
                try:
                    limit = max(1, min(int(context.args[0]), 25))
                except ValueError:
                    pass
            async with AsyncSessionLocal() as db:
                msg = await BotService.list_keys(db, config.app_id, config.developer_id, limit)
                await update.message.reply_text(msg or "\u274c App not found.")

        return [
            CommandHandler("start", start),
            CommandHandler("help", help_cmd),
            CommandHandler("genkey", genkey),
            CommandHandler("keyinfo", keyinfo),
            CommandHandler("pausekey", pausekey),
            CommandHandler("resumekey", resumekey),
            CommandHandler("delkey", delkey),
            CommandHandler("userinfo", userinfo),
            CommandHandler("ban", ban),
            CommandHandler("unban", unban),
            CommandHandler("hwidreset", hwidreset),
            CommandHandler("appinfo", appinfo),
            CommandHandler("stats", stats),
            CommandHandler("listkeys", listkeys),
        ]

    async def run_telegram_bot(self, config):
        try:
            tg_app = TelegramApp.builder().token(config.bot_token).build()
            self._telegram_apps[config.id] = tg_app
            handlers = self._make_tg_handlers(config)
            for h in handlers:
                tg_app.add_handler(h)
            await tg_app.initialize()
            await tg_app.start()
            await tg_app.updater.start_polling()
            while True:
                await asyncio.sleep(3600)
        except Exception as e:
            logger.error(f"Telegram bot {config.id} error: {e}")

    async def stop_bot(self, bot_id, bot_type):
        try:
            if bot_type == "discord":
                if bot_id in self.active_discord_bots:
                    self.active_discord_bots[bot_id].cancel()
                    del self.active_discord_bots[bot_id]
                if bot_id in self._discord_clients:
                    await self._discord_clients[bot_id].close()
                    del self._discord_clients[bot_id]
            elif bot_type == "telegram":
                if bot_id in self.active_telegram_bots:
                    self.active_telegram_bots[bot_id].cancel()
                    del self.active_telegram_bots[bot_id]
                if bot_id in self._telegram_apps:
                    await self._telegram_apps[bot_id].stop()
                    await self._telegram_apps[bot_id].shutdown()
                    del self._telegram_apps[bot_id]
        except Exception as e:
            logger.error(f"Error stopping bot {bot_id}: {e}")

    async def stop_all(self):
        for bid in list(self.active_discord_bots.keys()):
            await self.stop_bot(bid, "discord")
        for bid in list(self.active_telegram_bots.keys()):
            await self.stop_bot(bid, "telegram")

manager = BotManager()
