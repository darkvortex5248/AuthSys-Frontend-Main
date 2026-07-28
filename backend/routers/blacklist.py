from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import Blacklist, DeveloperAccount
from routers.developer_keys import verify_app_owner
from schemas.dashboard import BlacklistAdd

router = APIRouter(prefix="/api/v1/developer/blacklist", tags=["Blacklist"])

@router.get("/{app_id}")
async def get_blacklist(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(Blacklist).where(Blacklist.app_id == app_id))
    return res.scalars().all()

@router.post("/add")
@db_transaction
async def add_blacklist(req: BlacklistAdd, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(req.app_id, dev.id, db)
    b = Blacklist(app_id=req.app_id, type=req.type, value=req.value, reason=req.reason)
    db.add(b)
    await db.commit()
    return {"status": "added"}

@router.delete("/{id}")
@db_transaction
async def delete_blacklist(id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Blacklist).where(Blacklist.id == id))
    b = res.scalars().first()
    if not b: raise HTTPException(404, "Not found")
    await verify_app_owner(b.app_id, dev.id, db)
    await db.delete(b)
    await db.commit()
    return {"status": "deleted"}
