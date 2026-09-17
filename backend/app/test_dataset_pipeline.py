"""
test_dataset_pipeline.py – Integration tests for Phase 7.1 Dataset Pipeline endpoints.
Enhanced to cover multi-target prediction configs, manifests, version metadata, and physical split exports.
"""
from __future__ import annotations

import sys
import os
import asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, engine, AsyncSession
from app.models.user import User
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.main import app

async def test_dataset_preparation_pipeline():
    print("=== INITIALIZING DATASET PREPARATION PIPELINE TEST ===")
    await init_db()

    async with AsyncSession(engine) as session:
        # Cleanup any existing test user
        result = await session.execute(select(User).where(User.email == "ml_pipeline_test@cognishield.ai"))
        old_user = result.scalar_one_or_none()
        if old_user:
            from sqlalchemy import delete
            await session.execute(delete(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == old_user.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == old_user.id))
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == old_user.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == old_user.id))
            await session.delete(old_user)
            await session.commit()
            print("Cleaned up old pipeline test user.")

        # Create new test user
        from app.core.security import get_password_hash
        user = User(
            username="ml_pipeline_user",
            email="ml_pipeline_test@cognishield.ai",
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

        # Seed biometric snapshots
        now = datetime.now(timezone.utc)
        for i in range(10):
            snapshot_time = now - timedelta(minutes=10 - i)
            snap = BiometricSnapshot(
                user_id=test_user_id,
                captured_at=snapshot_time,
                typing_speed_wpm=60.0 + i * 2.0,
                typing_speed_variance=10.0 + i,
                typing_cadence_ms=300.0 - i * 5,
                inter_key_delay_var=400.0,
                key_hold_duration_avg=80.0,
                backspace_freq=1.0,
                error_burst_per_min=0.5,
                mouse_velocity=2.0 + i * 0.1,
                mouse_acceleration=0.01,
                mouse_clicks=3,
                double_clicks=1,
                right_clicks=0,
                scroll_distance=100.0,
                scroll_speed=2.0,
                scroll_acceleration=0.005,
                focus_blur_events=0,
                page_visibility_changes=0,
                idle_time_seconds=2.0,
                active_session_duration=28.0,
            )
            session.add(snap)

        # Seed some stress history
        for i in range(5):
            recorded_time = now - timedelta(minutes=9 - i * 2)
            sh = StressHistory(
                user_id=test_user_id,
                recorded_at=recorded_time,
                stress_level=3.5,
                burnout_risk_pct=40.0 + i * 5,
                focus_reserves_pct=80.0 - i * 4,
                risk_tier="Medium"
            )
            session.add(sh)

        # Seed user ground truth labels
        for i in range(3):
            label_time = now - timedelta(minutes=8 - i * 3)
            gt_label = UserGroundTruthLabel(
                user_id=test_user_id,
                timestamp=label_time,
                stress_level=3,
                fatigue_level=2,
                focus_level=4,
                notes=f"Test label {i}"
            )
            session.add(gt_label)

        await session.commit()
        print("Data seeded successfully.")

    # Call API endpoints via httpx Client
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get Auth Token
        login_res = await client.post(
            "/api/auth/login",
            data={"username": "ml_pipeline_user", "password": "testpass123"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token_data = login_res.json()
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # 1. GET /api/ml/dataset/stats with default target
        res = await client.get("/api/ml/dataset/stats", headers=headers)
        assert res.status_code == 200, res.text
        stats = res.json()
        print(f"Stats (default target) check passed: {stats}")
        assert stats["telemetry_records"] == 10
        assert stats["active_target"] == "stress_level"
        assert len(stats["class_distribution"]) > 0

        # 2. GET /api/ml/dataset/stats with custom target (cognitive_load_score)
        res = await client.get("/api/ml/dataset/stats?target=cognitive_load_score", headers=headers)
        assert res.status_code == 200, res.text
        stats_cog = res.json()
        print(f"Stats (cognitive_load_score) check passed: {stats_cog}")
        assert stats_cog["active_target"] == "cognitive_load_score"

        # 3. GET /api/ml/dataset/validate
        res = await client.get("/api/ml/dataset/validate?target=cognitive_load_score", headers=headers)
        assert res.status_code == 200, res.text
        validation = res.json()
        print(f"Validation check passed: {validation}")
        assert validation["total_rows"] == 10
        assert validation["target"] == "cognitive_load_score"

        # 4. GET /api/ml/dataset/features
        res = await client.get("/api/ml/dataset/features", headers=headers)
        assert res.status_code == 200, res.text
        features = res.json()
        print(f"Features catalogue check passed")
        assert len(features["input_features"]) > 0
        assert "cognitive_load_score" in features["available_targets"]

        # 5. GET /api/ml/dataset/manifest
        res = await client.get("/api/ml/dataset/manifest?target=cognitive_load_score", headers=headers)
        assert res.status_code == 200, res.text
        manifest = res.json()
        print(f"Feature Manifest check passed: {manifest['total_input_features']} features")
        assert manifest["target"] == "cognitive_load_score"
        assert len(manifest["input_features"]) > 0

        # 6. GET /api/ml/dataset/version
        res = await client.get("/api/ml/dataset/version?target=cognitive_load_score", headers=headers)
        assert res.status_code == 200, res.text
        version = res.json()
        print(f"Dataset Version check passed: {version['version_id']}")
        assert version["target"] == "cognitive_load_score"
        assert len(version["version_id"]) == 16

        # 7. GET /api/ml/dataset/quality-report
        res = await client.get("/api/ml/dataset/quality-report", headers=headers)
        assert res.status_code == 200, res.text
        quality = res.json()
        print(f"Quality report check passed: {quality}")
        assert "overall_score" in quality

        # 8. GET /api/ml/dataset/readiness
        res = await client.get("/api/ml/dataset/readiness", headers=headers)
        assert res.status_code == 200, res.text
        readiness = res.json()
        print(f"Readiness verdict check passed: {readiness}")
        assert readiness["verdict"] in ["READY", "PARTIAL", "NOT_READY"]

        # 9. POST /api/ml/dataset/split
        res = await client.post("/api/ml/dataset/split", headers=headers)
        assert res.status_code == 200, res.text
        split_info = res.json()
        print(f"Split info check passed: {split_info}")
        assert split_info["train_rows"] == 7

        # 10. POST /api/ml/dataset/export-splits
        res = await client.post("/api/ml/dataset/export-splits?target=cognitive_load_score", headers=headers)
        assert res.status_code == 200, res.text
        split_export = res.json()
        print(f"Split file exports on disk check passed: {split_export}")
        assert split_export["train_rows"] == 7
        assert os.path.exists(split_export["train_file"])
        assert os.path.exists(split_export["val_file"])
        assert os.path.exists(split_export["test_file"])
        assert os.path.exists(split_export["manifest_file"])

        # 11. GET /api/ml/dataset/export?fmt=csv
        res = await client.get("/api/ml/dataset/export?fmt=csv", headers=headers)
        assert res.status_code == 200, res.text
        csv_data = res.text
        print(f"Export CSV response (first 200 chars): {csv_data[:200]}")
        assert "typing_speed_wpm" in csv_data

    # Cleanup DB
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.email == "ml_pipeline_test@cognishield.ai"))
        user_to_delete = result.scalar_one_or_none()
        if user_to_delete:
            from sqlalchemy import delete
            await session.execute(delete(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == user_to_delete.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == user_to_delete.id))
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user_to_delete.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user_to_delete.id))
            await session.delete(user_to_delete)
            await session.commit()
            print("Cleaned up pipeline test user.")

    print("=== ALL DATASET PREPARATION PIPELINE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_dataset_preparation_pipeline())
