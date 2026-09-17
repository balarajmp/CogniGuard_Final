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
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.models.intervention import Intervention
from app.main import app
from app.services.intervention_agent import (
    InterventionAgent,
    AgentThresholds,
    CooldownConfig,
)
from app.services.intervention_service import InterventionService
from app.schemas.intervention import (
    InterventionSeverity,
    InterventionPriority,
    InterventionDecision,
)


# ==============================================================================
# UNIT TESTS: Deterministic Rule-Based Intervention Agent
# ==============================================================================

def test_agent_normal_state_no_intervention():
    agent = InterventionAgent()
    decision = agent.evaluate(
        current_stress=25.0,
        burnout_risk_pct=28.0,
        focus_reserves_pct=75.0,
    )
    assert not decision.intervention_needed
    assert decision.severity == InterventionSeverity.NONE.value
    assert decision.intervention_type == "none"
    assert decision.recommended_duration_mins == 0
    assert len(decision.delivery_channels) == 0
    assert "normal" in decision.reason.lower()


def test_agent_elevated_state_gentle_intervention():
    agent = InterventionAgent()
    # Stress between 40 and 65
    decision = agent.evaluate(
        current_stress=45.0,
        burnout_risk_pct=52.0,
        focus_reserves_pct=55.0,
    )
    assert decision.intervention_needed
    assert decision.severity == InterventionSeverity.LOW.value
    assert decision.intervention_type in ("hydration", "breathing")
    assert decision.priority == InterventionPriority.MEDIUM.value
    assert decision.recommended_duration_mins in (2, 3)
    assert "IN_APP_BANNER" in decision.delivery_channels


def test_agent_elevated_session_fatigue():
    agent = InterventionAgent()
    snapshot = BiometricSnapshot(
        user_id=1,
        active_session_duration=4500.0,  # 1.25 hours continuous screen time
    )
    decision = agent.evaluate(
        current_stress=35.0,  # Low stress, but prolonged session
        burnout_risk_pct=40.0,
        focus_reserves_pct=65.0,
        snapshot=snapshot,
    )
    assert decision.intervention_needed
    # Phase D: prolonged continuous session triggers micro_break or hydration
    assert decision.intervention_type in ("micro_break", "hydration")
    assert "session" in decision.reason.lower()


def test_agent_typing_degradation_and_errors():
    agent = InterventionAgent()
    baseline = BaselineMetrics(
        user_id=1,
        avg_typing_speed_wpm=70.0,
    )
    snapshot = BiometricSnapshot(
        user_id=1,
        typing_speed_wpm=42.0,  # 40% below baseline (threshold is 25%)
        error_burst_per_min=3.0,  # > 2.0 threshold
    )
    decision = agent.evaluate(
        current_stress=58.0,
        burnout_risk_pct=66.0,
        focus_reserves_pct=42.0,
        snapshot=snapshot,
        baseline=baseline,
    )
    assert decision.intervention_needed
    assert decision.severity in (InterventionSeverity.HIGH.value, InterventionSeverity.MODERATE.value)
    # Phase D: typing cadence breakdown and error friction triggers cognitive_recovery
    assert decision.intervention_type in ("cognitive_recovery", "micro_break")
    assert "typing" in decision.reason.lower() or "cadence" in decision.reason.lower()


def test_agent_sustained_high_strain_trend():
    agent = InterventionAgent()
    now = datetime.now(timezone.utc)
    # 3 consecutive high stress snapshots (>= 60)
    history = [
        StressHistory(user_id=1, stress_level=68.0, burnout_risk_pct=78.0, focus_reserves_pct=32.0, risk_tier="high", recorded_at=now - timedelta(minutes=2)),
        StressHistory(user_id=1, stress_level=65.0, burnout_risk_pct=75.0, focus_reserves_pct=35.0, risk_tier="high", recorded_at=now - timedelta(minutes=4)),
        StressHistory(user_id=1, stress_level=62.0, burnout_risk_pct=71.0, focus_reserves_pct=38.0, risk_tier="high", recorded_at=now - timedelta(minutes=6)),
    ]
    decision = agent.evaluate(
        current_stress=66.0,
        burnout_risk_pct=76.0,
        focus_reserves_pct=34.0,
        recent_stress_history=history,
    )
    assert decision.intervention_needed
    assert decision.severity == InterventionSeverity.HIGH.value
    # Phase D: elevated acute stress + sustained strain triggers breathing or micro_break
    assert decision.intervention_type in ("breathing", "micro_break")
    assert "sustained" in decision.reason.lower()


