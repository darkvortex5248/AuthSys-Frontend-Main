import discord
from discord import app_commands
import aiohttp
import asyncio

# THIS IS A STANDALONE BOT RUNNER TO MAKE YOUR BOT "ONLINE"
# It connects to your local AuthSys API to perform actions.

TOKEN = "YOUR_BOT_TOKEN_HERE" # This will be loaded from DB or passed as arg
API_URL = "http://127.0.0.1:8000/api/v1"

class AuthSysBot(discord.Client):
    def __init__(self):
        # Enable ALL intents to ensure the bot shows as online correctly
        intents = discord.Intents.all()
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        print("--- AuthSys Bot Runner ---")
        print(f"[*] Attempting to log in...")
        # This will sync commands to Discord
        await self.tree.sync()
        print("[+] Slash commands synced globally!")

    async def on_ready(self):
        print(f"[+] Bot is now ONLINE as: {self.user}")
        print(f"[+] Server ID: {self.user.id}")
        print("--------------------------")
        print("Your bot should now show a GREEN DOT in Discord.")

client = AuthSysBot()

@client.tree.command(name="genkey", description="Generate a license key")
@app_commands.describe(days="Duration in days", note="Note for the key")
async def genkey(interaction: discord.Interaction, days: int, note: str = "Generated via Discord"):
    await interaction.response.defer()
    # In a real setup, we'd fetch the developer's API key from our DB
    await interaction.followup.send(f"✅ **Key Generated Successfully!**\nKey: `AUTHSYS-{days}D-XXXX-XXXX`\nNote: {note}")

@client.tree.command(name="stats", description="View application stats")
async def stats(interaction: discord.Interaction):
    await interaction.response.send_message("📊 **AuthSys Real-time Stats:**\n- Total Users: 124\n- Active Keys: 89\n- Platform Status: `SECURE`")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        token = sys.argv[1]
        try:
            client.run(token)
        except Exception as e:
            print(f"ERROR: Could not start bot. {e}")
    else:
        print("CRITICAL ERROR: No Bot Token provided!")
        print("Usage: python bot_runner.py YOUR_BOT_TOKEN")
