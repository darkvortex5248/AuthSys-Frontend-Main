"""Reusable transaction safety helpers for all CRUD endpoints.

Usage:

    from core.transaction import db_transaction

    @router.delete("/{id}")
    @db_transaction
    async def delete_thing(id: int, db: AsyncSession = Depends(get_db)):
        obj = await db.get(Model, id)
        if not obj:
            raise HTTPException(404, "Not found")
        await db.delete(obj)
        return {"status": "deleted"}

The decorator automatically wraps the function in a transaction:
- On success: commits pending work and returns the result
- On HTTPException: rolls back pending work and re-raises the client error
- On unexpected error: rolls back pending work and returns a sanitized 500
"""
from __future__ import annotations

import functools
import logging
import time
from typing import Any, Callable, Coroutine

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


def db_transaction(func: Callable[..., Coroutine[Any, Any, Any]]) -> Callable[..., Coroutine[Any, Any, Any]]:
    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        db: AsyncSession | None = None
        for arg in args:
            if isinstance(arg, AsyncSession):
                db = arg
                break
        if db is None:
            db = kwargs.get("db")

        started = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            if db is not None and db.in_transaction():
                await db.commit()
                logger.info(
                    "mutation.commit route=%s elapsed_ms=%.2f",
                    func.__qualname__,
                    (time.perf_counter() - started) * 1000,
                )
            return result
        except HTTPException as exc:
            if db is not None and db.in_transaction():
                try:
                    await db.rollback()
                    logger.info(
                        "mutation.rollback route=%s status=%s elapsed_ms=%.2f",
                        func.__qualname__,
                        exc.status_code,
                        (time.perf_counter() - started) * 1000,
                    )
                except Exception as rollback_exc:
                    logger.error("Rollback failed: %s", rollback_exc, exc_info=True)
            raise
        except Exception as exc:
            if db is not None and db.in_transaction():
                try:
                    await db.rollback()
                except Exception as rollback_exc:
                    logger.error("Rollback failed: %s", rollback_exc, exc_info=True)
            logger.error(
                "Transaction failed in %s: %s",
                func.__qualname__,
                exc,
                exc_info=True,
            )
            raise HTTPException(
                status_code=500,
                detail="Operation failed",
            ) from exc

    return wrapper
