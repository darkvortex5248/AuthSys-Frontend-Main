from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, delete as sa_delete
from core.database import get_db
from core.deps import get_current_developer
from models.domain import WebhookLog, DeveloperAccount, WebhookEndpoint, WebhookDelivery, Application
from schemas.dashboard import WebhookEndpointCreate, WebhookEndpointUpdate, WebhookEndpointResponse
from schemas.premium import WebhookDeliveryResponse
from services.plan_enforcer import require_feature
from routers.developer_keys import verify_app_owner
from datetime import datetime, timezone
import httpx
import hashlib
import hmac
import secrets
from typing import List

router = APIRouter(prefix="/api/v1/developer/webhooks", tags=["Webhooks"])

# ── Helpers ──────────────────────────────────────────────────────────────

async def get_endpoint_or_404(ep_id: int, dev_id: int, db: AsyncSession) -> WebhookEndpoint:
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == ep_id))
    ep = res.scalars().first()
    if not ep:
        raise HTTPException(404, "Webhook endpoint not found")
    await verify_app_owner(ep.app_id, dev_id, db)
    return ep

def format_endpoint(ep: WebhookEndpoint) -> dict:
    return {
        "id": ep.id,
        "app_id": ep.app_id,
        "url": ep.url,
        "description": ep.description or '',
        "secret": ep.secret_token or '',
        "events": ep.events or [],
        "is_active": ep.is_active,
        "last_sent_at": ep.last_sent_at.isoformat() if ep.last_sent_at else None,
        "last_status": ep.last_status,
        "created_at": ep.created_at.isoformat() if ep.created_at else '',
    }

# ── Flat REST endpoints (matching frontend conventions) ─────────────────

