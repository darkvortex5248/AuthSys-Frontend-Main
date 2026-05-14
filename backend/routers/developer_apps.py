from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets
import string
from core.database import get_db
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

@router.get("", response_model=list[AppResponse])
async def get_apps(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Fetch own apps + apps from teams where user is a member
    stmt = select(Application).where(
        (Application.developer_id == dev.id) |
        (Application.developer_id.in_(
            select(TeamMember.developer_id).where(TeamMember.user_id == dev.id)
        ))
    )
    res = await db.execute(stmt)
    apps = res.scalars().all()
    
    # Enrich with counts
    for app in apps:
        # Users
        u_res = await db.execute(select(func.count(EndUser.id)).where(EndUser.app_id == app.id, EndUser.is_shadow == False))
        app.total_users = u_res.scalar() or 0
        
        # Keys
        k_res = await db.execute(select(func.count(LicenseKey.id)).where(LicenseKey.app_id == app.id))
        app.total_keys = k_res.scalar() or 0
        
        # Today's logins
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        t_res = await db.execute(select(func.count(ActivityLog.id)).where(
            ActivityLog.app_id == app.id, 
            ActivityLog.action_type == "login",
            ActivityLog.timestamp >= today_start
        ))
        app.logins_today = t_res.scalar() or 0
        
    return apps

@router.post("/create", response_model=AppResponse)
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
async def regen_owner_id(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.owner_id = generate_secure_id(12)
    await db.commit()
    return {"owner_id": app.owner_id}

@router.put("/{app_id}/update")
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
    
    # Real stats from ActivityLog
    visits_res = await db.execute(select(ActivityLog).where(ActivityLog.app_id == app_id, ActivityLog.action_type == "login"))
    visits = len(visits_res.scalars().all())
    
    resets_res = await db.execute(select(ActivityLog).where(ActivityLog.app_id == app_id, ActivityLog.action_type == "hwid_reset"))
    resets = len(resets_res.scalars().all())
    
    return {
        "visits": visits,
        "resets": resets
    }

@router.put("/{app_id}/toggle")
async def toggle_app(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.status = "inactive" if app.status == "active" else "active"
    await db.commit()
    return {"status": app.status}
    
@router.post("/{app_id}/regenerate-secret")
async def regen_secret(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    app.app_secret = secrets.token_hex(32)
    await db.commit()
    return {"app_secret": app.app_secret}
    
@router.delete("/{app_id}")
async def delete_app(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Application).where(Application.id == app_id, Application.developer_id == dev.id))
    app = res.scalars().first()
    if not app: raise HTTPException(404, "Not found")
    await db.delete(app)
    await db.commit()
    return {"status": "deleted"}
