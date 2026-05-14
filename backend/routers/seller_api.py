from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
import secrets

from core.database import get_db
from core.deps import get_current_developer
from models.domain import SellerAccount, LicenseKey, Application, DeveloperAccount

router = APIRouter(prefix="/api/v1/developer/sellers", tags=["Seller API"])

class SellerResponse(BaseModel):
    id: int
    name: str
    api_key: str
    is_active: bool

class SellerCreate(BaseModel):
    name: str

@router.get("", response_model=List[SellerResponse])
async def get_sellers(dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SellerAccount).where(SellerAccount.developer_id == dev.id))
    return res.scalars().all()

@router.post("", response_model=SellerResponse)
async def create_seller(req: SellerCreate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    # Generate a secure API Key for the seller
    api_key = f"sk_{secrets.token_urlsafe(32)}"
    new_seller = SellerAccount(developer_id=dev.id, name=req.name, api_key=api_key)
    db.add(new_seller)
    await db.commit()
    await db.refresh(new_seller)
    return new_seller

# Public Endpoint for Sellers to use
@router.post("/generate-key")
async def seller_generate_key(app_id: int, duration: int, seller_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    # Verify Seller
    res = await db.execute(select(SellerAccount).where(SellerAccount.api_key == seller_key, SellerAccount.is_active == True))
    seller = res.scalars().first()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid Seller API Key")
        
    # Logic to generate license key for the app
    import string
    alphabet = string.ascii_uppercase + string.digits
    key_val = f"SELL-{''.join(secrets.choice(alphabet) for _ in range(16))}"
    
    new_key = LicenseKey(
        app_id=app_id, 
        key_value=key_val, 
        key_type="time", 
        duration_days=duration,
        seller_tag=seller.name
    )
    db.add(new_key)
    await db.commit()
    return {"status": "success", "key": key_val}
