from __future__ import annotations
from typing import Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security as sec
from app.core.exceptions import CredentialsException, ForbiddenException, GuestForbiddenException
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None:
        raise CredentialsException()
    try:
        payload = sec.decode_token(token)
        username: Optional[str] = payload.get("sub")
        role: str = payload.get("role", "user")
    except JWTError:
        raise CredentialsException()

    if not username:
        raise CredentialsException()

    if role == "guest" or username == "guest":
        return User(id=0, username="guest", role="guest", is_active=True, is_guest=True)

    repo = UserRepository(db)
    user = await repo.get_by_username(username)
    if not user or not user.is_active:
        raise CredentialsException()
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active and not current_user.is_guest:
        raise CredentialsException("Account is disabled")
    return current_user


async def require_registered_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.is_guest or current_user.role == "guest":
        raise GuestForbiddenException()
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise ForbiddenException("Admin access required")
    return current_user
