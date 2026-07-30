from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets
import string
from core.database import get_db
from core.transaction import db_transaction
from core.deps import get_current_developer
from models.domain import Application, DeveloperAccount, SubscriptionPlan, EndUser, LicenseKey, ActivityLog, TeamMember
from schemas.dashboard import AppCreate, AppUpdate, AppResponse
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from core.security import generate_secure_id

async def verify_app_access(app_id: int, dev_id: int, db: AsyncSession):
    stmt = select(Application).where(
        (Application.id == app_id) & (
            (Application.developer_id == dev_id) |
            (Application.developer_id.in_(
                select(TeamMember.developer_id).where(TeamMember.user_id == dev_id)
            ))
        )
    )
    res = await db.execute(stmt)
    if not res.scalars().first():
        raise HTTPException(status_code=403, detail="Access denied or app not found")

router = APIRouter(prefix="/api/v1/developer/apps", tags=["Apps"])


def _app_response(app: Application, *, total_users: int = 0, total_keys: int = 0, logins_today: int = 0) -> dict:
    data = AppResponse.model_validate(app).model_dump()
    data.update(
        total_users=total_users,
        total_keys=total_keys,
        logins_today=logins_today,
    )
    return data

@router.get("", response_model=list[AppResponse])
async def get_apps(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Optimized Query: Fetch apps and their related counts in fewer queries
    stmt = select(Application).where(
        (Application.developer_id == dev.id) |
        (Application.developer_id.in_(
            select(TeamMember.developer_id).where(TeamMember.user_id == dev.id)
        ))
    )
    res = await db.execute(stmt)
    apps = res.scalars().all()
    
    if not apps:
        return []

    # Get counts for all apps at once to avoid N+1 problem
    app_ids = [app.id for app in apps]
    
    # Total Users count for all apps
    users_stmt = select(EndUser.app_id, func.count(EndUser.id)).where(EndUser.app_id.in_(app_ids), EndUser.is_shadow == False).group_by(EndUser.app_id)
    users_res = await db.execute(users_stmt)
    users_counts = dict(users_res.all())
    
    # Total Keys count for all apps
    keys_stmt = select(LicenseKey.app_id, func.count(LicenseKey.id)).where(LicenseKey.app_id.in_(app_ids)).group_by(LicenseKey.app_id)
    keys_res = await db.execute(keys_stmt)
    keys_counts = dict(keys_res.all())
    
    # Today's logins
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    logins_stmt = select(ActivityLog.app_id, func.count(ActivityLog.id)).where(
        ActivityLog.app_id.in_(app_ids),
        ActivityLog.action_type == "login",
        ActivityLog.created_at >= today_start
    ).group_by(ActivityLog.app_id)
    logins_res = await db.execute(logins_stmt)
    logins_counts = dict(logins_res.all())

    return [
        _app_response(
            app,
            total_users=users_counts.get(app.id, 0),
            total_keys=keys_counts.get(app.id, 0),
            logins_today=logins_counts.get(app.id, 0),
        )
        for app in apps
    ]

@router.get("/{app_id}", response_model=AppResponse)
async def get_app(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_access(app_id, dev.id, db)
    res = await db.execute(select(Application).where(Application.id == app_id))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    users_count = (await db.execute(
        select(func.count(EndUser.id)).where(EndUser.app_id == app_id, EndUser.is_shadow == False)
    )).scalar() or 0
    keys_count = (await db.execute(
        select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app_id)
    )).scalar() or 0
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    logins_today = (await db.execute(
        select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id == app_id,
            ActivityLog.action_type == "login",
            ActivityLog.created_at >= today_start,
        )
    )).scalar() or 0

    return _app_response(
        app,
        total_users=users_count,
        total_keys=keys_count,
        logins_today=logins_today,
    )

@router.post("/create", response_model=AppResponse)
@db_transaction
async def create_app(req: AppCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Check app limit
    res = await db.execute(select(Application).where(Application.developer_id == dev.id))
    current_apps = len(res.scalars().all())
    
    max_apps = 5 # Default fallback
    if dev.plan_id:
        plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == dev.plan_id))
        plan = plan_res.scalars().first()
        if plan:
            max_apps = plan.max_apps
            
    if current_apps >= max_apps:
        raise HTTPException(
            status_code=403, 
            detail=f"You have reached the maximum number of applications allowed by your plan ({max_apps}). Upgrade your plan to create more."
        )

    try:
        new_app = Application(
            developer_id=dev.id, 
            name=req.name, 
            version=req.version, 
            min_version=req.min_version, 
            app_secret=secrets.token_hex(32),
            owner_id=generate_secure_id(12),
            status="active",
            hash_check=False,
            hwid_enabled=req.hwid_enabled
        )
        db.add(new_app)
        await db.commit()
        await db.refresh(new_app)
        return new_app
    except Exception as e:
        print(f"ERROR: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{app_id}/regenerate-owner-id")
@db_transaction
async def regen_owner_id(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.owner_id = generate_secure_id(12)
    await db.commit()
    return {"owner_id": app.owner_id}

@router.put("/{app_id}/update")
@db_transaction
async def update_app(app_id: int, req: AppUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    if req.name: app.name = req.name
    if req.hash_check is not None: app.hash_check = req.hash_check
    if req.webhook_url is not None: app.webhook_url = req.webhook_url
    if req.hwid_enabled is not None: app.hwid_enabled = req.hwid_enabled
    if req.maintenance_mode is not None: app.maintenance_mode = req.maintenance_mode
    if req.developer_lock is not None: app.developer_lock = req.developer_lock
    await db.commit()
    return {"status": "success"}

@router.get("/{app_id}/portal-stats")
async def get_portal_stats(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_access(app_id, dev.id, db)
    
    # Real stats from ActivityLog using counts
    v_stmt = select(func.count(ActivityLog.id)).where(ActivityLog.app_id == app_id, ActivityLog.action_type == "login")
    visits = (await db.execute(v_stmt)).scalar() or 0
    
    r_stmt = select(func.count(ActivityLog.id)).where(ActivityLog.app_id == app_id, ActivityLog.action_type == "hwid_reset")
    resets = (await db.execute(r_stmt)).scalar() or 0
    
    return {
        "visits": visits,
        "resets": resets
    }

@router.put("/{app_id}/toggle")
@db_transaction
async def toggle_app(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.status = "inactive" if app.status == "active" else "active"
    await db.commit()
    return {"status": app.status}
    
@router.post("/{app_id}/regenerate-secret")
@db_transaction
async def regen_secret(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.app_secret = secrets.token_hex(32)
    await db.commit()
    return {"app_secret": app.app_secret}
    
@router.delete("/{app_id}")
@db_transaction
async def delete_app(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
        app = res.scalars().first()
        if not app:
            raise HTTPException(404, "Not found")
        await db.delete(app)
        await db.commit()
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}") from e
