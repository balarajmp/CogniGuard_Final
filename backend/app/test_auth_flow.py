import asyncio
import sys
import os

# Adjust path to import app correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, AsyncSessionLocal
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate
from app.core import security

async def test_flow():
    print("=== INITIALIZING TEST DATABASE ===")
    await init_db()
    
    print("\n=== GENERATING DB SESSION ===")
    async with AsyncSessionLocal() as db:
        service = AuthService(db)
        
        # Test User Registration
        print("\n=== TESTING REGISTER ===")
        username = "testuser_unique_99@cognitoshield.ai"
        email = "testuser_unique_99@cognitoshield.ai"
        password = "SecurePassword123!"
        
        # Check if already exists from previous runs and delete if so to keep test idempotent
        from app.repositories.user_repo import UserRepository
        repo = UserRepository(db)
        existing = await repo.get_by_username(username)
        if existing:
            print(f"User {username} already exists. Cleaning up first...")
            await db.delete(existing)
            await db.commit()
            
        payload = UserCreate(username=username, email=email, password=password, role="user")
        user = await service.register(payload)
        print(f"SUCCESS: Registered User ID={user.id}, Username={user.username}, Role={user.role}")
        
        # Test User Login Authenticate
        print("\n=== TESTING LOGIN ===")
        token = await service.authenticate(username, password)
        print(f"SUCCESS: Authenticated. Access Token: {token.access_token[:30]}...")
        print(f"SUCCESS: Authenticated. Refresh Token: {token.refresh_token[:30]}...")
        assert token.refresh_token is not None
        
        # Test JWT Decryption
        print("\n=== TESTING DECRYPTION ===")
        decoded = security.decode_token(token.access_token)
        print(f"SUCCESS: Decoded Token Sub={decoded.get('sub')}, Role={decoded.get('role')}")
        assert decoded.get("sub") == username
        
        # Test Token Refresh
        print("\n=== TESTING REFRESH SESSION ===")
        refreshed_token = await service.refresh_session(token.refresh_token)
        print(f"SUCCESS: Refreshed. New Access Token: {refreshed_token.access_token[:30]}...")
        decoded_new = security.decode_token(refreshed_token.access_token)
        assert decoded_new.get("sub") == username
        
        # Test Forgot Password
        print("\n=== TESTING FORGOT PASSWORD ===")
        from app.repositories.user_repo import UserRepository
        from app.core.exceptions import NotFoundException
        repo = UserRepository(db)
        # Test existing email
        user_by_email = await repo.get_by_email(email)
        assert user_by_email is not None
        print(f"SUCCESS: Email {email} found in database.")
        
        # Test non-existing email
        fake_email = "non_existent_user@cognitoshield.ai"
        user_fake = await repo.get_by_email(fake_email)
        assert user_fake is None
        print(f"SUCCESS: Non-existent email {fake_email} not found as expected.")
        
        # Test Guest Login
        print("\n=== TESTING GUEST ACCESS ===")
        guest_token = await service.guest_login()
        print(f"SUCCESS: Guest Token received: {guest_token.access_token[:30]}...")
        decoded_guest = security.decode_token(guest_token.access_token)
        print(f"SUCCESS: Decoded Guest Token Sub={decoded_guest.get('sub')}, Role={decoded_guest.get('role')}")
        assert decoded_guest.get("role") == "guest"
        
    print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_flow())