@router.get("", response_model=List[dict])
async def list_webhooks(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """List all webhook endpoints across all of the developer's apps."""
    await require_feature(dev, "has_webhooks", db)
    apps_res = await db.execute(select(Application.id).where(Application.developer_id == dev.id))
    app_ids = [r for r in apps_res.scalars().all()]
    if not app_ids:
        return []
    res = await db.execute(
        select(WebhookEndpoint).where(WebhookEndpoint.app_id.in_(app_ids)).order_by(desc(WebhookEndpoint.created_at))
    )
    return [format_endpoint(ep) for ep in res.scalars().all()]

@router.post("", response_model=dict)
async def create_webhook(req: WebhookEndpointCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Create a new webhook endpoint."""
    await require_feature(dev, "has_webhooks", db)
    await verify_app_owner(req.app_id, dev.id, db)
    new_ep = WebhookEndpoint(
        app_id=req.app_id,
        url=req.url,
        description=req.description,
        events=req.events,
        secret_token=secrets.token_hex(16),
    )
    db.add(new_ep)
    await db.commit()
    await db.refresh(new_ep)
    return format_endpoint(new_ep)

@router.get("/{ep_id}", response_model=dict)
async def get_webhook(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Get a single webhook endpoint."""
    await require_feature(dev, "has_webhooks", db)
    ep = await get_endpoint_or_404(ep_id, dev.id, db)
    return format_endpoint(ep)

@router.put("/{ep_id}", response_model=dict)
async def update_webhook(ep_id: int, req: WebhookEndpointUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Update a webhook endpoint (also used for toggle)."""
    await require_feature(dev, "has_webhooks", db)
    ep = await get_endpoint_or_404(ep_id, dev.id, db)
    if req.url is not None: ep.url = req.url
    if req.description is not None: ep.description = req.description
    if req.events is not None: ep.events = req.events
    if req.is_active is not None: ep.is_active = req.is_active
    await db.commit()
    await db.refresh(ep)
    return format_endpoint(ep)

@router.delete("/{ep_id}")
async def delete_webhook(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Delete a webhook endpoint."""
    await require_feature(dev, "has_webhooks", db)
    ep = await get_endpoint_or_404(ep_id, dev.id, db)
    # Clean up deliveries and logs
    await db.execute(sa_delete(WebhookDelivery).where(WebhookDelivery.endpoint_id == ep_id))
    await db.execute(sa_delete(WebhookLog).where(WebhookLog.endpoint_id == ep_id))
    await db.delete(ep)
    await db.commit()
    return {"status": "deleted"}

@router.post("/{ep_id}/test")
async def test_webhook(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Send a test event to a webhook endpoint."""
    await require_feature(dev, "has_webhooks", db)
    ep = await get_endpoint_or_404(ep_id, dev.id, db)
    import json as json_lib
    test_payload = {
        "event": "test",
        "data": {"message": "This is a test webhook from RinoxAuth", "timestamp": datetime.now(timezone.utc).isoformat()},
    }
    delivery = WebhookDelivery(
        endpoint_id=ep.id, event_type="test", payload=test_payload,
        max_attempts=1, attempt_number=1,
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    try:
        payload_bytes = json_lib.dumps(test_payload).encode()
        signature = hmac.new((ep.secret_token or "").encode(), payload_bytes, hashlib.sha256).hexdigest()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                ep.url, json=test_payload,
                headers={"Content-Type": "application/json", "X-Webhook-Signature": signature},
            )
        delivery.response_status = resp.status_code
        delivery.response_body = resp.text[:1000]
        delivery.duration_ms = int(resp.elapsed.total_seconds() * 1000)
        delivery.status = "delivered" if resp.status_code < 500 else "failed"
        delivery.delivered_at = datetime.now(timezone.utc) if resp.status_code < 500 else None
        ep.last_sent_at = datetime.now(timezone.utc)
        ep.last_status = "success" if resp.status_code < 500 else f"http_{resp.status_code}"
        await db.commit()
        return {"status": delivery.status, "status_code": resp.status_code, "message": "Test event sent"}
    except Exception as e:
        delivery.status = "failed"
        delivery.error_message = str(e)
        ep.last_sent_at = datetime.now(timezone.utc)
        ep.last_status = "error"
        await db.commit()
        raise HTTPException(400, detail=f"Test failed: {str(e)}")

@router.get("/{ep_id}/logs", response_model=List[dict])
async def get_webhook_endpoint_logs(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    """Get delivery logs for a specific webhook endpoint."""
    await require_feature(dev, "has_webhooks", db)
    ep = await get_endpoint_or_404(ep_id, dev.id, db)
    res = await db.execute(
        select(WebhookDelivery).where(WebhookDelivery.endpoint_id == ep_id)
        .order_by(desc(WebhookDelivery.created_at)).limit(100)
    )
    deliveries = res.scalars().all()
    return [
        {
            "id": d.id,
            "event": d.event_type,
            "url": ep.url,
            "status": d.status,
            "status_code": d.response_status,
            "duration": d.duration_ms,
            "timestamp": d.created_at.isoformat() if d.created_at else None,
            "response": d.response_body,
        }
        for d in deliveries
    ]

# ── Legacy nested endpoints (kept for backward compat) ──────────────────

@router.get("/{app_id}/logs", deprecated=True)
async def get_webhook_logs_legacy(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_webhooks", db)
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(WebhookLog).where(WebhookLog.app_id == app_id).order_by(WebhookLog.id.desc()).limit(100))
    return res.scalars().all()

@router.get("/{app_id}/deliveries", response_model=list[WebhookDeliveryResponse], deprecated=True)
async def get_webhook_deliveries_legacy(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_webhooks", db)
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(
        select(WebhookDelivery)
        .join(WebhookEndpoint, WebhookDelivery.endpoint_id == WebhookEndpoint.id)
        .where(WebhookEndpoint.app_id == app_id)
        .order_by(desc(WebhookDelivery.created_at)).limit(100)
    )
    return res.scalars().all()

@router.post("/{ep_id}/retry")
async def retry_delivery(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_webhooks", db)
    ep_res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == ep_id))
    ep = ep_res.scalars().first()
    if not ep:
        raise HTTPException(404, "Endpoint not found")
    await verify_app_owner(ep.app_id, dev.id, db)
    res = await db.execute(
        select(WebhookDelivery).where(
            WebhookDelivery.endpoint_id == ep_id,
            WebhookDelivery.status.in_(["failed", "delivered"]),
        ).order_by(desc(WebhookDelivery.created_at)).limit(10)
    )
    deliveries = res.scalars().all()
    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for d in deliveries:
            try:
                payload_bytes = d.payload if isinstance(d.payload, bytes) else str(d.payload).encode()
                signature = hmac.new((ep.secret_token or "").encode(), payload_bytes, hashlib.sha256).hexdigest()
                resp = await client.post(
                    ep.url, json=d.payload,
                    headers={"Content-Type": "application/json", "X-Webhook-Signature": signature},
                )
                new_delivery = WebhookDelivery(
                    endpoint_id=ep.id, event_type=d.event_type, payload=d.payload,
                    response_status=resp.status_code, response_body=resp.text[:1000],
                    attempt_number=d.attempt_number + 1, max_attempts=d.max_attempts + 1,
                    status="delivered" if resp.status_code < 500 else "failed",
                    duration_ms=resp.elapsed.total_seconds() * 1000,
                    delivered_at=datetime.now(timezone.utc) if resp.status_code < 500 else None,
                )
                db.add(new_delivery)
                results.append({"event": d.event_type, "status": resp.status_code})
            except Exception as e:
                new_delivery = WebhookDelivery(
                    endpoint_id=ep.id, event_type=d.event_type, payload=d.payload,
                    status="failed", error_message=str(e),
                )
                db.add(new_delivery)
                results.append({"event": d.event_type, "error": str(e)})
    await db.commit()
    return {"retried": len(results), "results": results}

@router.get("/{app_id}/endpoints", deprecated=True)
async def get_endpoints_legacy(app_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_webhooks", db)
    await verify_app_owner(app_id, dev.id, db)
    res = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.app_id == app_id))
    return [format_endpoint(ep) for ep in res.scalars().all()]

@router.post("/add", deprecated=True)
async def add_endpoint_legacy(req: WebhookEndpointCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    await require_feature(dev, "has_webhooks", db)
    await verify_app_owner(req.app_id, dev.id, db)
    new_ep = WebhookEndpoint(
        app_id=req.app_id,
        url=req.url,
        description=req.description,
        events=req.events,
        secret_token=secrets.token_hex(16),
    )
    db.add(new_ep)
    await db.commit()
    await db.refresh(new_ep)
    return format_endpoint(new_ep)

@router.put("/endpoint/{ep_id}", deprecated=True)
async def update_endpoint_legacy(ep_id: int, req: WebhookEndpointUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    return await update_webhook(ep_id, req, dev, db)

@router.delete("/endpoint/{ep_id}", deprecated=True)
async def delete_endpoint_legacy(ep_id: int, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    return await delete_webhook(ep_id, dev, db)

# ── Internal trigger helper ──────────────────────────────────────────────

async def trigger_webhook(endpoint: WebhookEndpoint, event_type: str, payload: dict, db: AsyncSession):
    """Send a webhook event to an endpoint with retry logic."""
    import json as json_lib
    delivery = WebhookDelivery(
        endpoint_id=endpoint.id, event_type=event_type, payload=payload,
        max_attempts=3, attempt_number=1,
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(delivery)
    try:
        payload_bytes = json_lib.dumps(payload).encode()
        signature = hmac.new((endpoint.secret_token or "").encode(), payload_bytes, hashlib.sha256).hexdigest()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                endpoint.url, json=payload,
                headers={"Content-Type": "application/json", "X-Webhook-Signature": signature},
            )
        delivery.response_status = resp.status_code
        delivery.response_body = resp.text[:1000]
        delivery.duration_ms = int(resp.elapsed.total_seconds() * 1000)
        if resp.status_code < 500:
            delivery.status = "delivered"
            delivery.delivered_at = datetime.now(timezone.utc)
        else:
            delivery.status = "failed"
            delivery.error_message = f"HTTP {resp.status_code}"
            if delivery.attempt_number < delivery.max_attempts:
                delivery.status = "retrying"
                delivery.next_retry_at = datetime.now(timezone.utc)
    except Exception as e:
        delivery.status = "failed"
        delivery.error_message = str(e)
    await db.commit()
