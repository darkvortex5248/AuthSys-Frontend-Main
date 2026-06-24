"""Background scheduler that executes pending scheduled actions every 60 seconds."""
import asyncio
import logging
from core.database import AsyncSessionLocal
from routers.developer_scheduled import check_and_execute_scheduled

logger = logging.getLogger(__name__)

async def scheduler_loop():
    logger.info("Scheduler loop started")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await check_and_execute_scheduled(db)
        except Exception as e:
            logger.warning(f"Scheduler check failed: {e}")
        await asyncio.sleep(60)
