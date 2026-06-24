from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import DeveloperAccount, Application, AppEnvironment
from schemas.premium import AppEnvironmentCreate, AppEnvironmentResponse
from core.security import generate_secure_id
import secrets

router = APIRouter(prefix="/api/v1/developer/environments", tags=["Environments"])

@router.get("", response_model=list[AppEnvironmentResponse])
async def get_environments(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppEnvironment)
        .join(Application, AppEnvironment.parent_app_id == Application.id)
        .where(Application.developer_id == dev.id)
        .order_by(AppEnvironment.created_at.desc())
    )
    return res.scalars().all()

@router.post("", response_model=AppEnvironmentResponse)
async def create_environment(env: AppEnvironmentCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    app_res = await db.execute(
        select(Application).where(Application.id == env.parent_app_id, Application.developer_id == dev.id)
    )
    app = app_res.scalars().first()
    if not app:
        raise HTTPException(404, "Parent app not found")
    existing = await db.execute(
        select(AppEnvironment).where(
            AppEnvironment.parent_app_id == env.parent_app_id,
            AppEnvironment.name == env.name
        )
    )
    if existing.scalars().first():
        raise HTTPException(400, f"Environment '{env.name}' already exists for this app")
    new_env = AppEnvironment(
        parent_app_id=env.parent_app_id,
        name=env.name,
        app_secret=secrets.token_hex(32),
        owner_id=generate_secure_id(12),
    )
    db.add(new_env)
    await db.commit()
    await db.refresh(new_env)
    return new_env

@router.delete("/{env_id}")
async def delete_environment(env_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppEnvironment)
        .join(Application, AppEnvironment.parent_app_id == Application.id)
        .where(AppEnvironment.id == env_id, Application.developer_id == dev.id)
    )
    env = res.scalars().first()
    if not env:
        raise HTTPException(404, "Environment not found")
    await db.delete(env)
    await db.commit()
    return {"status": "deleted"}

@router.post("/{env_id}/regenerate-secret")
async def regen_env_secret(env_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(AppEnvironment)
        .join(Application, AppEnvironment.parent_app_id == Application.id)
        .where(AppEnvironment.id == env_id, Application.developer_id == dev.id)
    )
    env = res.scalars().first()
    if not env:
        raise HTTPException(404, "Environment not found")
    env.app_secret = secrets.token_hex(32)
    await db.commit()
    return {"app_secret": env.app_secret}
