from __future__ import annotations

import stripe
import logging
from core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.domain import Payment, DeveloperAccount, SubscriptionPlan

logger = logging.getLogger(__name__)


def get_stripe() -> stripe.Stripe:
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("STRIPE_SECRET_KEY is not configured")
    return stripe.Stripe(settings.STRIPE_SECRET_KEY)


async def create_checkout_session(
    dev: DeveloperAccount,
    plan: SubscriptionPlan,
    billing: str = "monthly",
    success_url: str = "",
    cancel_url: str = "",
    db: AsyncSession | None = None,
) -> dict:
    s = get_stripe()
    # SubscriptionPlan prices are stored in the smallest currency unit (cents),
    # which is exactly what Stripe expects for unit_amount.
    billing = (billing or "monthly").lower()
    is_yearly = billing == "yearly"
    price_cents = plan.price_yearly if is_yearly else plan.price_monthly

    if not dev.stripe_customer_id:
        customer = s.customers.create(
            email=dev.email,
            name=dev.username,
            metadata={"developer_id": str(dev.id)},
        )
        dev.stripe_customer_id = customer.id
        if db:
            await db.commit()

    # Subscribe (recurring) rather than charging once. Previously mode="payment"
    # turned "monthly"/"yearly" plans into single one-time charges, so a plan
    # never actually renewed.
    session = s.checkout.sessions.create(
        customer=dev.stripe_customer_id,
        mode="subscription",
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{plan.name} — {billing.capitalize()}",
                    },
                    "unit_amount": price_cents,
                    "recurring": {"interval": "year" if is_yearly else "month"},
                },
                "quantity": 1,
            }
        ],
        metadata={
            "developer_id": str(dev.id),
            "plan_id": str(plan.id),
            "billing": billing,
        },
        success_url=success_url,
        cancel_url=cancel_url,
    )

    return {
        "session_id": session.id,
        "url": session.url,
        "amount": price_cents,
    }


async def handle_webhook_payload(
    payload: bytes,
    sig_header: str,
    db: AsyncSession,
) -> dict:
    s = get_stripe()
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = s.webhooks.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        logger.warning("Stripe webhook: invalid payload")
        return {"status": "ignored", "reason": "invalid_payload"}
    except stripe.errors.SignatureVerificationError:
        logger.warning("Stripe webhook: invalid signature")
        return {"status": "ignored", "reason": "invalid_signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await _process_completed_checkout(session, db)
    elif event["type"] == "checkout.session.expired":
        logger.info("Stripe checkout session expired: %s", event["data"]["object"].get("id"))

    return {"status": "ok"}


async def _process_completed_checkout(session: dict, db: AsyncSession) -> None:
    session_id = session.get("id")
    metadata = session.get("metadata", {})
    developer_id = int(metadata.get("developer_id", 0))
    plan_id = int(metadata.get("plan_id", 0))

    if not developer_id or not plan_id:
        logger.warning("Stripe webhook: missing metadata in session %s", session_id)
        return

    res = await db.execute(select(Payment).where(Payment.stripe_session_id == session_id))
    existing = res.scalars().first()
    if existing:
        existing.status = "completed"
        await db.commit()
        logger.info("Stripe payment completed for existing payment %s", existing.id)
        return

    payment = Payment(
        developer_id=developer_id,
        plan_id=plan_id,
        amount=session.get("amount_total", 0),
        currency=session.get("currency", "usd"),
        status="completed",
        stripe_session_id=session_id,
        payment_method="Stripe",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    dev_res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == developer_id))
    dev = dev_res.scalars().first()
    plan_res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = plan_res.scalars().first()
    if dev and plan:
        dev.plan_id = plan_id
        dev.subscription_tier = plan.name.lower()
        await db.commit()
        logger.info(
            "Developer %s upgraded to %s via Stripe session %s",
            developer_id, plan.name, session_id,
        )
