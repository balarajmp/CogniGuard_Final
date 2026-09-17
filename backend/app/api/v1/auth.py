from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_registered_user, get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserResponse, RefreshTokenRequest, ForgotPasswordRequest, UserSettingsUpdate, UserProfileUpdate
from app.services.auth_service import AuthService
from app.repositories.user_repo import UserRepository
from app.core.exceptions import NotFoundException

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Register a new user account."""
    service = AuthService(db)
    return await service.register(payload)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Login with username and password to receive access and refresh JWT tokens."""
    service = AuthService(db)
    return await service.authenticate(form_data.username, form_data.password)


@router.post("/guest", response_model=Token)
async def guest_login(
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Get a 1-hour guest session token (no registration required)."""
    service = AuthService(db)
    return await service.guest_login()


@router.post("/refresh", response_model=Token)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Refresh active session utilizing refresh token."""
    service = AuthService(db)
    return await service.refresh_session(payload.refresh_token)


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Simulate secure forgot-password token generation, checking if user email is registered."""
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)
    if not user:
        raise NotFoundException("User email")
    # In a real environment, send mail here. We print/log it securely on backend.
    print(f"[RECOVERY SYSTEM] Access code recovery generated for user: {user.username}")
    return {"status": "success", "message": f"Passcode recovery link dispatched successfully to {payload.email}."}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Get the currently authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(require_registered_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update user profile information."""
    repo = UserRepository(db)
    
    if profile_data.username is not None:
        # Check if username is already taken by another user
        existing_user = await repo.get_by_username(profile_data.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = profile_data.username
        
    if profile_data.email is not None:
        # Check if email is already taken by another user
        existing_email = await repo.get_by_email(profile_data.email)
        if existing_email and existing_email.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = profile_data.email
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/settings", response_model=UserResponse)
async def update_settings(
    settings_data: UserSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update user privacy and telemetry settings with mandatory active telemetry validation."""
    update_dict = settings_data.model_dump(exclude_unset=True)

    # Validate that at least one telemetry source remains active
    kb = update_dict.get("keyboard_tracking", current_user.keyboard_tracking)
    hr = update_dict.get("heart_rate_telemetry", current_user.heart_rate_telemetry)
    ff = update_dict.get("facial_fatigue_webcam", current_user.facial_fatigue_webcam)
    an = update_dict.get("ambient_noise_mapping", current_user.ambient_noise_mapping)

    if not any([kb, hr, ff, an]):
        raise HTTPException(
            status_code=400,
            detail="At least one telemetry source must remain active to monitor cognitive state."
        )

    if current_user.is_guest:
        # Just update in-memory/transient guest settings
        for key, value in update_dict.items():
            setattr(current_user, key, value)
        return current_user

    # For registered users, update db
    repo = UserRepository(db)
    updated_user = await repo.update(current_user, update_dict)
    return updated_user
