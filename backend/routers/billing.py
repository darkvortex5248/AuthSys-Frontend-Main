from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from core.config import settings
from models.domain import DeveloperAccount, SubscriptionPlan, Payment, PaymentMethod
from core.deps import get_current_developer
from pydantic import BaseModel
from typing import List, Optional
from services.stripe_service import create_checkout_session, handle_webhook_payload

router = APIRouter(prefix="/api/v1/billing", tags=["Billing"])


class OrderCreate(BaseModel):
    plan_id: int
    payment_method: Optional[str] = None
    wallet: Optional[str] = None
    transaction_id: Optional[str] = None


class CheckoutSessionCreate(BaseModel):
    plan_id: int
    billing: str = "monthly"
    success_url: str = ""
    cancel_url: str = ""


@router.get("/plans")
async def list_available_plans(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubscriptionPlan))
    return res.scalars().all()


@router.get("/payment-methods")
async def list_payment_methods(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentMethod).where(PaymentMethod.is_active == True).order_by(PaymentMethod.id.asc()))
    return res.scalars().all()


@router.post("/order")
async def create_order(
    order: OrderCreate, 
    dev: DeveloperAccount = Depends(get_current_developer), 
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == order.plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(404, "Subscription plan not found")
    
    # Check for existing active subscription
    existing = await db.execute(
        select(Payment).where(
            Payment.developer_id == dev.id,
            Payment.plan_id == plan.id,
            Payment.status.in_(["completed", "active"])
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="You already have an active subscription to this plan")
    
    new_payment = Payment(
        developer_id=dev.id,
        amount=plan.price_monthly,
        plan_id=plan.id,
        status="pending",
        currency="usd",
        payment_method=order.payment_method,
        wallet_number=order.wallet,
        transaction_id=order.transaction_id
    )
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    
    return {
        "status": "success",
        "message": "Order placed successfully. Please complete payment.",
        "order_id": new_payment.id,
        "amount": plan.price_monthly,
        "plan": plan.name
    }


@router.post("/create-checkout-session")
async def create_stripe_checkout_session(
    req: CheckoutSessionCreate,
    dev: DeveloperAccount = Depends(get_current_developer),
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(400, "Stripe is not configured. Contact administrator.")

    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == req.plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    try:
        result = await create_checkout_session(
            dev=dev,
            plan=plan,
            billing=req.billing,
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    result = await handle_webhook_payload(payload, sig_header, db)
    return result


@router.get("/stripe-publishable-key")
async def get_stripe_publishable_key():
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY or "",
        "configured": bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_PUBLISHABLE_KEY),
    }


@router.get("/my-payments")
async def get_my_payments(
    dev: DeveloperAccount = Depends(get_current_developer), 
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Payment).where(Payment.developer_id == dev.id).order_by(Payment.created_at.desc())
    )
    return res.scalars().all()