# ==============================================================================
# PHASE D: ADAPTIVE INTELLIGENCE & HISTORY-AWARE TESTS
# ==============================================================================

def test_adaptive_focus_reset_on_attention_fragmentation():
    """Declining focus reserves + high window switching triggers focus_reset."""
    agent = InterventionAgent()
    snapshot = BiometricSnapshot(
        user_id=1,
        focus_blur_events=8,  # Rapid context switching (threshold is >= 6)
    )
    decision = agent.evaluate(
        current_stress=42.0,
        burnout_risk_pct=50.0,
        focus_reserves_pct=28.0,  # Depleted focus reserves (< 40%)
        snapshot=snapshot,
    )
    assert decision.intervention_needed
    assert decision.intervention_type == "focus_reset"
    assert decision.recommended_duration_mins == 3
    assert "focus" in decision.reason.lower()
    assert "fragmentation" in decision.reason.lower() or "focus shifts" in decision.reason.lower()


def test_adaptive_cadence_breakdown_recovery():
    """Typing speed drop + backspace rate triggers cognitive_recovery."""
    agent = InterventionAgent()
    baseline = BaselineMetrics(user_id=1, avg_typing_speed_wpm=65.0)
    snapshot = BiometricSnapshot(
        user_id=1,
        typing_speed_wpm=38.0,  # >40% drop
        backspace_freq=22.0,     # Elevated backspaces (> 15/min)
    )
    decision = agent.evaluate(
        current_stress=52.0,
        burnout_risk_pct=58.0,
        focus_reserves_pct=48.0,
        snapshot=snapshot,
        baseline=baseline,
    )
    assert decision.intervention_needed
    assert decision.intervention_type == "cognitive_recovery"
    assert decision.recommended_duration_mins == 5
    assert "typing cadence" in decision.reason.lower()


def test_adaptive_history_dismissal_pivots_modality():
    """Dismissed breathing intervention causes agent to pivot to alternative modality."""
    agent = InterventionAgent()
    now = datetime.now(timezone.utc)
    
    # User was previously shown breathing and dismissed it
    past_interventions = [
        Intervention(
            user_id=1,
            intervention_type="breathing",
            severity="MODERATE",
            was_acknowledged=False,
            was_dismissed=True,
            dismissed_at=now - timedelta(minutes=15),
        ),
    ]

    # Cognitive state with moderate stress where breathing would normally dominate
    decision = agent.evaluate(
        current_stress=48.0,
        burnout_risk_pct=54.0,
        focus_reserves_pct=52.0,
        recent_interventions=past_interventions,
    )
    assert decision.intervention_needed
    # Agent must NOT recommend breathing because it was recently dismissed!
    assert decision.intervention_type != "breathing"
    assert decision.intervention_type in ("hydration", "focus_reset", "micro_break")
    # Explainability must mention the adapted recommendation
    assert "dismissed" in decision.reason.lower() or "adapted" in decision.reason.lower()


def test_adaptive_critical_safety_override_ignores_dismissals():
    """Critical strain (>=85% stress) overrides all prior dismissals to mandate recovery."""
    agent = InterventionAgent()
    now = datetime.now(timezone.utc)
    
    # User previously dismissed walk
    past_interventions = [
        Intervention(
            user_id=1,
            intervention_type="walk",
            severity="CRITICAL",
            was_acknowledged=False,
            was_dismissed=True,
            dismissed_at=now - timedelta(minutes=5),
        ),
    ]

    # Cognitive state enters critical burnout strain (90% stress)
    decision = agent.evaluate(
        current_stress=90.0,
        burnout_risk_pct=98.0,
        focus_reserves_pct=8.0,
        recent_interventions=past_interventions,
    )
    assert decision.intervention_needed
    assert decision.severity == InterventionSeverity.CRITICAL.value
    # Must enforce walk despite past dismissal due to critical safety override
    assert decision.intervention_type == "walk"
    assert decision.priority == InterventionPriority.URGENT.value
    assert "critical" in decision.reason.lower()


