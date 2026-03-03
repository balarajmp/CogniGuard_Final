from __future__ import annotations
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserResponse
from app.services.auth_service import AuthService

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
    """Login with username and password to receive a JWT token."""
    service = AuthService(db)
    return await service.authenticate(form_data.username, form_data.password)


@router.post("/guest", response_model=Token)
async def guest_login(
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Get a 1-hour guest session token (no registration required)."""
    service = AuthService(db)
    return await service.guest_login()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(require_registered_user),
) -> User:
    """Get the currently authenticated user's profile."""
    return current_user
