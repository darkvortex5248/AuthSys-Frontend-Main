from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import Variable, DeveloperAccount
from routers.developer_keys import verify_app_owner
from schemas.dashboard import VariableCreate
from services.plan_enforcer import require_feature, check_limit

router = APIRouter(prefix="/api/v1/developer/variables", tags=["Variables"])

@router.get("/{app_id}")
async def get_variables(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(Variable).where(Variable.app_id == app_id))
    return res.scalars().all()

@router.post("/create")
async def create_variable(req: VariableCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(req.app_id, dev.id, db)
    plan = await require_feature(dev, "has_api_access", db)
    # Check variable limit
    var_count = await db.execute(select(Variable).where(Variable.app_id == req.app_id))
    current_vars = len(var_count.scalars().all())
    await check_limit(dev, "max_variables", current_vars, db, plan)
    v = Variable(app_id=req.app_id, key_name=req.key_name, key_value=req.key_value, is_global=req.is_global, allowed_users=req.allowed_users)
    db.add(v)
    await db.commit()
    return {"status": "created"}

@router.delete("/{id}")
async def delete_variable(id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Variable).where(Variable.id == id))
    v = res.scalars().first()
    if not v: raise HTTPException(404, "Not found")
    await verify_app_owner(v.app_id, dev.id, db)
    await db.delete(v)
    await db.commit()
    return {"status": "deleted"}
