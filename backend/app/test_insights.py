import asyncio
import sys
import os
import json
from datetime import datetime, timedelta, timezone

# Adjust path to import app correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, desc, delete
from app.db.session import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.biometric import BaselineMetrics, BiometricSnapshot
from app.models.stress import StressHistory
from app.models.insights import AIInsight
from app.models.coach import CoachRecommendation
from app.services.insights_service import AIInsightsService


async def test_insights():
    print("=== INITIALIZING TEST DATABASE ===")
    await init_db()

    print("\n=== GENERATING DB SESSION ===")
    async with AsyncSessionLocal() as db:
        insights_service = AIInsightsService()

        # 1. Setup Test User
        print("\n=== SETTING UP TEST USER ===")
        test_email = "insight_tester@cognitoshield.ai"
        
        # Helper cleanup function
        async def cleanup_user_data(uid: int):
            await db.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == uid))
            await db.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == uid))
            await db.execute(delete(StressHistory).where(StressHistory.user_id == uid))
            await db.execute(delete(AIInsight).where(AIInsight.user_id == uid))
            await db.execute(delete(CoachRecommendation).where(CoachRecommendation.user_id == uid))
            await db.commit()

        # Cleanup previous test runs if any
        from app.repositories.user_repo import UserRepository
        user_repo = UserRepository(db)
        existing = await user_repo.get_by_email(test_email)
        if existing:
            print("Cleaning up old test user and relations...")
            await cleanup_user_data(existing.id)
            await db.delete(existing)
            await db.commit()

        # Create user
        user = User(
            username=test_email,
            email=test_email,
            hashed_password="hashed_placeholder_pwd",
            role="user",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        user_id = user.id
        print(f"SUCCESS: Created test user ID={user_id}")

        # 2. Setup Baseline
        print("\n=== CREATING TEST BASELINE METRICS ===")
        baseline = BaselineMetrics(
            user_id=user_id,
            avg_typing_speed_wpm=60.0,
            avg_heart_rate_bpm=70.0,
            avg_hrv_ms=50.0,
            avg_facial_fatigue_score=0.15,
            avg_ambient_noise_db=45.0,
            avg_error_burst_per_min=0.3,
        )
        db.add(baseline)
        await db.commit()
        print("SUCCESS: Base metrics saved.")

        # 3. Insert mock biometric snapshots and stress history (high stress indicators)
        print("\n=== POPULATING SIMULATED HIGH STRESS TELEMETRY ===")
        now = datetime.now(timezone.utc)
        
        # We will insert 5 snapshots within the last 12 hours
        # Stressful indicators: high HR (85), low HRV (35), high noise (65), fatigue (0.4)
        for i in range(5):
            time_offset = now - timedelta(hours=i * 2)
            snap = BiometricSnapshot(
                user_id=user_id,
                captured_at=time_offset,
                typing_speed_wpm=55.0,
                heart_rate_bpm=85.0,
                hrv_ms=35.0,
                facial_fatigue_score=0.4,
                ambient_noise_db=65.0,
                luminance_pct=50.0,
                error_burst_per_min=0.8,
            )
            db.add(snap)
            
            # Add matching high stress level records
            history = StressHistory(
                user_id=user_id,
                recorded_at=time_offset,
                stress_level=75.0,
                burnout_risk_pct=86.25,
                focus_reserves_pct=25.0,
                risk_tier="high",
            )
            db.add(history)

        await db.commit()
        print("SUCCESS: Mock stressful telemetry populated.")

        # 4. Generate Timeframe Insight (daily)
        print("\n=== RUNNING INSIGHTS GENERATOR (DAILY) ===")
        insight = await insights_service.generate_timeframe_insight(db, user_id, "daily")
        
        print("\n=== VERIFYING GENERATED INSIGHT ===")
        print(f"Insight ID: {insight.id}")
        print(f"Timeframe: {insight.timeframe}")
        print(f"Risk Direction: {insight.risk_direction}")
        print(f"Risk Delta: {insight.risk_delta}")
        print(f"Confidence Score: {insight.confidence_score}")
        print(f"Top Activities: {insight.top_activities_json}")
        print(f"Contributions JSON: {insight.feature_contributions_json}")
        print(f"Summary Text Markdown Preview:\n{insight.summary_text[:300]}...")

        # Assertions
        assert insight.timeframe == "daily"
        assert insight.risk_direction == "degraded"  # 75 avg stress vs 40.0 baseline default
        assert insight.risk_delta == 35.0
        
        # Verify SHAP Contributions
        contributions = json.loads(insight.feature_contributions_json)
        assert contributions["heart_rate"] > 0  # HR is 85 vs baseline 70
        assert contributions["hrv"] > 0         # HRV is 35 vs baseline 50 (lower HRV = higher stress contribution)
        assert contributions["ambient_noise"] > 0 # Noise is 65 vs baseline 45
        print("SUCCESS: Explainable AI SHAP assertions passed.")

        # Verify Coach Recommendation
        print("\n=== VERIFYING AUTOMATIC COACH RECOMMENDATION ===")
        coach_rec_res = await db.execute(
            select(CoachRecommendation)
            .where(CoachRecommendation.user_id == user_id)
            .order_by(desc(CoachRecommendation.created_at))
            .limit(1)
        )
        coach_rec = coach_rec_res.scalar_one_or_none()
        assert coach_rec is not None
        print(f"Coach Recommendation Category: {coach_rec.category}")
        print(f"Coach Recommendation Message: {coach_rec.message_text}")
        print(f"Coach Recommendation Trigger Metric: {coach_rec.trigger_metric_name} (value={coach_rec.trigger_value})")
        assert coach_rec.is_completed is False
        print("SUCCESS: Coach recommendation assertions passed.")

        # 5. Clean up test user to leave DB clean
        print("\n=== TEARDOWN / CLEANING UP TEST DATA ===")
        await cleanup_user_data(user_id)
        await db.delete(user)
        await db.commit()
        print("SUCCESS: Database cleanup completed.")

    print("\n=== ALL AI INSIGHTS TESTS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    asyncio.run(test_insights())
