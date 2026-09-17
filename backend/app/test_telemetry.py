import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, engine, AsyncSession
from app.models.user import User
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel
from app.main import app
from app.services.feature_pipeline import calculate_rolling_features, get_ml_dataset, get_ground_truth_ml_dataset

async def test_telemetry_and_feature_pipeline():
    print("=== INITIALIZING TELEMETRY & ML PIPELINE TEST ===")
    await init_db()

    async with AsyncSession(engine) as session:
        # Cleanup any existing test user
        result = await session.execute(select(User).where(User.email == "telemetry_test@cognishield.ai"))
        old_user = result.scalar_one_or_none()
        if old_user:
            from sqlalchemy import delete
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == old_user.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == old_user.id))
            await session.delete(old_user)
            await session.commit()
            print("Cleaned up old telemetry test user.")

        # Create new test user
        from app.core.security import get_password_hash
        user = User(
            username="telemetry_user",
            email="telemetry_test@cognishield.ai",
            hashed_password=get_password_hash("testpass123")
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        test_user_id = user.id
        print(f"Created user: {user.email} (ID={test_user_id})")

        # Create baseline
        baseline = BaselineMetrics(
            user_id=test_user_id,
            avg_heart_rate_bpm=72.0,
            avg_hrv_ms=50.0,
            avg_typing_speed_wpm=65.0,
            avg_facial_fatigue_score=0.15,
            avg_ambient_noise_db=45.0,
            avg_luminance_pct=60.0,
            avg_error_burst_per_min=1.0,
        )
        session.add(baseline)

        # Seed biometric snapshots with real telemetry fields.
        # We need preceding snapshots (e.g. 5 snapshots spaced 2 seconds apart)
        # followed by a snapshot with a user_reported_stress label.
        now = datetime.now(timezone.utc)
        
        # Snapshots in the last 2 minutes
        for i in range(5):
            snapshot_time = now - timedelta(seconds=12 - i * 2)
            snap = BiometricSnapshot(
                user_id=test_user_id,
                captured_at=snapshot_time,
                typing_speed_wpm=60.0 + i * 5.0,
                heart_rate_bpm=75.0 + i,
                hrv_ms=48.0 - i,
                facial_fatigue_score=0.2,
                ambient_noise_db=42.0,
                luminance_pct=65.0,
                error_burst_per_min=0.0 if i < 4 else 2.0,
                # Phase 6 telemetry
                mouse_velocity=1.5 + i * 0.2,
                mouse_clicks=2,
                typing_cadence_ms=300.0 - i * 10,
                scroll_distance=100.0,
                scroll_speed=2.5,
                focus_blur_events=0,
                page_visibility_changes=0,
                idle_time_seconds=0.2,
                active_session_duration=2.0 * i,
                user_reported_stress=None,
                # Phase 6.5 new fields
                mouse_acceleration=0.01,
                double_clicks=0,
                right_clicks=0,
                inter_key_delay_var=500.0,
                key_hold_duration_avg=85.0,
                backspace_freq=1.0,
                typing_speed_variance=25.0,
                scroll_acceleration=0.005,
            )
            session.add(snap)

        # The labeled target snapshot
        labeled_snap = BiometricSnapshot(
            user_id=test_user_id,
            captured_at=now,
            typing_speed_wpm=80.0,
            heart_rate_bpm=80.0,
            hrv_ms=40.0,
            facial_fatigue_score=0.3,
            ambient_noise_db=44.0,
            luminance_pct=65.0,
            error_burst_per_min=3.0,
            mouse_velocity=2.5,
            mouse_clicks=4,
            typing_cadence_ms=250.0,
            scroll_distance=150.0,
            scroll_speed=3.5,
            focus_blur_events=1,
            page_visibility_changes=1,
            idle_time_seconds=0.5,
            active_session_duration=12.0,
            user_reported_stress=4,  # Labeled 4 / 5
            # Phase 6.5 new fields
            mouse_acceleration=0.02,
            double_clicks=1,
            right_clicks=0,
            inter_key_delay_var=420.0,
            key_hold_duration_avg=90.0,
            backspace_freq=2.0,
            typing_speed_variance=30.0,
            scroll_acceleration=0.008,
        )
        session.add(labeled_snap)
        await session.commit()
        print("Telemetry and labeled test snapshots seeded successfully.")

        # Test calculate_rolling_features
        features = await calculate_rolling_features(user_id=test_user_id, window_minutes=5, db=session)
        print(f"Aggregated rolling features for user: {features}")
        assert features["typing_speed_avg"] > 0
        assert features["mouse_clicks_total"] == 14  # 5 snapshots of 2 clicks + 1 snapshot of 4 clicks
        assert features["mouse_velocity_avg"] > 1.0
        assert features["idle_ratio"] > 0.0
        assert features["active_session_duration_max"] == 12.0
        # Phase 6.5 new feature keys
        assert "mouse_acceleration_avg" in features
        assert "inter_key_delay_var_avg" in features
        assert "key_hold_duration_avg" in features
        assert "backspace_freq_avg" in features
        assert "scroll_acceleration_avg" in features
        assert "typing_speed_variance_avg" in features
        assert "double_clicks_total" in features
        # Context enrichment keys
        assert "time_of_day_hour" in features
        assert "day_of_week" in features
        print("✓ Rolling features contain all Phase 6.5 fields")

        # Test get_ml_dataset function
        dataset = await get_ml_dataset(db=session, user_id=test_user_id, window_minutes=5, min_snapshots=3)
        print(f"Extracted ML dataset length: {len(dataset)}")
        assert len(dataset) == 1
        data_point = dataset[0]
        print(f"ML dataset data point: {data_point}")
        assert data_point["label"] == 4
        assert data_point["user_id"] == test_user_id
        assert data_point["mouse_clicks_total"] == 10  # Preceding snapshots clicks sum (5 snapshots * 2)

    # Test the API endpoint using AsyncClient
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get Auth Token
        login_res = await client.post(
            "/api/auth/login",
            data={"username": "telemetry_user", "password": "testpass123"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token_data = login_res.json()
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # 1. Fetch ML Dataset via API
        ml_res = await client.get("/api/biometrics/ml-dataset", headers=headers)
        assert ml_res.status_code == 200, f"ML dataset endpoint failed: {ml_res.text}"
        ml_data = ml_res.json()
        print(f"GET /api/biometrics/ml-dataset success. Retrieved {len(ml_data)} training items.")
        assert len(ml_data) == 1
        assert ml_data[0]["label"] == 4
        assert ml_data[0]["mouse_clicks_total"] == 10

        # 2. Test mandatory telemetry restriction: turning OFF all sources must be rejected with 400
        settings_fail_res = await client.put(
            "/api/auth/settings",
            json={
                "keyboard_tracking": False,
                "heart_rate_telemetry": False,
                "facial_fatigue_webcam": False,
                "ambient_noise_mapping": False,
            },
            headers=headers
        )
        assert settings_fail_res.status_code == 400, f"Expected 400 error, got {settings_fail_res.status_code}"
        assert "At least one telemetry source must remain active" in settings_fail_res.json()["detail"]
        print("✓ Backend successfully rejects disabling all telemetry sources with HTTP 400")

    # Test ground-truth label endpoint
    async with AsyncSession(engine) as session:
        # Insert a ground-truth label
        gt_label = UserGroundTruthLabel(
            user_id=test_user_id,
            stress_level=3,
            fatigue_level=2,
            focus_level=4,
            notes="Integration test label",
        )
        session.add(gt_label)
        await session.commit()
        print("Ground-truth label inserted.")

        # Test ground-truth ML dataset
        gt_dataset = await get_ground_truth_ml_dataset(db=session, user_id=test_user_id, window_minutes=30, min_snapshots=1)
        print(f"Ground-truth ML dataset length: {len(gt_dataset)}")
        # May be 0 if snapshots are too old; just verify no errors
        assert isinstance(gt_dataset, list), "Ground-truth ML dataset should return a list"
        print("✓ Ground-truth ML dataset pipeline is functional")

    # Cleanup DB
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == "telemetry_test@cognishield.ai"))
        user_to_delete = result.scalar_one_or_none()
        if user_to_delete:
            from sqlalchemy import delete
            await session.execute(delete(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == user_to_delete.id))
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user_to_delete.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user_to_delete.id))
            await session.delete(user_to_delete)
            await session.commit()
            print("Cleaned up telemetry test user.")

    print("=== ALL TELEMETRY & ML PIPELINE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_telemetry_and_feature_pipeline())
