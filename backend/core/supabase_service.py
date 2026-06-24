from __future__ import annotations

import logging
from typing import Any

from core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Any = None


def get_supabase_admin():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        logger.info("Supabase admin client created (service_role key)")
        return _supabase_client
    except ImportError:
        logger.warning("supabase-py not installed — run: pip install supabase")
        return None
    except Exception as exc:
        logger.warning("Failed to create Supabase client: %s", exc)
        return None


async def check_db_connection() -> bool:
    try:
        from core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("Database connection check failed: %s", exc)
        return False


async def rest_query(table: str, method_name: str = "select", **kwargs) -> list[dict] | None:
    client = get_supabase_admin()
    if client is None:
        return None
    try:
        q = client.table(table)
        method = getattr(q, method_name, None)
        if method is None:
            return None
        result = method(**kwargs).execute()
        return result.data if hasattr(result, "data") else None
    except Exception as exc:
        logger.error("Supabase REST query %s.%s failed: %s", table, method_name, exc)
        return None


async def rest_insert(table: str, data: dict) -> dict | None:
    r = await rest_query(table, "insert", **data)
    return r[0] if r else None


async def rest_select(table: str, column: str = "*", eq: tuple[str, Any] | None = None) -> list[dict] | None:
    client = get_supabase_admin()
    if client is None:
        return None
    try:
        q = client.table(table).select(column)
        if eq:
            q = q.eq(eq[0], eq[1])
        result = q.execute()
        return result.data if hasattr(result, "data") else None
    except Exception as exc:
        logger.error("Supabase REST select %s failed: %s", table, exc)
        return None


async def rest_update(table: str, match_col: str, match_val: Any, data: dict) -> list[dict] | None:
    client = get_supabase_admin()
    if client is None:
        return None
    try:
        result = client.table(table).update(data).eq(match_col, match_val).execute()
        return result.data if hasattr(result, "data") else None
    except Exception as exc:
        logger.error("Supabase REST update %s failed: %s", table, exc)
        return None


async def rest_delete(table: str, match_col: str, match_val: Any) -> list[dict] | None:
    client = get_supabase_admin()
    if client is None:
        return None
    try:
        result = client.table(table).delete().eq(match_col, match_val).execute()
        return result.data if hasattr(result, "data") else None
    except Exception as exc:
        logger.error("Supabase REST delete %s failed: %s", table, exc)
        return None
