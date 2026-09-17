import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, engine, AsyncSession
from app.models.user import User
from app.models.biometric import BaselineMetrics
from app.models.stress import StressHistory
from app.main import app

async def test_analytics_endpoints():
    print("=== INITIALIZING ANALYTICS TEST ===")
    await init_db()

    # Create test data
    async with AsyncSession(engine) as session:
        # Cleanup
        result = await session.execute(select(User).where(User.email == "analytics_test@cognishield.ai"))
        old_user = result.scalar_one_or_none()
        if old_user:
            from sqlalchemy import delete
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == old_user.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == old_user.id))
            await session.delete(old_user)
            await session.commit()
            print("Cleaned up old analytics test user.")

        # Create user
        from app.core.security import get_password_hash
        user = User(
            username="analytics_user",
            email="analytics_test@cognishield.ai",
            hashed_password=get_password_hash("testpass123")
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Created user: {user.email} (ID={user.id})")

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

        # Create stress history records spread over a few days
        now = datetime.now(timezone.utc)
        records = [
            StressHistory(
                user_id=user.id,
                recorded_at=now - timedelta(days=2),
                stress_level=40.0,
                burnout_risk_pct=30.0,
                focus_reserves_pct=80.0,
                risk_tier="low"
            ),
            StressHistory(
                user_id=user.id,
                recorded_at=now - timedelta(days=1),
                stress_level=50.0,
                burnout_risk_pct=45.0,
                focus_reserves_pct=70.0,
                risk_tier="medium"
            ),
            StressHistory(
                user_id=user.id,
                recorded_at=now,
                stress_level=60.0,
                burnout_risk_pct=60.0,
                focus_reserves_pct=50.0,
                risk_tier="high"
            )
        ]
        session.add_all(records)
        await session.commit()
        print("Analytics test data seeded.")

    # Execute HTTP queries against FastAPI test client
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # Login to get token
        login_res = await client.post("/api/auth/login", data={
            "username": "analytics_user",
            "password": "testpass123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test GET /api/biometrics/history
        history_res = await client.get("/api/biometrics/history?limit=10", headers=headers)
        assert history_res.status_code == 200, f"History fetch failed: {history_res.text}"
        history_data = history_res.json()
        print(f"GET /api/biometrics/history success. Retrieved {len(history_data)} records.")
        assert len(history_data) == 3
        # Assert keys match StressHistoryResponse schema
        first_record = history_data[0]
        assert "stress_level" in first_record
        assert "burnout_risk_pct" in first_record
        assert "focus_reserves_pct" in first_record

        # 2. Test GET /api/biometrics/history/daily-averages
        averages_res = await client.get("/api/biometrics/history/daily-averages", headers=headers)
        assert averages_res.status_code == 200, f"Daily averages fetch failed: {averages_res.text}"
        averages_data = averages_res.json()
        print(f"GET /api/biometrics/history/daily-averages success. Retrieved {len(averages_data)} days.")
        assert len(averages_data) > 0
        first_avg = averages_data[0]
        assert "date" in first_avg
        assert "avg_stress_level" in first_avg
        assert "avg_burnout_risk_pct" in first_avg
        assert "avg_focus_reserves_pct" in first_avg

        # 3. Test GET /api/biometrics/forecast
        forecast_res = await client.get("/api/biometrics/forecast", headers=headers)
        assert forecast_res.status_code == 200, f"Forecast fetch failed: {forecast_res.text}"
        forecast_data = forecast_res.json()
        print(f"GET /api/biometrics/forecast success: {forecast_data}")
        assert "forecast_points" in forecast_data
        assert "estimated_depletion_hours" in forecast_data
        assert len(forecast_data["forecast_points"]) == 4

    # Cleanup DB
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == "analytics_test@cognishield.ai"))
        user_to_delete = result.scalar_one_or_none()
        if user_to_delete:
            from sqlalchemy import delete
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user_to_delete.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == user_to_delete.id))
            await session.delete(user_to_delete)
            await session.commit()
            print("Cleaned up analytics test user.")

    print("=== ALL ANALYTICS API TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_analytics_endpoints())
