from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm
from core.database import get_db
from core.security import get_password_hash, verify_password, create_access_token
from models.domain import DeveloperAccount, SubscriptionPlan
import uuid
from datetime import timedelta
from core.limiter import limiter
from services.email import EmailService
from services.otp import OTPService
from schemas.auth import (
    DeveloperCreate, DeveloperResponse, Token, DeveloperGoogleLogin,
    PasswordResetRequest, OTPVerify, NewPassword, ChangePassword, DeveloperUpdate
)
from core.deps import get_current_developer
from core.turnstile import verify_turnstile

router = APIRouter(prefix="/api/v1/developer/auth", tags=["Developer Auth"])

@router.post("/register", response_model=DeveloperResponse)
@limiter.limit("5/minute")
async def register_developer(request: Request, dev_in: DeveloperCreate, db: AsyncSession = Depends(get_db)):
    if not await verify_turnstile(dev_in.turnstile_token, request.client.host if request.client else None):
        raise HTTPException(status_code=400, detail="Bot protection verification failed")
        
    result = await db.execute(select(DeveloperAccount).where(
        (DeveloperAccount.username == dev_in.username) | 
        (DeveloperAccount.email == dev_in.email)
    ))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Assign default Free plan
    plan_result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == 'Free'))
    free_plan = plan_result.scalars().first()
    
    hashed_password = get_password_hash(dev_in.password)
    new_dev = DeveloperAccount(
        username=dev_in.username,
        email=dev_in.email,
        password_hash=hashed_password,
        is_verified=False,
        plan_id=free_plan.id if free_plan else None,
        subscription_tier='tester'
    )
    db.add(new_dev)
    await db.commit()
    await db.refresh(new_dev)
    
    # Send verification email
    otp = OTPService.generate_otp()
    OTPService.store_otp(dev_in.email, otp, "verification")
    EmailService.send_verification_code(dev_in.email, otp)
    
    return new_dev

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_developer(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Check turnstile token from form data
    form_dict = await request.form()
    turnstile_token = form_dict.get("turnstile_token")
    if not await verify_turnstile(turnstile_token, request.client.host if request.client else None):
        raise HTTPException(status_code=400, detail="Bot protection verification failed")

    # Check for both username and email
    result = await db.execute(
        select(DeveloperAccount).where(
            (DeveloperAccount.username == form_data.username) | 
            (DeveloperAccount.email == form_data.username)
        )
    )
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )
        
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned. Please contact support.",
        )
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login", response_model=Token)
@limiter.limit("10/minute")
async def google_login(request: Request, google_data: DeveloperGoogleLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == google_data.email))
    user = result.scalars().first()
    
    if user:
        if not user.google_id:
            user.google_id = google_data.google_id
        if not user.avatar_url and google_data.avatar_url:
            user.avatar_url = google_data.avatar_url
            
        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been banned. Please contact support.",
            )
            
        await db.commit()
        await db.refresh(user)
    else:
        random_password = str(uuid.uuid4())
        hashed_password = get_password_hash(random_password)
        base_username = google_data.email.split('@')[0]
        
        # Ensure unique username
        username_result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.username == base_username))
        if username_result.scalars().first():
            base_username = f"{base_username}_{str(uuid.uuid4())[:6]}"
            
        # Assign default Free plan for new Google users
        plan_result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == 'Free'))
        free_plan = plan_result.scalars().first()
        
        user = DeveloperAccount(
            username=base_username,
            email=google_data.email,
            password_hash=hashed_password,
            google_id=google_data.google_id,
            avatar_url=google_data.avatar_url,
            is_verified=True,
            plan_id=free_plan.id if free_plan else None,
            subscription_tier='tester'
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify-email")
async def verify_email(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    if OTPService.verify_otp(data.email, data.code, "verification"):
        result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == data.email))
        user = result.scalars().first()
        if user:
            user.is_verified = True
            await db.commit()
            return {"success": True, "message": "Email verified successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid or expired verification code")

@router.post("/resend-verification")
async def resend_verification(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == data.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"success": True, "message": "Email is already verified"}
    
    otp = OTPService.generate_otp()
    OTPService.store_otp(data.email, otp, "verification")
    EmailService.send_verification_code(data.email, otp)
    return {"success": True, "message": "Verification code sent"}

@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == data.email))
    user = result.scalars().first()
    if not user:
        # Don't reveal if user exists for security, but in this case we can for simplicity
        raise HTTPException(status_code=404, detail="Email not registered")
    
    otp = OTPService.generate_otp()
    OTPService.store_otp(data.email, otp, "password_reset")
    EmailService.send_password_reset_code(data.email, otp)
    return {"success": True, "message": "Password reset code sent"}

@router.post("/verify-otp")
async def verify_otp(data: OTPVerify):
    if OTPService.verify_otp(data.email, data.code, data.purpose):
        # Return a temporary token or just success
        return {"success": True, "message": "Code verified"}
    raise HTTPException(status_code=400, detail="Invalid or expired code")

@router.post("/reset-password")
async def reset_password(data: NewPassword, db: AsyncSession = Depends(get_db)):
    # In a real app, we should verify the code again or use a temporary token
    # For now, we'll verify it here
    if OTPService.verify_otp(data.email, data.code, "password_reset"):
        result = await db.execute(select(DeveloperAccount).where(DeveloperAccount.email == data.email))
        user = result.scalars().first()
        if user:
            user.password_hash = get_password_hash(data.new_password)
            await db.commit()
            return {"success": True, "message": "Password reset successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
@router.get("/me", response_model=DeveloperResponse)
async def get_me(dev: DeveloperAccount = Depends(get_current_developer)):
    return dev

@router.put("/me", response_model=DeveloperResponse)
async def update_me(data: DeveloperUpdate, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    if data.username: dev.username = data.username
    if data.avatar_url: dev.avatar_url = data.avatar_url
    await db.commit()
    await db.refresh(dev)
    return dev

@router.post("/change-password")
async def change_password(data: ChangePassword, dev: DeveloperAccount = Depends(get_current_developer), db: AsyncSession = Depends(get_db)):
    if not verify_password(data.old_password, dev.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    dev.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated"}