def test_adaptive_subjective_ground_truth_shifts_scoring():
    """Ground truth self-report of low focus directs agent toward focus reset."""
    agent = InterventionAgent()
    gt = UserGroundTruthLabel(
        user_id=1,
        stress_level=3,
        fatigue_level=4,
        focus_level=1,  # Low self-reported focus
        notes="Struggling to stay on task",
    )
    decision = agent.evaluate(
        current_stress=46.0,
        burnout_risk_pct=52.0,
        focus_reserves_pct=42.0,
        latest_ground_truth=gt,
    )
    assert decision.intervention_needed
    assert decision.intervention_type in ("focus_reset", "cognitive_recovery", "hydration")
    assert decision.confidence >= 0.75  # Confidence boosted by ground truth existence


def test_agent_critical_state_strong_intervention():
    agent = InterventionAgent()
    decision = agent.evaluate(
        current_stress=88.5,  # >= 85.0 critical threshold
        burnout_risk_pct=95.0,
        focus_reserves_pct=11.5,
    )
    assert decision.intervention_needed
    assert decision.severity == InterventionSeverity.CRITICAL.value
    assert decision.intervention_type == "walk"
    assert decision.priority == InterventionPriority.URGENT.value
    assert decision.recommended_duration_mins >= 10
    assert "SYSTEM_NOTIFICATION" in decision.delivery_channels
    assert "IN_APP_MODAL" in decision.delivery_channels
    assert "critical" in decision.reason.lower()


def test_agent_missing_optional_metrics_graceful():
    agent = InterventionAgent()
    # Snapshot with all sensor metrics as None
    snapshot = BiometricSnapshot(
        user_id=1,
        heart_rate_bpm=None,
        hrv_ms=None,
        facial_fatigue_score=None,
        ambient_noise_db=None,
        mouse_velocity=0.65,
        mouse_acceleration=None,
        typing_speed_wpm=None,
    )
    decision = agent.evaluate(
        current_stress=30.0,
        burnout_risk_pct=35.0,
        focus_reserves_pct=70.0,
        snapshot=snapshot,
        baseline=None,
        recent_stress_history=None,
    )
    assert not decision.intervention_needed
    assert decision.confidence > 0.0
    assert decision.severity == InterventionSeverity.NONE.value


# ==============================================================================
# INTEGRATION TESTS: Cooldown, Deduplication, Persistence & API Endpoints
# ==============================================================================

