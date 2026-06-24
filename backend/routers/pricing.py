from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from core.database import get_db
from core.deps import oauth2_scheme
from jose import jwt, JWTError
from core.config import settings
from core.security import ALGORITHM
from models.domain import PricingItem, DeveloperAccount
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/pricing", tags=["Pricing Management"])

# Pydantic schemas
class PricingItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: int  # Price in cents
    currency: str = "USD"
    billing_cycle: str  # monthly, yearly, one-time
    features: Optional[List[str]] = None
    is_active: bool = True
    is_popular: bool = False
    sort_order: int = 0

class PricingItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None

class PricingItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: int
    currency: str
    billing_cycle: str
    features: Optional[List[str]] = None
    is_active: bool
    is_popular: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Dependency to get current developer
async def get_current_developer(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    res = await db.execute(select(DeveloperAccount).where(DeveloperAccount.id == int(user_id)))
    developer = res.scalars().first()
    if not developer:
        raise HTTPException(status_code=401, detail="Developer not found")
    return developer

@router.get("/items", response_model=List[PricingItemResponse])
async def get_pricing_items(
    db: AsyncSession = Depends(get_db),
    current_developer: DeveloperAccount = Depends(get_current_developer)
):
    """Get all pricing items for the current developer"""
    stmt = select(PricingItem).order_by(PricingItem.sort_order, PricingItem.created_at)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return items

@router.get("/items/{item_id}", response_model=PricingItemResponse)
async def get_pricing_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_developer: DeveloperAccount = Depends(get_current_developer)
):
    """Get a specific pricing item by ID"""
    stmt = select(PricingItem).where(PricingItem.id == item_id)
    result = await db.execute(stmt)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Pricing item not found")
    return item

@router.post("/items", response_model=PricingItemResponse)
async def create_pricing_item(
    item: PricingItemCreate,
    db: AsyncSession = Depends(get_db),
    current_developer: DeveloperAccount = Depends(get_current_developer)
):
    """Create a new pricing item"""
    db_item = PricingItem(
        name=item.name,
        description=item.description,
        price=item.price,
        currency=item.currency,
        billing_cycle=item.billing_cycle,
        features=item.features,
        is_active=item.is_active,
        is_popular=item.is_popular,
        sort_order=item.sort_order
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.put("/items/{item_id}", response_model=PricingItemResponse)
async def update_pricing_item(
    item_id: int,
    item: PricingItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_developer: DeveloperAccount = Depends(get_current_developer)
):
    """Update an existing pricing item"""
    stmt = select(PricingItem).where(PricingItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalars().first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pricing item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db_item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}")
async def delete_pricing_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_developer: DeveloperAccount = Depends(get_current_developer)
):
    """Delete a pricing item"""
    stmt = select(PricingItem).where(PricingItem.id == item_id)
    result = await db.execute(stmt)
    db_item = result.scalars().first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pricing item not found")
    
    await db.delete(db_item)
    await db.commit()
    return {"message": "Pricing item deleted successfully"}
