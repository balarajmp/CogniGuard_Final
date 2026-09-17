import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select
from sqlalchemy import delete

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, engine, AsyncSession
from app.models.user import User
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.models.intervention import Intervention
from app.main import app
from app.services.intervention_service import InterventionService
from app.schemas.intervention import InterventionSeverity, InterventionPriority
from app.schemas.stress import BurnoutRiskResult
from app.core.security import create_access_token


async def _cleanup_user(session, user_id: int):
    """Purge all records linked to user_id to prevent SQLite test pollution."""
    if not user_id:
        return
    await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user_id))
    await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user_id))
    await session.execute(delete(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == user_id))
    await session.execute(delete(StressHistory).where(StressHistory.user_id == user_id))
    await session.execute(delete(Intervention).where(Intervention.user_id == user_id))
    res = await session.execute(select(User).where(User.id == user_id))
    u = res.scalar_one_or_none()
    if u:
        await session.delete(u)
    await session.commit()


@pytest.mark.asyncio
async def test_decision_context_capture_and_feature_richness():
    """Verify decision-time state context is persisted as JSON with all relevant numerical features."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_user_{uid}",
                email=f"ml_user_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            now = datetime.now(timezone.utc)

            # Baseline
            session.add(
                BaselineMetrics(
                    user_id=user.id,
                    avg_typing_speed_wpm=68.0,
                    avg_error_burst_per_min=0.5,
                )
            )

            # Telemetry snapshot
            session.add(
                BiometricSnapshot(
                    user_id=user.id,
                    captured_at=now - timedelta(seconds=20),
                    typing_speed_wpm=42.0,
                    typing_cadence_ms=210.0,
                    error_burst_per_min=5.2,
                    backspace_freq=0.18,
                    typing_speed_variance=12.5,
                    mouse_velocity=75.0,
                    mouse_clicks=18,
                    scroll_speed=40.0,
                    focus_blur_events=4,
                    page_visibility_changes=3,
                    idle_time_seconds=15.0,
                    active_session_duration=2400.0,
                    heart_rate_bpm=82.0,
                    hrv_ms=45.0,
                )
            )

            # Stress history
            session.add(
                StressHistory(
                    user_id=user.id,
                    recorded_at=now - timedelta(seconds=15),
                    stress_level=78.5,
                    burnout_risk_pct=72.0,
                    focus_reserves_pct=35.0,
                    risk_tier="high",
                )
            )

            # Subjective ground truth
            session.add(
                UserGroundTruthLabel(
                    user_id=user.id,
                    timestamp=now - timedelta(seconds=10),
                    stress_level=4,
                    fatigue_level=4,
                    focus_level=2,
                )
            )
            await session.commit()

            svc = InterventionService(session)
            decision = await svc.evaluate_for_user(user)

            assert decision.intervention_needed is True
            assert decision.active_intervention_id is not None

            # Fetch stored intervention
            stmt = select(Intervention).where(Intervention.id == decision.active_intervention_id)
            res = await session.execute(stmt)
            record = res.scalar_one()

            # Decision context must exist and parse cleanly as JSON
            assert record.decision_context is not None
            context = json.loads(record.decision_context)

            # 1. Cognitive metrics
            assert context["current_stress"] == 78.5
            assert context["burnout_risk_pct"] == 72.0
            assert context["focus_reserves_pct"] == 35.0
            assert context["risk_tier"] in ("high", "critical")

            # 2. Typing & behavioral strain
            assert context["typing_speed_wpm"] == 42.0
            assert context["baseline_typing_speed_wpm"] == 68.0
            assert context["typing_cadence_ms"] == 210.0
            assert context["error_burst_per_min"] == 5.2
            assert context["backspace_freq"] == 0.18
            assert context["typing_speed_variance"] == 12.5

            # 3. Mouse & UI activity
            assert context["mouse_velocity"] == 75.0
            assert context["mouse_clicks"] == 18
            assert context["scroll_speed"] == 40.0

            # 4. Attention & session signals
            assert context["focus_blur_events"] == 4
            assert context["page_visibility_changes"] == 3
            assert context["idle_time_seconds"] == 15.0
            assert context["active_session_duration_secs"] == 2400.0

            # 5. Physiological telemetry
            assert context["heart_rate_bpm"] == 82.0
            assert context["hrv_ms"] == 45.0

            # 6. Interaction history
            assert "recent_dismissals_count" in context
            assert "recent_aborts_count" in context
            assert "recent_completions_count" in context
            assert "last_dismissed_modality" in context

            # 7. Ground truth labels
            assert context["subjective_fatigue"] == 4
            assert context["subjective_focus"] == 2
            assert context["subjective_stress"] == 4

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_action_fields_capture():
    """Verify action fields are preserved in intervention record and ML tuple."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_action_{uid}",
                email=f"ml_action_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            session.add(
                StressHistory(
                    user_id=user.id,
                    recorded_at=datetime.now(timezone.utc),
                    stress_level=85.0,
                    burnout_risk_pct=88.0,
                    focus_reserves_pct=20.0,
                    risk_tier="critical",
                )
            )
            await session.commit()

            svc = InterventionService(session)
            decision = await svc.evaluate_for_user(user)
            assert decision.intervention_needed is True

            # Fetch intervention and convert to ML tuple
            ml_tuple = await svc.get_intervention_ml_tuple(decision.active_intervention_id, user.id)
            assert ml_tuple is not None

            action = ml_tuple["action"]
            assert action["intervention_type"] == decision.intervention_type
            assert action["severity"] == decision.severity
            assert action["priority"] == decision.priority
            assert action["confidence"] == decision.confidence
            assert action["recommended_duration_mins"] == decision.recommended_duration_mins
            assert action["delivery_channel"] in ("POPUP_MODAL", "IN_APP_BANNER", "SYSTEM_NOTIFICATION", "IN_APP_MODAL")
            assert action["message"] == decision.message
            assert action["reason"] == decision.reason

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_completed_dismissed_aborted_states_distinguishable():
    """Verify completed, dismissed, aborted, and pending states remain distinctly classified."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_states_{uid}",
                email=f"ml_states_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            now = datetime.now(timezone.utc)

            # 1. Pending intervention
            i_pending = Intervention(
                user_id=user.id,
                intervention_type="breathing",
                message="Take a breath",
                stress_level_at_trigger=70.0,
                risk_tier_at_trigger="high",
                was_acknowledged=False,
                was_dismissed=False,
                was_aborted=False,
                decision_context=json.dumps({"current_stress": 70.0}),
            )

            # 2. Completed intervention
            i_completed = Intervention(
                user_id=user.id,
                intervention_type="focus_reset",
                message="Reset your focus",
                stress_level_at_trigger=75.0,
                risk_tier_at_trigger="high",
                was_acknowledged=True,
                acknowledged_at=now - timedelta(minutes=15),
                was_dismissed=False,
                was_aborted=False,
                decision_context=json.dumps({"current_stress": 75.0}),
            )

            # 3. Dismissed intervention
            i_dismissed = Intervention(
                user_id=user.id,
                intervention_type="hydration",
                message="Drink water",
                stress_level_at_trigger=50.0,
                risk_tier_at_trigger="moderate",
                was_acknowledged=False,
                was_dismissed=True,
                dismissed_at=now - timedelta(minutes=10),
                dismissal_reason="In a meeting",
                was_aborted=False,
                decision_context=json.dumps({"current_stress": 50.0}),
            )

            # 4. Aborted intervention
            i_aborted = Intervention(
                user_id=user.id,
                intervention_type="micro_break",
                message="Step away",
                stress_level_at_trigger=65.0,
                risk_tier_at_trigger="moderate",
                was_acknowledged=False,
                was_dismissed=False,
                was_aborted=True,
                aborted_at=now - timedelta(minutes=5),
                abort_reason="User exited recovery early",
                decision_context=json.dumps({"current_stress": 65.0}),
            )

            session.add_all([i_pending, i_completed, i_dismissed, i_aborted])
            await session.commit()
            await session.refresh(i_pending)
            await session.refresh(i_completed)
            await session.refresh(i_dismissed)
            await session.refresh(i_aborted)

            # Verify tuple classifications
            tuple_pending = i_pending.to_ml_tuple()
            tuple_completed = i_completed.to_ml_tuple()
            tuple_dismissed = i_dismissed.to_ml_tuple()
            tuple_aborted = i_aborted.to_ml_tuple()

            assert tuple_pending["user_response"] == "pending"
            assert tuple_pending["outcome"]["response_at"] is None

            assert tuple_completed["user_response"] == "completed"
            assert tuple_completed["outcome"]["response_at"] is not None

            assert tuple_dismissed["user_response"] == "dismissed"
            assert tuple_dismissed["outcome"]["response_at"] is not None
            assert tuple_dismissed["outcome"]["dismissal_reason"] == "In a meeting"

            assert tuple_aborted["user_response"] == "aborted"
            assert tuple_aborted["outcome"]["response_at"] is not None
            assert tuple_aborted["outcome"]["abort_reason"] == "User exited recovery early"

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_outcome_effectiveness_linkage():
    """Verify effectiveness evaluation results link directly to the intervention ML tuple."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_eff_{uid}",
                email=f"ml_eff_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            now = datetime.now(timezone.utc)

            eff_metrics_dict = {
                "stress": {
                    "before": 75.0,
                    "after": 52.0,
                    "delta_pct": -30.67,
                    "improved": True,
                },
                "typing_speed": {
                    "before": 45.0,
                    "after": 58.0,
                    "delta_pct": 28.89,
                    "improved": True,
                },
            }

            intervention = Intervention(
                user_id=user.id,
                intervention_type="breathing",
                message="Guided breathing",
                stress_level_at_trigger=75.0,
                risk_tier_at_trigger="high",
                was_acknowledged=True,
                acknowledged_at=now - timedelta(minutes=20),
                was_dismissed=False,
                was_aborted=False,
                effectiveness_result="IMPROVED",
                effectiveness_score=0.45,
                effectiveness_evaluated_at=now - timedelta(minutes=5),
                effectiveness_metrics=json.dumps(eff_metrics_dict),
                effectiveness_summary="Stress decreased by 30.7%. Typing speed improved by 28.9%.",
                decision_context=json.dumps({"current_stress": 75.0}),
            )
            session.add(intervention)
            await session.commit()
            await session.refresh(intervention)

            ml_tuple = intervention.to_ml_tuple()

            assert ml_tuple["user_response"] == "completed"
            outcome = ml_tuple["outcome"]
            assert outcome["effectiveness_result"] == "IMPROVED"
            assert outcome["effectiveness_score"] == 0.45
            assert outcome["effectiveness_evaluated_at"] is not None
            assert outcome["effectiveness_metrics"]["stress"]["improved"] is True
            assert outcome["effectiveness_metrics"]["typing_speed"]["delta_pct"] == 28.89
            assert "Stress decreased" in outcome["effectiveness_summary"]

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_missing_features_handled_safely():
    """Verify missing metrics remain explicit nulls without fabrication or exceptions."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_nulls_{uid}",
                email=f"ml_nulls_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            # Ensure zero snapshots, zero baselines exist for this user ID
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == user.id))
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == user.id))
            await session.execute(delete(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == user.id))

            # Only stress score provided, NO snapshots, NO ground truth labels, NO baseline
            session.add(
                StressHistory(
                    user_id=user.id,
                    recorded_at=datetime.now(timezone.utc),
                    stress_level=80.0,
                    burnout_risk_pct=75.0,
                    focus_reserves_pct=30.0,
                    risk_tier="critical",
                )
            )
            await session.commit()

            svc = InterventionService(session)
            decision = await svc.evaluate_for_user(user)
            assert decision.intervention_needed is True

            stmt = select(Intervention).where(Intervention.id == decision.active_intervention_id)
            res = await session.execute(stmt)
            record = res.scalar_one()

            context = json.loads(record.decision_context)

            # Missing features MUST be None/null, NOT fabricated
            assert context["heart_rate_bpm"] is None
            assert context["hrv_ms"] is None
            assert context["typing_speed_wpm"] is None
            assert context["baseline_typing_speed_wpm"] is None
            assert context["mouse_velocity"] is None
            assert context["error_burst_per_min"] is None
            assert context["subjective_fatigue"] is None
            assert context["subjective_focus"] is None
            assert context["subjective_stress"] is None
            assert context["last_dismissed_modality"] is None

            # Known features are present
            assert context["current_stress"] == 80.0
            assert context["burnout_risk_pct"] == 75.0
            assert context["focus_reserves_pct"] == 30.0

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_privacy_compliance_no_sensitive_payloads():
    """Ensure no raw keystrokes, text, URLs, clipboard data, or private strings are stored."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        try:
            user = User(
                username=f"ml_priv_{uid}",
                email=f"ml_priv_{uid}@test.com",
                hashed_password="hash",
                is_active=True,
                is_guest=False,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user_id = user.id

            session.add(
                StressHistory(
                    user_id=user.id,
                    recorded_at=datetime.now(timezone.utc),
                    stress_level=75.0,
                    burnout_risk_pct=70.0,
                    focus_reserves_pct=40.0,
                    risk_tier="high",
                )
            )
            await session.commit()

            svc = InterventionService(session)
            decision = await svc.evaluate_for_user(user)

            stmt = select(Intervention).where(Intervention.id == decision.active_intervention_id)
            res = await session.execute(stmt)
            record = res.scalar_one()

            context = json.loads(record.decision_context)
            raw_dump = json.dumps(context).lower()

            forbidden_keys = [
                "keystroke", "raw_text", "url", "clipboard", "screenshot",
                "key_log", "window_title", "password", "input_value", "email_content"
            ]

            for key in forbidden_keys:
                assert key not in context, f"Forbidden privacy key found in context: {key}"
                assert key not in raw_dump, f"Forbidden privacy substring in serialized context: {key}"

        finally:
            await _cleanup_user(session, user_id)


@pytest.mark.asyncio
async def test_ml_tuples_api_endpoints():
    """Verify GET /api/interventions/ml-tuples and GET /api/interventions/{id}/ml-tuple endpoints."""
    await init_db()
    uid = uuid.uuid4().hex[:8]
    user_id = None
    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username=f"ml_api_{uid}",
            email=f"ml_api_{uid}@test.com",
            hashed_password="hash",
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id
        user_username = user.username

        # Create intervention with decision context
        intervention = Intervention(
            user_id=user_id,
            intervention_type="breathing",
            message="Deep breath test",
            stress_level_at_trigger=72.0,
            risk_tier_at_trigger="high",
            severity="HIGH",
            priority="HIGH",
            confidence=0.9,
            recommended_duration_mins=3,
            delivery_channel="POPUP_MODAL",
            was_acknowledged=True,
            acknowledged_at=datetime.now(timezone.utc),
            was_dismissed=False,
            was_aborted=False,
            decision_context=json.dumps({"current_stress": 72.0, "risk_tier": "high"}),
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)
        intervention_id = intervention.id

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            token = create_access_token(subject=user_username)
            headers = {"Authorization": f"Bearer {token}"}

            # 1. Fetch list of ML tuples
            resp_list = await ac.get("/api/interventions/ml-tuples?limit=10", headers=headers)
            assert resp_list.status_code == 200
            tuples = resp_list.json()
            assert len(tuples) >= 1
            found = next((t for t in tuples if t["intervention_id"] == intervention_id), None)
            assert found is not None
            assert found["state"]["current_stress"] == 72.0
            assert found["action"]["intervention_type"] == "breathing"
            assert found["user_response"] == "completed"

            # 2. Fetch specific ML tuple
            resp_single = await ac.get(f"/api/interventions/{intervention_id}/ml-tuple", headers=headers)
            assert resp_single.status_code == 200
            single = resp_single.json()
            assert single["intervention_id"] == intervention_id
            assert single["state"]["risk_tier"] == "high"
            assert single["action"]["severity"] == "HIGH"
            assert single["user_response"] == "completed"

            # 3. Non-existent intervention returns 404
            resp_404 = await ac.get("/api/interventions/999999/ml-tuple", headers=headers)
            assert resp_404.status_code == 404

    finally:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            await _cleanup_user(session, user_id)
