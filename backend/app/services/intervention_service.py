from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Sequence, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.exceptions import NotFoundException
from app.models.intervention import Intervention
from app.models.user import User
from app.models.biometric import BiometricSnapshot, BaselineMetrics, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.repositories.base import BaseRepository
from app.repositories.biometric_repo import BiometricRepository
from app.repositories.stress_repo import StressRepository
from app.repositories.ground_truth_repo import GroundTruthRepository
from app.schemas.stress import BurnoutRiskResult
from app.schemas.intervention import (
    InterventionDecision,
    InterventionSeverity,
)
from app.services.intervention_agent import (
    intervention_agent,
    InterventionAgent,
    AgentThresholds,
)

logger = logging.getLogger(__name__)

SEVERITY_RANKS = {
    InterventionSeverity.NONE.value: 0,
    InterventionSeverity.LOW.value: 1,
    InterventionSeverity.MODERATE.value: 2,
    InterventionSeverity.HIGH.value: 3,
    InterventionSeverity.CRITICAL.value: 4,
}


class InterventionService:
    def __init__(
        self,
        db: AsyncSession,
        agent: Optional[InterventionAgent] = None,
    ) -> None:
        self.db = db
        self._repo = BaseRepository(Intervention, db)
        self.agent = agent or intervention_agent

    async def evaluate_for_user(
        self,
        user: User,
        current_risk: Optional[BurnoutRiskResult] = None,
        current_snapshot: Optional[BiometricSnapshot] = None,
        bypass_cooldown: bool = False,
    ) -> InterventionDecision:
        """
        Evaluate cognitive state for a user, execute the Intervention Agent,
        apply cooldown and deduplication rules, persist genuine new interventions,
        and return the decision.
        """
        user_id = getattr(user, "id", 0)
        is_guest = getattr(user, "is_guest", False)

        try:
            # 1. Gather current state & historical context
            bio_repo = BiometricRepository(self.db)
            stress_repo = StressRepository(self.db)

            baseline: Optional[BaselineMetrics] = None
            if not is_guest:
                baseline = await bio_repo.get_baseline(user_id)

            snapshot = current_snapshot
            if snapshot is None and not is_guest:
                recent_snaps = await bio_repo.get_recent_snapshots(user_id, limit=1)
                snapshot = recent_snaps[0] if recent_snaps else None

            recent_stress: list[StressHistory] = []
            recent_interventions: list[Intervention] = []
            latest_gt: Optional[UserGroundTruthLabel] = None
            if not is_guest:
                recent_stress = await stress_repo.get_history(user_id, limit=5)
                recent_interventions = list(await self.get_user_interventions(user_id, limit=5))
                gt_repo = GroundTruthRepository(self.db)
                latest_gt = await gt_repo.get_last_label(user_id)

            # Determine stress level to evaluate
            if current_risk:
                stress_level = current_risk.stress_level
                burnout_risk = current_risk.burnout_risk_pct
                focus_reserves = current_risk.focus_reserves_pct
            elif recent_stress:
                stress_level = recent_stress[0].stress_level
                burnout_risk = recent_stress[0].burnout_risk_pct
                focus_reserves = recent_stress[0].focus_reserves_pct
            else:
                # Default to normal baseline
                stress_level = 20.0
                burnout_risk = 23.0
                focus_reserves = 80.0

            # 2. Run deterministic rule-based Intervention Agent
            decision = self.agent.evaluate(
                current_stress=stress_level,
                burnout_risk_pct=burnout_risk,
                focus_reserves_pct=focus_reserves,
                snapshot=snapshot,
                baseline=baseline,
                recent_stress_history=recent_stress,
                recent_interventions=recent_interventions,
                latest_ground_truth=latest_gt,
            )

            # If no intervention is required, return normal state immediately
            if not decision.intervention_needed:
                return decision

            # 3. Apply Cooldown, History & Deduplication Rules (for non-guest users)
            if not is_guest:
                cooldown_active, remaining_secs, active_item = await self._check_cooldown_and_deduplication(
                    user_id=user_id,
                    new_severity=decision.severity,
                    new_type=decision.intervention_type,
                    recent_interventions=recent_interventions,
                )

                # If an active unacknowledged/undismissed/unaborted intervention exists,
                # populate decision with its properties so the UI keeps presenting it.
                if active_item is not None:
                    decision.intervention_needed = True
                    decision.active_intervention_id = active_item.id
                    decision.intervention_type = active_item.intervention_type
                    decision.message = active_item.message
                    decision.severity = active_item.severity or decision.severity
                    decision.priority = active_item.priority or decision.priority
                    decision.confidence = active_item.confidence or decision.confidence
                    decision.recommended_duration_mins = active_item.recommended_duration_mins or decision.recommended_duration_mins
                    decision.delivery_channels = decision.delivery_channels or ([active_item.delivery_channel] if active_item.delivery_channel else [])
                    decision.reason = active_item.reason or decision.reason
                    decision.cooldown_active = True
                    decision.cooldown_remaining_seconds = remaining_secs
                    return decision

                # If new intervention is suppressed by cooldown
                if cooldown_active and not bypass_cooldown:
                    decision.intervention_needed = False
                    decision.cooldown_active = True
                    decision.cooldown_remaining_seconds = remaining_secs
                    decision.active_intervention_id = None
                    return decision

                # 4. Persist genuine new intervention
                primary_channel = decision.delivery_channels[0] if decision.delivery_channels else "IN_APP_BANNER"
                risk_tier = self._classify_tier(stress_level)

                # Capture decision-time state context (Phase G.1)
                last_dismissed_mod = None
                for past in recent_interventions:
                    if getattr(past, "was_dismissed", False) and past.intervention_type:
                        last_dismissed_mod = past.intervention_type
                        break

                decision_context_dict = {
                    # Cognitive metrics
                    "current_stress": float(stress_level),
                    "burnout_risk_pct": float(burnout_risk),
                    "focus_reserves_pct": float(focus_reserves),
                    "risk_tier": risk_tier,

                    # Typing & behavioral strain
                    "typing_speed_wpm": snapshot.typing_speed_wpm if snapshot else None,
                    "baseline_typing_speed_wpm": baseline.avg_typing_speed_wpm if baseline else None,
                    "typing_cadence_ms": snapshot.typing_cadence_ms if snapshot else None,
                    "error_burst_per_min": snapshot.error_burst_per_min if snapshot else None,
                    "backspace_freq": snapshot.backspace_freq if snapshot else None,
                    "typing_speed_variance": snapshot.typing_speed_variance if snapshot else None,

                    # Mouse & UI activity
                    "mouse_velocity": snapshot.mouse_velocity if snapshot else None,
                    "mouse_clicks": snapshot.mouse_clicks if snapshot else None,
                    "scroll_speed": snapshot.scroll_speed if snapshot else None,

                    # Attention & session signals
                    "focus_blur_events": snapshot.focus_blur_events if snapshot else None,
                    "page_visibility_changes": snapshot.page_visibility_changes if snapshot else None,
                    "idle_time_seconds": snapshot.idle_time_seconds if snapshot else None,
                    "active_session_duration_secs": snapshot.active_session_duration if snapshot else None,

                    # Physiological telemetry (explicit null if no hardware sensor)
                    "heart_rate_bpm": snapshot.heart_rate_bpm if snapshot else None,
                    "hrv_ms": snapshot.hrv_ms if snapshot else None,

                    # Historical interaction context
                    "recent_dismissals_count": len([i for i in recent_interventions if getattr(i, "was_dismissed", False)]),
                    "recent_aborts_count": len([i for i in recent_interventions if getattr(i, "was_aborted", False)]),
                    "recent_completions_count": len([i for i in recent_interventions if getattr(i, "was_acknowledged", False)]),
                    "last_dismissed_modality": last_dismissed_mod,

                    # Ground-truth labels (if user submitted subjective sliders)
                    "subjective_fatigue": latest_gt.fatigue_level if latest_gt else None,
                    "subjective_focus": latest_gt.focus_level if latest_gt else None,
                    "subjective_stress": (
                        getattr(latest_gt, "stress_level", getattr(latest_gt, "stress_rating", None))
                        if latest_gt
                        else None
                    ),
                }

                new_intervention = Intervention(
                    user_id=user_id,
                    intervention_type=decision.intervention_type,
                    message=decision.message,
                    stress_level_at_trigger=stress_level,
                    risk_tier_at_trigger=risk_tier,
                    severity=decision.severity,
                    priority=decision.priority,
                    confidence=decision.confidence,
                    recommended_duration_mins=decision.recommended_duration_mins,
                    delivery_channel=primary_channel,
                    reason=decision.reason,
                    was_acknowledged=False,
                    was_dismissed=False,
                    was_aborted=False,
                    decision_context=json.dumps(decision_context_dict),
                )
                saved = await self._repo.create(new_intervention)
                decision.active_intervention_id = saved.id
            else:
                decision.active_intervention_id = -1

            return decision

        except Exception as e:
            logger.error(f"Error during intervention evaluation for user {user_id}: {e}", exc_info=True)
            # Safe fallback: do not break callers
            return InterventionDecision(
                intervention_needed=False,
                severity=InterventionSeverity.NONE.value,
                intervention_type="none",
                title="Cognitive State Normal",
                message="Evaluation completed safely.",
                reason="System fallback.",
            )

    async def _check_cooldown_and_deduplication(
        self,
        user_id: int,
        new_severity: str,
        new_type: str,
        recent_interventions: Optional[Sequence[Intervention]] = None,
    ) -> tuple[bool, int, Optional[Intervention]]:
        """
        Check whether an intervention should be suppressed due to:
        1. An existing active (unacknowledged, undismissed, unaborted) intervention.
        2. Recent dismissal / abort suppression window (with modality pivoting support).
        3. Recent acknowledgment / recovery window.
        4. Cooldown window for the proposed severity level.
        
        Returns (is_suppressed, remaining_seconds, active_intervention).
        """
        now = datetime.now(timezone.utc)
        new_rank = SEVERITY_RANKS.get(new_severity.upper(), 0)

        # Retrieve recent interventions for the user if not supplied
        if recent_interventions is None:
            recent_interventions = await self.get_user_interventions(user_id, limit=5)
        if not recent_interventions:
            return False, 0, None

        latest = recent_interventions[0]

        # Helper to ensure timezone-aware datetime comparison
        def to_aware(dt: Optional[datetime]) -> Optional[datetime]:
            if dt is None:
                return None
            return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

        # ── Check 1: Existing Active Unacknowledged / Undismissed / Unaborted ────
        for item in recent_interventions:
            if not item.was_acknowledged and not getattr(item, "was_dismissed", False) and not getattr(item, "was_aborted", False):
                trig_time = to_aware(item.triggered_at)
                age_secs = (now - trig_time).total_seconds() if trig_time else 0
                # Active if within 30 minutes
                if age_secs < 1800:
                    item_sev = getattr(item, "severity", "MODERATE") or "MODERATE"
                    item_rank = SEVERITY_RANKS.get(item_sev.upper(), 2)

                    # If this is an escalation to CRITICAL from a lower tier, allow it through!
                    if new_rank == SEVERITY_RANKS[InterventionSeverity.CRITICAL.value] and item_rank < new_rank:
                        break  # Proceed to create critical intervention

                    # Otherwise, duplicate request: ongoing intervention is still active
                    remaining = max(0, int(self.agent.get_cooldown_seconds(item_sev) - age_secs))
                    return True, remaining, item

        # ── Check 2: Recent Dismissal / Abort Suppression ─────────────────────
        dismissed_count = 0
        for item in recent_interventions:
            is_dismissed = getattr(item, "was_dismissed", False)
            is_aborted = getattr(item, "was_aborted", False)
            if is_dismissed or is_aborted:
                dismissed_count += 1
                d_time = to_aware(getattr(item, "dismissed_at", None) or getattr(item, "aborted_at", None))
                if d_time:
                    elapsed = (now - d_time).total_seconds()
                    if elapsed < self.agent.cooldown_config.DISMISSAL_SUPPRESSION:
                        item_sev = getattr(item, "severity", "MODERATE") or "MODERATE"
                        item_rank = SEVERITY_RANKS.get(item_sev.upper(), 2)
                        item_type = getattr(item, "intervention_type", "")

                        # Escalation to CRITICAL always breaks through dismissal suppression
                        if new_rank == SEVERITY_RANKS[InterventionSeverity.CRITICAL.value] and item_rank < new_rank:
                            continue

                        # Repeated dismissals (>= 2 recent dismissals): suppress all non-critical to prevent nuisance spam
                        if dismissed_count >= 2 and new_rank <= item_rank:
                            remaining = int(self.agent.cooldown_config.DISMISSAL_SUPPRESSION - elapsed)
                            return True, remaining, None

                        # Exact same modality dismissed: enforce full dismissal cooldown window
                        if new_type == item_type:
                            remaining = int(self.agent.cooldown_config.DISMISSAL_SUPPRESSION - elapsed)
                            return True, remaining, None

                        # Alternative modality selected by agent (Phase D):
                        # Allow alternative modality after a short anti-spam buffer (60 seconds)
                        ANTI_SPAM_BUFFER_SECS = 60
                        if elapsed < ANTI_SPAM_BUFFER_SECS:
                            remaining = int(ANTI_SPAM_BUFFER_SECS - elapsed)
                            return True, remaining, None

        # ── Check 3: Recent Acknowledgment Recovery Window ───────────────────
        for item in recent_interventions:
            if item.was_acknowledged:
                a_time = to_aware(item.acknowledged_at)
                if a_time:
                    elapsed = (now - a_time).total_seconds()
                    if elapsed < self.agent.cooldown_config.ACKNOWLEDGMENT_RECOVERY:
                        item_sev = getattr(item, "severity", "MODERATE") or "MODERATE"
                        item_rank = SEVERITY_RANKS.get(item_sev.upper(), 2)
                        # Grant recovery immunity unless escalated to critical
                        if new_rank <= item_rank:
                            remaining = int(self.agent.cooldown_config.ACKNOWLEDGMENT_RECOVERY - elapsed)
                            return True, remaining, None

        # ── Check 4: Severity Cooldown Window (for completed/general interventions)
        # Only check if latest was not already handled by dismissal suppression
        if not getattr(latest, "was_dismissed", False) and not getattr(latest, "was_aborted", False):
            latest_trig = to_aware(latest.triggered_at)
            if latest_trig:
                elapsed = (now - latest_trig).total_seconds()
                cooldown_secs = self.agent.get_cooldown_seconds(new_severity)

                if elapsed < cooldown_secs:
                    latest_sev = getattr(latest, "severity", "MODERATE") or "MODERATE"
                    latest_rank = SEVERITY_RANKS.get(latest_sev.upper(), 2)

                    # Escalation to CRITICAL overrides active cooldown
                    if new_rank == SEVERITY_RANKS[InterventionSeverity.CRITICAL.value] and latest_rank < new_rank:
                        return False, 0, None

                    remaining = int(cooldown_secs - elapsed)
                    return True, remaining, None

        return False, 0, None

    async def trigger_if_needed(
        self,
        user: User,
        risk: BurnoutRiskResult,
        snapshot: Optional[BiometricSnapshot] = None,
    ) -> Intervention | None:
        """
        Legacy/telemetry pipeline trigger method upgraded to use the Intervention Agent
        with cooldown and deduplication.
        """
        if user.is_guest or not risk.intervention_needed:
            return None

        try:
            decision = await self.evaluate_for_user(user, current_risk=risk, current_snapshot=snapshot)
            if decision.intervention_needed and not decision.cooldown_active and decision.active_intervention_id:
                res = await self.db.execute(
                    select(Intervention).where(Intervention.id == decision.active_intervention_id)
                )
                return res.scalar_one_or_none()
            return None
        except Exception as e:
            logger.warning(f"trigger_if_needed failed gracefully for user {user.id}: {e}")
            return None

    async def get_user_interventions(
        self, user_id: int, limit: int = 20
    ) -> list[Intervention]:
        """List all triggered interventions for a user ordered by newest first."""
        result = await self.db.execute(
            select(Intervention)
            .where(Intervention.user_id == user_id)
            .order_by(desc(Intervention.triggered_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active_intervention(self, user_id: int) -> Optional[Intervention]:
        """Fetch the currently active unacknowledged, undismissed, and unaborted intervention for a user."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Intervention)
            .where(
                Intervention.user_id == user_id,
                Intervention.was_acknowledged == False,
                Intervention.was_dismissed == False,
                Intervention.was_aborted == False,
            )
            .order_by(desc(Intervention.triggered_at))
            .limit(1)
        )
        item = result.scalar_one_or_none()
        if item and item.triggered_at:
            trig = item.triggered_at if item.triggered_at.tzinfo else item.triggered_at.replace(tzinfo=timezone.utc)
            # Only consider active if triggered within last 30 mins
            if (now - trig).total_seconds() < 1800:
                return item
        return None

    async def acknowledge(self, intervention_id: int, user_id: int) -> Intervention:
        """Mark an intervention as acknowledged/completed."""
        result = await self.db.execute(
            select(Intervention).where(
                Intervention.id == intervention_id,
                Intervention.user_id == user_id,
            )
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundException("Intervention")
        obj.was_acknowledged = True
        obj.acknowledged_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def dismiss(
        self, intervention_id: int, user_id: int, reason: Optional[str] = None
    ) -> Intervention:
        """Mark an intervention as dismissed by the user with an optional reason."""
        result = await self.db.execute(
            select(Intervention).where(
                Intervention.id == intervention_id,
                Intervention.user_id == user_id,
            )
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundException("Intervention")
        obj.was_dismissed = True
        obj.dismissed_at = datetime.now(timezone.utc)
        if reason:
            obj.dismissal_reason = reason
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def abort(
        self, intervention_id: int, user_id: int, reason: Optional[str] = None
    ) -> Intervention:
        """Mark an intervention as aborted/abandoned by the user before completion."""
        result = await self.db.execute(
            select(Intervention).where(
                Intervention.id == intervention_id,
                Intervention.user_id == user_id,
            )
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundException("Intervention")
        obj.was_aborted = True
        obj.aborted_at = datetime.now(timezone.utc)
        if reason:
            obj.abort_reason = reason
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get_active_count(self, user_id: Optional[int] = None) -> int:
        """Count total active (unacknowledged, undismissed, and unaborted) interventions."""
        query = select(Intervention).where(
            Intervention.was_acknowledged == False,
            Intervention.was_dismissed == False,
            Intervention.was_aborted == False,
        )
        if user_id is not None:
            query = query.where(Intervention.user_id == user_id)
        result = await self.db.execute(query)
        return len(result.scalars().all())

    async def get_ml_tuples(self, user_id: int, limit: int = 50) -> list[dict[str, Any]]:
        """Fetch ML dataset-ready tuples for a user's interventions."""
        interventions = await self.get_user_interventions(user_id, limit=limit)
        return [item.to_ml_tuple() for item in interventions]

    async def get_intervention_ml_tuple(self, intervention_id: int, user_id: int) -> Optional[dict[str, Any]]:
        """Fetch ML dataset-ready tuple for a single intervention."""
        result = await self.db.execute(
            select(Intervention).where(
                Intervention.id == intervention_id,
                Intervention.user_id == user_id,
            )
        )
        item = result.scalar_one_or_none()
        return item.to_ml_tuple() if item else None

    @staticmethod
    def _classify_tier(score: float) -> str:
        th = AgentThresholds()
        if score >= th.STRESS_CRITICAL:
            return "critical"
        if score >= th.STRESS_HIGH:
            return "high"
        if score >= th.STRESS_MODERATE:
            return "moderate"
        return "low"
