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

        token = security.create_access_token(subject=user.username, role=user.role)
        return Token(access_token=token, token_type="bearer", role=user.role)

    async def guest_login(self) -> Token:
        token = security.create_guest_token()
        return Token(access_token=token, token_type="bearer", role="guest")
