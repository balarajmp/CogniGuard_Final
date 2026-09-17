import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select
from sqlalchemy import delete

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, engine, AsyncSession
from app.models.user import User
from app.models.biometric import BiometricSnapshot
from app.models.stress import StressHistory
from app.models.intervention import Intervention
from app.main import app
from app.services.effectiveness_service import EffectivenessService
from app.schemas.intervention import EffectivenessResult
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_effectiveness_improved_state():
    """Verify that a drop in stress and recovery in typing speed evaluates to IMPROVED."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        # Create user
        user = User(
            username="eff_improved_user",
            email="eff_improved@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Pre-intervention data: High stress, low typing speed, high error burst
        trig_time = now - timedelta(minutes=10)
        ack_time = now - timedelta(minutes=5)

        session.add(StressHistory(
            user_id=user.id,
            stress_level=68.0,
            burnout_risk_pct=72.0,
            focus_reserves_pct=30.0,
            risk_tier="high",
            recorded_at=trig_time - timedelta(minutes=2),
        ))
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=40.0,
            error_burst_per_min=2.8,
            backspace_freq=18.0,
            captured_at=trig_time - timedelta(minutes=2),
        ))

        # Completed Intervention
        intervention = Intervention(
            user_id=user.id,
            intervention_type="breathing",
            message="Box breathing session.",
            stress_level_at_trigger=68.0,
            risk_tier_at_trigger="high",
            triggered_at=trig_time,
            was_acknowledged=True,
            acknowledged_at=ack_time,
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        # Post-intervention data (2 valid snapshots): Stress lowered to 42-44, typing recovered to 56-58
        session.add(StressHistory(
            user_id=user.id,
            stress_level=44.0,
            burnout_risk_pct=50.0,
            focus_reserves_pct=53.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=1),
        ))
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=56.0,
            error_burst_per_min=0.5,
            backspace_freq=7.0,
            captured_at=ack_time + timedelta(minutes=1),
        ))
        session.add(StressHistory(
            user_id=user.id,
            stress_level=42.0,
            burnout_risk_pct=48.0,
            focus_reserves_pct=55.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=2),
        ))
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=58.0,
            error_burst_per_min=0.4,
            backspace_freq=6.0,
            captured_at=ack_time + timedelta(minutes=2),
        ))
        await session.commit()

        # Evaluate effectiveness
        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=0)

        assert eff.has_sufficient_data
        assert eff.result == EffectivenessResult.IMPROVED.value
        assert eff.score is not None and eff.score > 60.0
        assert "stress_level" in eff.metrics
        assert eff.metrics["stress_level"].improved is True
        assert eff.metrics["stress_level"].delta_pct is not None and eff.metrics["stress_level"].delta_pct < 0
        assert "typing_speed" in eff.metrics
        assert eff.metrics["typing_speed"].improved is True
        assert "relative to pre-intervention baseline" in eff.summary

        # Clean up
        await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user.id))
        await session.execute(delete(StressHistory).where(StressHistory.user_id == user.id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_effectiveness_stable_state():
    """Verify that minor fluctuations evaluate to STABLE."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_stable_user",
            email="eff_stable@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        trig_time = now - timedelta(minutes=8)
        ack_time = now - timedelta(minutes=4)

        session.add(StressHistory(
            user_id=user.id,
            stress_level=48.0,
            burnout_risk_pct=50.0,
            focus_reserves_pct=52.0,
            risk_tier="moderate",
            recorded_at=trig_time,
        ))

        intervention = Intervention(
            user_id=user.id,
            intervention_type="hydration",
            message="Hydration pause.",
            stress_level_at_trigger=48.0,
            risk_tier_at_trigger="moderate",
            triggered_at=trig_time,
            was_acknowledged=True,
            acknowledged_at=ack_time,
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        # Post data with 2 snapshots of almost identical stress
        session.add(StressHistory(
            user_id=user.id,
            stress_level=47.5,
            burnout_risk_pct=49.5,
            focus_reserves_pct=53.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=1),
        ))
        session.add(StressHistory(
            user_id=user.id,
            stress_level=47.8,
            burnout_risk_pct=49.8,
            focus_reserves_pct=52.5,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=2),
        ))
        await session.commit()

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=0)

        assert eff.has_sufficient_data
        assert eff.result == EffectivenessResult.STABLE.value

        # Clean up
        await session.execute(delete(StressHistory).where(StressHistory.user_id == user.id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_effectiveness_insufficient_post_data():
    """Verify that an acknowledged intervention without post-telemetry reports INSUFFICIENT_DATA."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_nodata_user",
            email="eff_nodata@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Acknowledged intervention with NO post-intervention telemetry
        intervention = Intervention(
            user_id=user.id,
            intervention_type="micro_break",
            message="Micro-break session.",
            stress_level_at_trigger=55.0,
            risk_tier_at_trigger="moderate",
            triggered_at=now - timedelta(minutes=5),
            was_acknowledged=True,
            acknowledged_at=now - timedelta(seconds=10),
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=60)

        assert not eff.has_sufficient_data
        assert eff.result == EffectivenessResult.INSUFFICIENT_DATA.value
        assert "observation in progress" in eff.summary.lower()

        # Clean up
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_effectiveness_unacknowledged_intervention():
    """Verify that an unacknowledged or dismissed intervention returns INSUFFICIENT_DATA."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_unack_user",
            email="eff_unack@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Unacknowledged intervention (dismissed)
        intervention = Intervention(
            user_id=user.id,
            intervention_type="walk",
            message="Walk session.",
            stress_level_at_trigger=85.0,
            risk_tier_at_trigger="critical",
            triggered_at=now - timedelta(minutes=10),
            was_acknowledged=False,
            was_dismissed=True,
            dismissed_at=now - timedelta(minutes=8),
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id)

        assert not eff.has_sufficient_data
        assert eff.result == EffectivenessResult.INSUFFICIENT_DATA.value
        assert "not completed" in eff.summary.lower()

        # Clean up
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_effectiveness_api_endpoints():
    """Test HTTP API endpoints for /latest-effectiveness and /{id}/effectiveness."""
    await init_db()
    now = datetime.now(timezone.utc)
    test_email = "eff_api@cognishield.ai"

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_api_user",
            email=test_email,
            hashed_password=get_password_hash("testpass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

        # Add pre & post stress
        session.add(StressHistory(
            user_id=user_id,
            stress_level=65.0,
            burnout_risk_pct=70.0,
            focus_reserves_pct=35.0,
            risk_tier="high",
            recorded_at=now - timedelta(minutes=10),
        ))

        intervention = Intervention(
            user_id=user_id,
            intervention_type="breathing",
            message="Guided respiration.",
            stress_level_at_trigger=65.0,
            risk_tier_at_trigger="high",
            triggered_at=now - timedelta(minutes=10),
            was_acknowledged=True,
            acknowledged_at=now - timedelta(minutes=5),
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)
        interv_id = intervention.id

        session.add(StressHistory(
            user_id=user_id,
            stress_level=45.0,
            burnout_risk_pct=50.0,
            focus_reserves_pct=55.0,
            risk_tier="moderate",
            recorded_at=now - timedelta(minutes=2),
        ))
        session.add(StressHistory(
            user_id=user_id,
            stress_level=44.0,
            burnout_risk_pct=49.0,
            focus_reserves_pct=56.0,
            risk_tier="moderate",
            recorded_at=now - timedelta(minutes=1),
        ))
        await session.commit()

    # Call API via AsyncClient
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        login_res = await client.post("/api/auth/login", data={
            "username": "eff_api_user",
            "password": "testpass123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. GET /api/interventions/{id}/effectiveness
        res_id = await client.get(f"/api/interventions/{interv_id}/effectiveness", headers=headers)
        assert res_id.status_code == 200
        data_id = res_id.json()
        assert data_id["intervention_id"] == interv_id
        assert data_id["result"] == "IMPROVED"
        assert data_id["has_sufficient_data"] is True
        assert "stress_level" in data_id["metrics"]

        # 2. GET /api/interventions/latest-effectiveness
        res_latest = await client.get("/api/interventions/latest-effectiveness", headers=headers)
        assert res_latest.status_code == 200
        data_latest = res_latest.json()
        assert data_latest is not None
        assert data_latest["intervention_id"] == interv_id
        assert data_latest["result"] == "IMPROVED"

    # Cleanup
    async with AsyncSession(engine, expire_on_commit=False) as session:
        await session.execute(delete(StressHistory).where(StressHistory.user_id == user_id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user_id))
        res = await session.execute(select(User).where(User.id == user_id))
        u = res.scalar_one_or_none()
        if u:
            await session.delete(u)
            await session.commit()


# ==============================================================================
# AUDIT FIX TESTS: P2, P3, P5
# ==============================================================================

@pytest.mark.asyncio
async def test_aborted_intervention_does_not_produce_effectiveness():
    """P2: An aborted intervention must return INSUFFICIENT_DATA and not produce false recovery."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_abort_user",
            email="eff_abort@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        intervention = Intervention(
            user_id=user.id,
            intervention_type="breathing",
            message="Guided respiration.",
            stress_level_at_trigger=70.0,
            risk_tier_at_trigger="high",
            triggered_at=now - timedelta(minutes=5),
            was_acknowledged=False,
            was_dismissed=False,
            was_aborted=True,
            aborted_at=now - timedelta(minutes=3),
            abort_reason="Exited early by user",
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id)

        assert eff.has_sufficient_data is False
        assert eff.result == EffectivenessResult.INSUFFICIENT_DATA.value
        assert eff.score is None
        assert "aborted" in eff.summary.lower()

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_one_post_snapshot_returns_insufficient_data():
    """P3: Exactly 1 post-intervention snapshot must return INSUFFICIENT_DATA."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_one_snap_user",
            email="eff_one_snap@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        trig_time = now - timedelta(minutes=10)
        ack_time = now - timedelta(minutes=5)

        intervention = Intervention(
            user_id=user.id,
            intervention_type="breathing",
            message="Take a break.",
            stress_level_at_trigger=65.0,
            risk_tier_at_trigger="high",
            triggered_at=trig_time,
            was_acknowledged=True,
            acknowledged_at=ack_time,
        )
        session.add(intervention)

        # Pre-intervention data
        session.add(StressHistory(
            user_id=user.id,
            stress_level=65.0,
            burnout_risk_pct=70.0,
            focus_reserves_pct=35.0,
            risk_tier="high",
            recorded_at=trig_time - timedelta(minutes=1),
        ))

        # ONLY 1 post-intervention snapshot
        session.add(StressHistory(
            user_id=user.id,
            stress_level=45.0,
            burnout_risk_pct=50.0,
            focus_reserves_pct=55.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=1),
        ))
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=0)

        assert eff.has_sufficient_data is False
        assert eff.result == EffectivenessResult.INSUFFICIENT_DATA.value
        assert "at least 2 valid" in eff.summary.lower()

        # Cleanup
        await session.execute(delete(StressHistory).where(StressHistory.user_id == user.id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_two_valid_post_snapshots_allows_effectiveness():
    """P3: Exactly 2 valid post-intervention snapshots satisfies the minimum observation count."""
    await init_db()
    now = datetime.now(timezone.utc)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_two_snap_user",
            email="eff_two_snap@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        trig_time = now - timedelta(minutes=10)
        ack_time = now - timedelta(minutes=5)

        intervention = Intervention(
            user_id=user.id,
            intervention_type="breathing",
            message="Take a break.",
            stress_level_at_trigger=65.0,
            risk_tier_at_trigger="high",
            triggered_at=trig_time,
            was_acknowledged=True,
            acknowledged_at=ack_time,
        )
        session.add(intervention)

        # Pre-intervention data
        session.add(StressHistory(
            user_id=user.id,
            stress_level=65.0,
            burnout_risk_pct=70.0,
            focus_reserves_pct=35.0,
            risk_tier="high",
            recorded_at=trig_time - timedelta(minutes=1),
        ))

        # TWO post-intervention snapshots
        session.add(StressHistory(
            user_id=user.id,
            stress_level=46.0,
            burnout_risk_pct=52.0,
            focus_reserves_pct=54.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=1),
        ))
        session.add(StressHistory(
            user_id=user.id,
            stress_level=44.0,
            burnout_risk_pct=49.0,
            focus_reserves_pct=56.0,
            risk_tier="moderate",
            recorded_at=ack_time + timedelta(minutes=2),
        ))
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=0)

        assert eff.has_sufficient_data is True
        assert eff.result == EffectivenessResult.IMPROVED.value

        # Cleanup
        await session.execute(delete(StressHistory).where(StressHistory.user_id == user.id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_small_wpm_fluctuation_does_not_produce_false_improvement():
    """P5: Small typing fluctuation (+2 WPM) against a 60 WPM baseline does not produce false improvement."""
    await init_db()
    now = datetime.now(timezone.utc)
    from app.models.biometric import BaselineMetrics

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="eff_wpm_noise_user",
            email="eff_wpm_noise@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Baseline: 60 WPM (10% threshold = 6.0 WPM)
        session.add(BaselineMetrics(
            user_id=user.id,
            avg_typing_speed_wpm=60.0,
        ))

        trig_time = now - timedelta(minutes=10)
        ack_time = now - timedelta(minutes=5)

        intervention = Intervention(
            user_id=user.id,
            intervention_type="micro_break",
            message="Micro break.",
            stress_level_at_trigger=50.0,
            risk_tier_at_trigger="moderate",
            triggered_at=trig_time,
            was_acknowledged=True,
            acknowledged_at=ack_time,
        )
        session.add(intervention)

        # Pre-intervention: 50.0 WPM
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=50.0,
            captured_at=trig_time - timedelta(minutes=1),
        ))

        # Post-intervention: 52.0 WPM (+2.0 WPM, below the 6.0 WPM / 10% threshold)
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=51.8,
            captured_at=ack_time + timedelta(minutes=1),
        ))
        session.add(BiometricSnapshot(
            user_id=user.id,
            typing_speed_wpm=52.2,
            captured_at=ack_time + timedelta(minutes=2),
        ))
        await session.commit()
        await session.refresh(intervention)

        svc = EffectivenessService(session)
        eff = await svc.calculate_effectiveness(intervention.id, user.id, min_observation_seconds=0)

        assert eff.has_sufficient_data is True
        assert "typing_speed" in eff.metrics
        # +2.0 WPM must NOT be classified as improved
        assert eff.metrics["typing_speed"].improved is False
        assert eff.result == EffectivenessResult.STABLE.value

        # Cleanup
        await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user.id))
        await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user.id))
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()

