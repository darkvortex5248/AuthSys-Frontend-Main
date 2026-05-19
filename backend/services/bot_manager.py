import asyncio
import discord
from discord import app_commands
from telegram import Bot, Update
from telegram.ext import Application as TelegramApp, CommandHandler, ContextTypes
from sqlalchemy.future import select
from core.database import AsyncSessionLocal
from models.domain import BotConfig, Application, LicenseKey, EndUser
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BotManager")

class MultiBotClient(discord.Client):
    def __init__(self, bot_config):
        intents = discord.Intents.all()
        super().__init__(intents=intents)
        self.config = bot_config
        self.tree = app_commands.CommandTree(self)
        
    async def setup_hook(self):
        # Register commands for this specific bot
        @self.tree.command(name="genkey", description="Generate a license key")
        async def genkey(interaction: discord.Interaction, days: int, note: str = "Discord"):
            await interaction.response.defer()
            async with AsyncSessionLocal() as db:
                # Find the application linked to this bot
                res = await db.execute(select(Application).where(Application.id == self.config.app_id))
                app = res.scalars().first()
                if not app:
                    return await interaction.followup.send("❌ Application not found for this bot.")
                
                # Logic to generate key
                import secrets
                import string
                alphabet = string.ascii_letters + string.digits
                key_val = f"AUTHSYS-{''.join(secrets.choice(alphabet) for _ in range(16))}"
                
                new_key = LicenseKey(app_id=app.id, key_value=key_val, key_type="time", duration_days=days, note=note)
                db.add(new_key)
                await db.commit()
                await interaction.followup.send(f"✅ **Key Generated for {app.name}**\nKey: `{key_val}`\nDuration: {days} days")

        await self.tree.sync()
        logger.info(f"Bot {self.user} is synchronized and online.")

class BotManager:
    def __init__(self):
        self.active_discord_bots = {} # {bot_id: client_task}
        self.active_telegram_bots = {} # {bot_id: app_task}

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
            await client.start(config.bot_token)
        except Exception as e:
            logger.error(f"Failed to run Discord bot {config.id}: {e}")

    async def run_telegram_bot(self, config):
        try:
            # Simple command handlers for Telegram
            async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
                await update.message.reply_text(f"👋 Welcome! I am your AuthSys management bot for app ID: {config.app_id}")

            async def genkey(update: Update, context: ContextTypes.DEFAULT_TYPE):
                try:
                    days = int(context.args[0]) if context.args else 1
                    async with AsyncSessionLocal() as db:
                        res = await db.execute(select(Application).where(Application.id == config.app_id))
                        app = res.scalars().first()
                        if not app: return await update.message.reply_text("❌ App not found.")
                        
                        import secrets, string
                        key_val = f"AUTHSYS-TG-{''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))}"
                        new_key = LicenseKey(app_id=app.id, key_value=key_val, key_type="time", duration_days=days)
                        db.add(new_key)
                        await db.commit()
                        await update.message.reply_text(f"✅ **Key Generated!**\nKey: `{key_val}`\nDuration: {days} days")
                except Exception as e:
                    await update.message.reply_text(f"❌ Error: {str(e)}")

            tg_app = TelegramApp.builder().token(config.bot_token).build()
            tg_app.add_handler(CommandHandler("start", start))
            tg_app.add_handler(CommandHandler("genkey", genkey))
            
            await tg_app.initialize()
            await tg_app.start()
            await tg_app.updater.start_polling()
            
            # Keep it running
            while True: await asyncio.sleep(3600)
            
        except Exception as e:
            logger.error(f"Failed to run Telegram bot {config.id}: {e}")

    async def stop_bot(self, bot_id, bot_type):
        if bot_type == "discord" and bot_id in self.active_discord_bots:
            self.active_discord_bots[bot_id].cancel()
            del self.active_discord_bots[bot_id]
        elif bot_type == "telegram" and bot_id in self.active_telegram_bots:
            self.active_telegram_bots[bot_id].cancel()
            del self.active_telegram_bots[bot_id]

# Global instance
manager = BotManager()
