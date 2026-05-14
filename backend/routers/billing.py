from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from models.domain import DeveloperAccount, SubscriptionPlan, Payment, PaymentMethod
from core.deps import get_current_developer
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/billing", tags=["Billing"])

class OrderCreate(BaseModel):
    plan_id: int
    payment_method: Optional[str] = None
    wallet: Optional[str] = None
    transaction_id: Optional[str] = None

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
    # Check if plan exists
    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == order.plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(404, "Subscription plan not found")
    
    # Create a pending payment (Manual order)
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

@router.get("/my-payments")
async def get_my_payments(
    dev: DeveloperAccount = Depends(get_current_developer), 
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Payment).where(Payment.developer_id == dev.id).order_by(Payment.created_at.desc())
    )
    return res.scalars().all()
