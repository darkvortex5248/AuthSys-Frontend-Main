from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import delete as sa_delete
from sqlalchemy import update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from models.domain import ActivityLog, ChatMessage, Session


async def cleanup_end_user_dependencies(
    db: AsyncSession,
    user_ids: int | Iterable[int],
) -> None:
    if isinstance(user_ids, int):
        ids = [user_ids]
    else:
        ids = list(user_ids)

    if not ids:
        return

    await db.execute(sa_delete(Session).where(Session.user_id.in_(ids)))
    await db.execute(sa_delete(ChatMessage).where(ChatMessage.user_id.in_(ids)))
    await db.execute(
        sa_update(ActivityLog)
        .where(ActivityLog.user_id.in_(ids))
        .values(user_id=None)
    )
