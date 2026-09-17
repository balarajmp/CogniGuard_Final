import asyncio
import json
from httpx import AsyncClient, ASGITransport
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db, init_db, engine
from app.models.user import User
from app.models.biometric import BaselineMetrics, BiometricSnapshot
from app.models.stress import StressHistory
from app.models.coach import CoachRecommendation
from app.models.insights import AIInsight
from app.main import app

async def test_api_integration():
    print("=== INITIALIZING INTEGRATION TEST ===")
    await init_db()

    # Generate a temporary session to inject test data
    async with AsyncSession(engine) as session:
        # Clean up existing test user
        result = await session.execute(select(User).where(User.email == "integration@cognishield.ai"))
        old_user = result.scalar_one_or_none()
        if old_user:
            from sqlalchemy import delete
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == old_user.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == old_user.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == old_user.id))
            await session.execute(delete(CoachRecommendation).where(CoachRecommendation.user_id == old_user.id))
            await session.execute(delete(AIInsight).where(AIInsight.user_id == old_user.id))
            await session.delete(old_user)
            await session.commit()
            print("Cleaned up old integration user.")

        # Create user
        from app.core.security import get_password_hash
        user = User(
            username="integration_user",
            email="integration@cognishield.ai",
            hashed_password=get_password_hash("testpass123")
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Created integration user: {user.email} (ID={user.id})")

        # Create baseline
        baseline = BaselineMetrics(
            user_id=user.id,
            avg_heart_rate_bpm=72.0,
            avg_hrv_ms=50.0,
            avg_typing_speed_wpm=65.0,
            avg_facial_fatigue_score=0.15,
            avg_ambient_noise_db=38.0,
            avg_error_burst_per_min=0.4
        )
        session.add(baseline)

        # Create some stress history and telemetry
        stress = StressHistory(
            user_id=user.id,
            stress_level=80.0,
            burnout_risk_pct=75.0,
            focus_reserves_pct=40.0,
            risk_tier="high"
        )
        session.add(stress)

        snap = BiometricSnapshot(
            user_id=user.id,
            heart_rate_bpm=90.0,
            hrv_ms=30.0,
            typing_speed_wpm=45.0,
            facial_fatigue_score=0.4,
            ambient_noise_db=62.0,
            error_burst_per_min=1.2
        )
        session.add(snap)
        await session.commit()
        print("Mock data seeded.")

    # Execute HTTP queries against FastAPI test client
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Login to get token
        login_res = await client.post("/api/auth/login", data={
            "username": "integration_user",
            "password": "testpass123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        tokens = login_res.json()
        token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login success. JWT token retrieved.")

        # 2. Get daily insight (triggers generation)
        insight_res = await client.get("/api/insights/center?timeframe=daily", headers=headers)
        assert insight_res.status_code == 200, f"Insights fetch failed: {insight_res.text}"
        insight = insight_res.json()
        print(f"GET /api/v1/insights/center success:\n - Summary Preview: {insight['summary_text'][:120]}...\n - Risk Direction: {insight['risk_direction']}")
        assert insight["risk_direction"] == "degraded"
        assert insight["timeframe"] == "daily"

        # 3. Get recommendations
        recs_res = await client.get("/api/insights/recommendations", headers=headers)
        assert recs_res.status_code == 200, f"Recommendations fetch failed: {recs_res.text}"
        recs = recs_res.json()
        print(f"GET /api/v1/insights/recommendations success: {len(recs)} active recommendations.")
        assert len(recs) > 0
        target_rec_id = recs[0]["id"]

        # 4. Complete a recommendation
        complete_res = await client.post(f"/api/insights/recommendations/{target_rec_id}/complete", headers=headers)
        assert complete_res.status_code == 200, f"Complete recommendation failed: {complete_res.text}"
        print(f"POST /api/v1/insights/recommendations/{target_rec_id}/complete success: {complete_res.json()}")

    # Cleanup DB
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == "integration@cognishield.ai"))
        user_to_delete = result.scalar_one_or_none()
        if user_to_delete:
            from sqlalchemy import delete
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user_to_delete.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == user_to_delete.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user_to_delete.id))
            await session.execute(delete(CoachRecommendation).where(CoachRecommendation.user_id == user_to_delete.id))
            await session.execute(delete(AIInsight).where(AIInsight.user_id == user_to_delete.id))
            await session.delete(user_to_delete)
            await session.commit()
            print("Cleaned up integration test user.")

    print("=== ALL API INTEGRATION TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(test_api_integration())
