from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security
from app.core.exceptions import ConflictException, CredentialsException
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import Token, UserCreate


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def register(self, payload: UserCreate) -> User:
        existing = await self.repo.get_by_username(payload.username)
        if existing:
            raise ConflictException("Username already taken")
        if payload.email:
            existing_email = await self.repo.get_by_email(payload.email)
            if existing_email:
                raise ConflictException("Email already registered")

        user = User(
            username=payload.username,
            email=payload.email,
            hashed_password=security.get_password_hash(payload.password),
            role=payload.role,
            is_active=True,
            is_guest=False,
        )
        return await self.repo.create(user)

    async def authenticate(self, username: str, password: str) -> Token:
        user = await self.repo.get_by_username(username)
        if not user or not user.hashed_password:
            raise CredentialsException("Invalid username or password")
        if not security.verify_password(password, user.hashed_password):
            raise CredentialsException("Invalid username or password")
        if not user.is_active:
            raise CredentialsException("Account is disabled")

        access_token = security.create_access_token(subject=user.username, role=user.role)
        refresh_token = security.create_refresh_token(subject=user.username, role=user.role)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=user.role
        )

    async def guest_login(self) -> Token:
        access_token = security.create_guest_token()
        refresh_token = security.create_refresh_token(subject="guest", role="guest")
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role="guest"
        )

    async def refresh_session(self, refresh_token: str) -> Token:
        try:
            payload = security.decode_token(refresh_token)
            username: str | None = payload.get("sub")
            role: str = payload.get("role", "user")
            token_type: str = payload.get("type", "refresh")
            if not username or token_type != "refresh":
                raise CredentialsException("Invalid refresh token")
        except Exception:
            raise CredentialsException("Invalid refresh token")

        # For guest, bypass DB check
        if username == "guest" or role == "guest":
            new_access = security.create_guest_token()
            new_refresh = security.create_refresh_token(subject="guest", role="guest")
            return Token(
                access_token=new_access,
                refresh_token=new_refresh,
                token_type="bearer",
                role="guest"
            )

        user = await self.repo.get_by_username(username)
        if not user or not user.is_active:
            raise CredentialsException("User not found or disabled")

        new_access = security.create_access_token(subject=user.username, role=user.role)
        new_refresh = security.create_refresh_token(subject=user.username, role=user.role)
        return Token(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            role=user.role
        )

