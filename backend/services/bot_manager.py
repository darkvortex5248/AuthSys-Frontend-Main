import logging

logger = logging.getLogger("BotManager")

# NOTE: Server-side bot management has been removed.
# Bots run client-side on the user's own machine/server.
# They make HTTP requests to the AuthSys Seller API endpoints.
# See: sdk/AuthSys-Discord-Bot-Example/ and sdk/AuthSys-Telegram-Bot-Example/
# The seller API endpoints are defined in routers/seller_api.py
# Database helpers are in services/bot_service.py
