from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.deps import get_current_developer
from models.domain import WebhookLog, DeveloperAccount, WebhookEndpoint
from schemas.dashboard import WebhookEndpointCreate, WebhookEndpointUpdate
from routers.developer_keys import verify_app_owner

router = APIRouter(prefix="/api/v1/developer/webhooks", tags=["Webhooks"])

@router.get("/{app_id}/logs")
async def get_webhook_logs(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(WebhookLog).where(WebhookLog.app_id == app_id).order_by(WebhookLog.id.desc()).limit(100))
    return res.scalars().all()

@router.get("/{app_id}/endpoints")
async def get_endpoints(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.app_id == app_id))
    return res.scalars().all()

@router.post("/add")
async def add_endpoint(req: WebhookEndpointCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await verify_app_owner(req.app_id, dev.id, db)
    new_ep = WebhookEndpoint(
        app_id=req.app_id,
        url=req.url,
        events=req.events
    )
    db.add(new_ep)
    await db.commit()
    await db.refresh(new_ep)
    return new_ep

@router.put("/endpoint/{ep_id}")
async def update_endpoint(ep_id: int, req: WebhookEndpointUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == ep_id))
    ep = res.scalars().first()
    if not ep: return {"error": "Not found"}
    await verify_app_owner(ep.app_id, dev.id, db)
    
    if req.url is not None: ep.url = req.url
    if req.events is not None: ep.events = req.events
    if req.is_active is not None: ep.is_active = req.is_active
    
    await db.commit()
    return ep

@router.delete("/endpoint/{ep_id}")
async def delete_endpoint(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == ep_id))
    ep = res.scalars().first()
    if not ep: return {"error": "Not found"}
    await verify_app_owner(ep.app_id, dev.id, db)
    
    await db.delete(ep)
    await db.commit()
    return {"status": "deleted"}