@pytest.mark.asyncio
async def test_intervention_cooldown_deduplication_and_api():
    print("=== INITIALIZING INTERVENTION AGENT TEST ===")
    await init_db()

    test_email = "agent_test_user@cognishield.ai"

    # Step 1: Prepare test user
    async with AsyncSession(engine, expire_on_commit=False) as session:
        result = await session.execute(select(User).where(User.email == test_email))
        old_user = result.scalar_one_or_none()
        if old_user:
            await session.execute(delete(Intervention).where(Intervention.user_id == old_user.id))
            await session.execute(delete(StressHistory).where(StressHistory.user_id == old_user.id))
            await session.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == old_user.id))
            await session.execute(delete(BaselineMetrics).where(BaselineMetrics.user_id == old_user.id))
            await session.delete(old_user)
            await session.commit()

        from app.core.security import get_password_hash
        user = User(
            username="agent_test_user",
            email=test_email,
            hashed_password=get_password_hash("testpass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        user_id = user.id

    # Step 2: Test Service Evaluation directly
    async with AsyncSession(engine, expire_on_commit=False) as session:
        user_res = await session.execute(select(User).where(User.id == user_id))
        test_user = user_res.scalar_one()

        svc = InterventionService(session)

        # A. Normal state -> no intervention persisted
        decision_norm = await svc.evaluate_for_user(test_user)
        assert not decision_norm.intervention_needed
        assert not decision_norm.cooldown_active

        count_res = await session.execute(select(Intervention).where(Intervention.user_id == user_id))
        assert len(count_res.scalars().all()) == 0

        # B. Elevated state -> creates 1 intervention
        from app.schemas.stress import BurnoutRiskResult
        elevated_risk = BurnoutRiskResult(
            stress_level=55.0,
            burnout_risk_pct=63.0,
            focus_reserves_pct=45.0,
            risk_tier="moderate",
            intervention_needed=True,
            intervention_type="breathing",
            intervention_message="Box breathing recommended.",
        )
        decision_elev = await svc.evaluate_for_user(test_user, current_risk=elevated_risk)
        assert decision_elev.intervention_needed
        assert not decision_elev.cooldown_active
        assert decision_elev.active_intervention_id is not None
        first_intervention_id = decision_elev.active_intervention_id

        # Verify exactly 1 row in interventions table
        count_res = await session.execute(select(Intervention).where(Intervention.user_id == user_id))
        all_interventions = count_res.scalars().all()
        assert len(all_interventions) == 1
        assert all_interventions[0].id == first_intervention_id
        assert all_interventions[0].severity in ("LOW", "MODERATE")

        # C. Immediate subsequent evaluation -> COOLDOWN & DEDUPLICATION ACTIVE
        # Repeated call must NOT create a second intervention row!
        decision_repeat = await svc.evaluate_for_user(test_user, current_risk=elevated_risk)
        assert decision_repeat.intervention_needed
        assert decision_repeat.cooldown_active
        assert decision_repeat.active_intervention_id == first_intervention_id

        count_res2 = await session.execute(select(Intervention).where(Intervention.user_id == user_id))
        assert len(count_res2.scalars().all()) == 1, "Duplicate intervention record created despite cooldown!"

        # D. Dismissal suppression test:
        # Dismiss the active intervention
        dismissed = await svc.dismiss(first_intervention_id, user_id, reason="In a meeting")
        assert dismissed.was_dismissed
        assert dismissed.dismissal_reason == "In a meeting"

        # Evaluating again should be suppressed due to recent dismissal
        decision_post_dismiss = await svc.evaluate_for_user(test_user, current_risk=elevated_risk)
        assert decision_post_dismiss.cooldown_active
        assert decision_post_dismiss.cooldown_remaining_seconds > 0

        # E. Escalation Override test:
        # User suddenly jumps to CRITICAL stress (>= 85.0).
        # Escalation must break through the active dismissal cooldown!
        critical_risk = BurnoutRiskResult(
            stress_level=88.0,
            burnout_risk_pct=96.0,
            focus_reserves_pct=12.0,
            risk_tier="critical",
            intervention_needed=True,
            intervention_type="walk",
            intervention_message="Critical strain. Take an immediate walk.",
        )
        decision_crit = await svc.evaluate_for_user(test_user, current_risk=critical_risk)
        assert decision_crit.intervention_needed
        assert not decision_crit.cooldown_active, "Critical escalation was incorrectly blocked by cooldown!"
        assert decision_crit.severity == InterventionSeverity.CRITICAL.value
        crit_intervention_id = decision_crit.active_intervention_id

        # Total rows should now be 2 (original dismissed + newly escalated critical)
        count_res3 = await session.execute(select(Intervention).where(Intervention.user_id == user_id))
        assert len(count_res3.scalars().all()) == 2

        # F. Acknowledgment recovery window test:
        # Acknowledge the critical intervention
        acknowledged = await svc.acknowledge(crit_intervention_id, user_id)
        assert acknowledged.was_acknowledged
        assert acknowledged.acknowledged_at is not None

        # Evaluating again should be suppressed due to acknowledgment recovery window
        decision_post_ack = await svc.evaluate_for_user(test_user, current_risk=critical_risk)
        assert decision_post_ack.cooldown_active

    # Step 3: Test HTTP API Endpoints via AsyncClient
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # Login to get JWT
        login_res = await client.post("/api/auth/login", data={
            "username": "agent_test_user",
            "password": "testpass123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # GET /api/interventions/evaluate
        eval_res = await client.get("/api/interventions/evaluate", headers=headers)
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert "intervention_needed" in eval_data
        assert "severity" in eval_data
        assert "reason" in eval_data
        assert "cooldown_active" in eval_data

        # GET /api/interventions/ (history list)
        list_res = await client.get("/api/interventions/", headers=headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert len(items) >= 1
        assert "was_acknowledged" in items[0]
        assert "severity" in items[0]

        # Guest access test for GET /evaluate:
        # Guest gets valid decision without database failure
        guest_res = await client.post("/api/auth/guest")
        assert guest_res.status_code == 200
        guest_token = guest_res.json()["access_token"]
        guest_headers = {"Authorization": f"Bearer {guest_token}"}

        guest_eval = await client.get("/api/interventions/evaluate", headers=guest_headers)
        assert guest_eval.status_code == 200
        guest_data = guest_eval.json()
        assert "intervention_needed" in guest_data

    # Cleanup test data
    async with AsyncSession(engine, expire_on_commit=False) as session:
        await session.execute(delete(Intervention).where(Intervention.user_id == user_id))
        result = await session.execute(select(User).where(User.id == user_id))
        u = result.scalar_one_or_none()
        if u:
            await session.delete(u)
            await session.commit()
    print("=== INTERVENTION AGENT TESTS PASSED SUCCESSFULLY ===")


# ==============================================================================
# AUDIT FIX TESTS: P1, P2, P4
# ==============================================================================

@pytest.mark.asyncio
async def test_active_intervention_remains_visible_across_polling_cycles():
    """P1: An active unacknowledged intervention must remain visible across consecutive polling cycles."""
    await init_db()
    from app.core.security import get_password_hash
    from app.schemas.stress import BurnoutRiskResult

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="p1_polling_user",
            email="p1_polling@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        svc = InterventionService(session)
        risk = BurnoutRiskResult(
            stress_level=55.0,
            burnout_risk_pct=62.0,
            focus_reserves_pct=45.0,
            risk_tier="moderate",
            intervention_needed=True,
            intervention_type="micro_break",
            intervention_message="Time for a micro-break.",
        )

        # Poll 1: Initial evaluation triggers a new intervention
        dec1 = await svc.evaluate_for_user(user, current_risk=risk)
        assert dec1.intervention_needed is True
        assert dec1.active_intervention_id is not None
        assert dec1.cooldown_active is False
        first_id = dec1.active_intervention_id

        # Poll 2 (Simulating 30-second timer tick): User has not acted yet.
        # Active intervention must remain available with all attributes intact!
        dec2 = await svc.evaluate_for_user(user, current_risk=risk)
        assert dec2.intervention_needed is True
        assert dec2.active_intervention_id == first_id
        assert dec2.intervention_type == dec1.intervention_type
        assert dec2.message == dec1.message

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_early_recovery_exit_creates_aborted_state():
    """P2: When user exits early from guided recovery, an aborted state is recorded."""
    await init_db()
    from app.core.security import get_password_hash

    async with AsyncSession(engine, expire_on_commit=False) as session:
        # Ensure clean state if previous run crashed
        existing = (await session.execute(select(User).where(User.username == "p2_abort_user"))).scalar_one_or_none()
        if existing:
            await session.execute(delete(Intervention).where(Intervention.user_id == existing.id))
            await session.delete(existing)
            await session.commit()

        user = User(
            username="p2_abort_user",
            email="p2_abort@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Create active intervention
        intervention = Intervention(
            user_id=user.id,
            intervention_type="breathing",
            message="Take 3 deep breaths.",
            stress_level_at_trigger=60.0,
            risk_tier_at_trigger="high",
            was_acknowledged=False,
            was_dismissed=False,
            was_aborted=False,
        )
        session.add(intervention)
        await session.commit()
        await session.refresh(intervention)

        svc = InterventionService(session)
        # Abort intervention
        aborted = await svc.abort(intervention.id, user.id, reason="User exited recovery early")
        assert aborted.was_aborted is True
        assert aborted.was_acknowledged is False
        assert aborted.aborted_at is not None
        assert aborted.abort_reason == "User exited recovery early"

        # Active intervention should now be None
        active = await svc.get_active_intervention(user.id)
        assert active is None

        # Active count for this user should be 0
        active_count = await svc.get_active_count(user.id)
        assert active_count == 0

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_dismissed_modality_allows_alternative_modality():
    """P4: Dismissing one modality allows an alternative modality after anti-spam buffer."""
    await init_db()
    now = datetime.now(timezone.utc)
    from app.core.security import get_password_hash

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="p4_pivoting_user",
            email="p4_pivoting@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Pre-populate a dismissed micro_break from 90 seconds ago (> 60s anti-spam buffer)
        dismissed_item = Intervention(
            user_id=user.id,
            intervention_type="micro_break",
            message="Take a micro break.",
            stress_level_at_trigger=50.0,
            risk_tier_at_trigger="moderate",
            severity="MODERATE",
            was_dismissed=True,
            dismissed_at=now - timedelta(seconds=90),
            triggered_at=now - timedelta(seconds=95),
        )
        session.add(dismissed_item)
        await session.commit()

        svc = InterventionService(session)

        # 1. Exact same modality (micro_break) at MODERATE severity -> should be suppressed
        is_suppressed, _, _ = await svc._check_cooldown_and_deduplication(
            user_id=user.id,
            new_severity="MODERATE",
            new_type="micro_break",
            recent_interventions=[dismissed_item],
        )
        assert is_suppressed is True, "Exact same dismissed modality should be suppressed during dismissal window!"

        # 2. Alternative modality (focus_reset) at MODERATE severity after buffer -> allowed!
        is_suppressed_alt, _, _ = await svc._check_cooldown_and_deduplication(
            user_id=user.id,
            new_severity="MODERATE",
            new_type="focus_reset",
            recent_interventions=[dismissed_item],
        )
        assert is_suppressed_alt is False, "Alternative modality should NOT be blocked purely by severity rank!"

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_repeated_dismissal_prevents_spam():
    """P4: Repeated dismissals (>= 2) enforce suppression even across different modalities."""
    await init_db()
    now = datetime.now(timezone.utc)
    from app.core.security import get_password_hash

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="p4_repeated_user",
            email="p4_repeated@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        item1 = Intervention(
            user_id=user.id,
            intervention_type="micro_break",
            message="Micro-break",
            stress_level_at_trigger=50.0,
            risk_tier_at_trigger="moderate",
            severity="MODERATE",
            was_dismissed=True,
            dismissed_at=now - timedelta(seconds=120),
            triggered_at=now - timedelta(seconds=125),
        )
        item2 = Intervention(
            user_id=user.id,
            intervention_type="focus_reset",
            message="Focus reset",
            stress_level_at_trigger=52.0,
            risk_tier_at_trigger="moderate",
            severity="MODERATE",
            was_dismissed=True,
            dismissed_at=now - timedelta(seconds=70),
            triggered_at=now - timedelta(seconds=75),
        )
        session.add_all([item1, item2])
        await session.commit()

        svc = InterventionService(session)

        # Third attempt with a 3rd modality (breathing) at MODERATE severity -> suppressed to prevent nuisance spam
        is_suppressed, _, _ = await svc._check_cooldown_and_deduplication(
            user_id=user.id,
            new_severity="MODERATE",
            new_type="breathing",
            recent_interventions=[item2, item1],
        )
        assert is_suppressed is True, "Repeated dismissals (>= 2) should suppress subsequent non-critical interventions!"

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_critical_escalation_overrides_dismissal_suppression():
    """P4: Critical intervention always overrides repeated dismissal suppression."""
    await init_db()
    now = datetime.now(timezone.utc)
    from app.core.security import get_password_hash

    async with AsyncSession(engine, expire_on_commit=False) as session:
        user = User(
            username="p4_crit_override_user",
            email="p4_crit_override@cognishield.ai",
            hashed_password=get_password_hash("pass123"),
            is_active=True,
            is_guest=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        item1 = Intervention(
            user_id=user.id,
            intervention_type="micro_break",
            message="Micro-break",
            stress_level_at_trigger=50.0,
            risk_tier_at_trigger="moderate",
            severity="MODERATE",
            was_dismissed=True,
            dismissed_at=now - timedelta(seconds=10),
            triggered_at=now - timedelta(seconds=15),
        )
        session.add(item1)
        await session.commit()

        svc = InterventionService(session)

        # Escalation to CRITICAL (walk) -> must override suppression!
        is_suppressed, _, _ = await svc._check_cooldown_and_deduplication(
            user_id=user.id,
            new_severity="CRITICAL",
            new_type="walk",
            recent_interventions=[item1],
        )
        assert is_suppressed is False, "CRITICAL escalation must override active dismissal cooldown!"

        # Cleanup
        await session.execute(delete(Intervention).where(Intervention.user_id == user.id))
        await session.delete(user)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(test_intervention_cooldown_deduplication_and_api())
