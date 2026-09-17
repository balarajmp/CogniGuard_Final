from __future__ import annotations
import asyncio
import sys
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core import security

async def promote(username_or_email: str):
    async with AsyncSessionLocal() as db:
        # Find user by username or email
        res = await db.execute(
            select(User).where((User.username == username_or_email) | (User.email == username_or_email))
        )
        user = res.scalar_one_or_none()
        if not user:
            print(f"User '{username_or_email}' not found. Creating a new admin user...")
            # If not containing an email domain, append a default one
            email_val = username_or_email if "@" in username_or_email else f"{username_or_email}@example.com"
            user = User(
                username=username_or_email,
                email=email_val,
                hashed_password=security.get_password_hash("admin12345"),
                role="admin",
                is_active=True,
                is_guest=False
            )
            db.add(user)
            await db.commit()
            print(f"Admin user created successfully!")
            print(f"Username: {user.username}")
            print(f"Email:    {user.email}")
            print(f"Password: admin12345")
        else:
            user.role = "admin"
            await db.commit()
            print(f"User '{user.username}' has been successfully promoted to admin!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <username_or_email>")
        sys.exit(1)
    target = sys.argv[1]
    asyncio.run(promote(target))
