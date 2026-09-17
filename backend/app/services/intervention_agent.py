from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Sequence
from datetime import datetime

from app.core.config import settings
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.models.intervention import Intervention
from app.schemas.intervention import (
    DeliveryChannel,
    InterventionDecision,
    InterventionPriority,
    InterventionSeverity,
)


@dataclass(frozen=True)
class AgentThresholds:
    """Centralized cognitive, behavioral, and temporal thresholds for the Intervention Agent."""
    # Stress / Burnout thresholds
    STRESS_MODERATE: float = settings.STRESS_THRESHOLD_MODERATE  # 40.0
    STRESS_HIGH: float = settings.STRESS_THRESHOLD_HIGH          # 65.0
    STRESS_CRITICAL: float = settings.STRESS_THRESHOLD_CRITICAL  # 85.0

    # Behavioral strain indicators
    TYPING_DEGRADATION_RATIO: float = 0.25    # 25% drop below baseline typing speed
    TYPING_CADENCE_MS_MAX: float = 350.0      # Sluggish inter-key latency (ms)
    ERROR_BURST_PER_MIN_MAX: float = 2.0      # Error corrections per minute
    BACKSPACE_FREQ_MAX: float = 15.0          # High backspace usage per minute
    FOCUS_BLUR_RAPID_MAX: int = 6             # Rapid window switches indicating distraction
    FOCUS_RESERVES_LOW_PCT: float = 40.0      # Depleted focus threshold
    SESSION_DURATION_HOURS_WARN: float = 0.75 # > 45 mins continuous session
    SESSION_DURATION_HOURS_HIGH: float = 1.25 # > 1.25 hours continuous session
    SESSION_DURATION_HOURS_CRIT: float = 2.0  # > 2 hours continuous session

    # Temporal history requirements
    SUSTAINED_STRAIN_WINDOW: int = 3          # Consecutive snapshots for sustained strain
    SUSTAINED_STRAIN_STRESS: float = 60.0     # Stress level considered elevated for trends
    SUSTAINED_CRITICAL_WINDOW: int = 2        # Consecutive snapshots for sustained critical
    SUSTAINED_CRITICAL_STRESS: float = 80.0   # Stress level considered critical for trends


@dataclass(frozen=True)
class CooldownConfig:
    """Cooldown periods (in seconds) preventing intervention spam."""
    LOW: int = 15 * 60            # 15 minutes
    MODERATE: int = 12 * 60       # 12 minutes
    HIGH: int = 8 * 60            # 8 minutes
    CRITICAL: int = 5 * 60        # 5 minutes
    DISMISSAL_SUPPRESSION: int = 10 * 60   # 10 minutes suppression on explicit dismissal
    ACKNOWLEDGMENT_RECOVERY: int = 10 * 60 # 10 minutes recovery window on completed intervention


class InterventionAgent:
    """
    CognitoShield Adaptive AI Intervention Agent (Phase D).
    
    Dynamically maps multi-modal cognitive signals, behavioral telemetry,
    session duration, and user interaction history to the optimal best-fit
    intervention modality:
      - Acute Stress -> Guided Breathing
      - Declining Focus / Context Switching -> Focus Reset
      - Prolonged Continuous Screen Session -> Micro-Break (20-20-20 rule)
      - Cadence Breakdown / Error Frustration -> Cognitive Recovery Break
      - Mild Strain / Routine Pacing -> Hydration & Posture Reset
      - Critical Burnout -> Physical Walk / Deep Rest
    
    Adaptive History Awareness:
    Penalizes previously dismissed modalities to avoid repetitive nagging
    while maintaining critical safety escalation overrides.
    """

    def __init__(
        self,
        thresholds: AgentThresholds = AgentThresholds(),
        cooldown_config: CooldownConfig = CooldownConfig(),
    ) -> None:
        self.thresholds = thresholds
        self.cooldown_config = cooldown_config

    def evaluate(
        self,
        current_stress: float,
        burnout_risk_pct: float,
        focus_reserves_pct: float,
        snapshot: Optional[BiometricSnapshot] = None,
        baseline: Optional[BaselineMetrics] = None,
        recent_stress_history: Optional[Sequence[StressHistory]] = None,
        recent_interventions: Optional[Sequence[Intervention]] = None,
        latest_ground_truth: Optional[UserGroundTruthLabel] = None,
    ) -> InterventionDecision:
        """
        Evaluate cognitive state and select the best-fit context-aware intervention.
        """
        th = self.thresholds

        # ── 1. Confidence Scoring ─────────────────────────────────────────────
        confidence = 0.70
        if baseline:
            confidence += 0.10
        if recent_stress_history and len(recent_stress_history) >= 3:
            confidence += 0.10
        if snapshot and (snapshot.heart_rate_bpm is not None or snapshot.hrv_ms is not None):
            confidence += 0.05
        if latest_ground_truth:
            confidence += 0.05
        confidence = min(1.0, confidence)

        # ── 2. Signal Extraction ──────────────────────────────────────────────
        typing_speed = snapshot.typing_speed_wpm if snapshot else None
        baseline_wpm = max(baseline.avg_typing_speed_wpm, 10.0) if baseline and baseline.avg_typing_speed_wpm else 60.0
        typing_drop_pct = 0.0
        if typing_speed is not None and baseline_wpm > 0:
            if typing_speed < baseline_wpm:
                typing_drop_pct = round((1.0 - typing_speed / baseline_wpm) * 100, 1)

        error_bursts = snapshot.error_burst_per_min if snapshot and snapshot.error_burst_per_min is not None else 0.0
        backspace_freq = snapshot.backspace_freq if snapshot and snapshot.backspace_freq is not None else 0.0
        session_duration_secs = snapshot.active_session_duration if snapshot and snapshot.active_session_duration is not None else 0.0
        session_hours = session_duration_secs / 3600.0
        focus_blur_events = snapshot.focus_blur_events if snapshot and snapshot.focus_blur_events is not None else 0

        # Trends
        sustained_strain = False
        sustained_critical = False
        if recent_stress_history:
            recent_stresses = [rec.stress_level for rec in recent_stress_history[:th.SUSTAINED_STRAIN_WINDOW]]
            if len(recent_stresses) >= th.SUSTAINED_STRAIN_WINDOW and all(s >= th.SUSTAINED_STRAIN_STRESS for s in recent_stresses):
                sustained_strain = True

            recent_crit = [rec.stress_level for rec in recent_stress_history[:th.SUSTAINED_CRITICAL_WINDOW]]
            if len(recent_crit) >= th.SUSTAINED_CRITICAL_WINDOW and all(s >= th.SUSTAINED_CRITICAL_STRESS for s in recent_crit):
                sustained_critical = True

        # Subjective feedback
        subjective_fatigue = latest_ground_truth.fatigue_level if latest_ground_truth else None
        subjective_focus = latest_ground_truth.focus_level if latest_ground_truth else None

        # ── 3. Evaluate Condition Scores ──────────────────────────────────────
        # A. Critical Exhaustion (High Priority Safety)
        critical_score = 0.0
        if current_stress >= th.STRESS_CRITICAL:
            critical_score += 90.0 + (current_stress - th.STRESS_CRITICAL)
        if sustained_critical:
            critical_score += 85.0
        if current_stress >= 75.0 and session_hours >= th.SESSION_DURATION_HOURS_CRIT:
            critical_score += 80.0

        # B. Cadence & Typing Friction
        cadence_score = 0.0
        if typing_drop_pct >= (th.TYPING_DEGRADATION_RATIO * 100):
            cadence_score += min(50.0, typing_drop_pct * 1.2)
        if error_bursts >= th.ERROR_BURST_PER_MIN_MAX:
            cadence_score += min(35.0, error_bursts * 12.0)
        if backspace_freq >= th.BACKSPACE_FREQ_MAX:
            cadence_score += 25.0

        # C. Prolonged Session Duration
        session_score = 0.0
        if session_hours >= th.SESSION_DURATION_HOURS_HIGH:
            session_score += min(80.0, session_hours * 50.0)
        elif session_hours >= th.SESSION_DURATION_HOURS_WARN:
            session_score += min(55.0, session_hours * 45.0)

        # D. Focus Deficit & Context Switching
        focus_score = 0.0
        if focus_reserves_pct < th.FOCUS_RESERVES_LOW_PCT:
            focus_score += (th.FOCUS_RESERVES_LOW_PCT - focus_reserves_pct) * 1.8
        if focus_blur_events >= th.FOCUS_BLUR_RAPID_MAX:
            focus_score += min(40.0, focus_blur_events * 5.0)
        if subjective_focus is not None and subjective_focus <= 2:
            focus_score += (3 - subjective_focus) * 18.0

        # E. Acute Stress & Autonomic Arousal
        stress_score = 0.0
        if current_stress >= th.STRESS_MODERATE:
            stress_score += (current_stress - th.STRESS_MODERATE) * 1.6
        if sustained_strain:
            stress_score += 25.0
        if snapshot and snapshot.heart_rate_bpm and baseline and baseline.avg_heart_rate_bpm:
            if snapshot.heart_rate_bpm > baseline.avg_heart_rate_bpm + 10:
                stress_score += 20.0

        # F. Mild Sluggishness / Routine Anchor
        hydration_score = 20.0 if current_stress >= th.STRESS_MODERATE or session_hours >= 0.5 else 0.0

        # ── 4. Analyze Intervention History & Adapt ───────────────────────────
        dismissed_history: list[str] = []
        last_dismissed_type: Optional[str] = None

        if recent_interventions:
            for item in recent_interventions[:5]:
                itype = getattr(item, "intervention_type", "")
                if getattr(item, "was_dismissed", False) and itype:
                    dismissed_history.append(itype)
                    if last_dismissed_type is None:
                        last_dismissed_type = itype

        # Adaptive penalties: reduce score of recently or repeatedly dismissed interventions
        # so the agent shifts dynamically to alternative modalities
        penalty_map: dict[str, float] = {}
        for itype in set(dismissed_history):
            count = dismissed_history.count(itype)
            penalty_map[itype] = 35.0 if count == 1 else 60.0

        # Apply penalties to candidate modalities (except walk under critical conditions)
        adjusted_scores = {
            "walk": critical_score,
            "cognitive_recovery": max(0.0, cadence_score - penalty_map.get("cognitive_recovery", 0.0)),
            "micro_break": max(0.0, session_score - penalty_map.get("micro_break", 0.0)),
            "focus_reset": max(0.0, focus_score - penalty_map.get("focus_reset", 0.0)),
            "breathing": max(0.0, stress_score - penalty_map.get("breathing", 0.0)),
            "hydration": max(0.0, hydration_score - penalty_map.get("hydration", 0.0)),
        }

        # ── 5. Best-Fit Selection ─────────────────────────────────────────────
        # If normal cognitive state with no significant strain scores
        is_strained = (
            current_stress >= th.STRESS_MODERATE
            or session_hours >= th.SESSION_DURATION_HOURS_WARN
            or cadence_score >= 35.0
            or focus_score >= 35.0
            or critical_score > 0.0
        )

        if not is_strained:
            return InterventionDecision(
                intervention_needed=False,
                severity=InterventionSeverity.NONE.value,
                intervention_type="none",
                title="Cognitive State Normal",
                message="You are within healthy cognitive load parameters. Continue steady pacing.",
                reason=f"Stress level ({current_stress:.1f}%) and behavioral signals are within normal parameters.",
                priority=InterventionPriority.LOW.value,
                confidence=confidence,
                recommended_duration_mins=0,
                delivery_channels=[],
            )

        # A. Critical Safety Override (Trumps all history penalties)
        if critical_score >= 75.0:
            crit_reason = (
                f"Critical burnout threshold reached with acute stress at {current_stress:.1f}%."
                if current_stress >= th.STRESS_CRITICAL
                else f"Sustained critical cognitive strain detected across continuous work."
            )
            return InterventionDecision(
                intervention_needed=True,
                severity=InterventionSeverity.CRITICAL.value,
                intervention_type="walk",
                title="Critical Cognitive Load — Immediate Recovery Recommended",
                message="Severe cognitive exhaustion detected. Please step away from your workstation for a 10-15 minute walk or restorative pause.",
                reason=crit_reason,
                priority=InterventionPriority.URGENT.value,
                confidence=confidence,
                recommended_duration_mins=15,
                delivery_channels=[
                    DeliveryChannel.IN_APP_MODAL.value,
                    DeliveryChannel.SYSTEM_NOTIFICATION.value,
                    DeliveryChannel.AUDIO_CHIME.value,
                ],
            )

        # B. Select Highest-Scoring Non-Critical Modality
        # Remove walk from candidate pool for non-critical selections
        candidate_scores = {k: v for k, v in adjusted_scores.items() if k != "walk"}
        best_modality = max(candidate_scores, key=candidate_scores.get)
        top_score = candidate_scores[best_modality]

        # In case penalties suppressed everything below a threshold, fallback to hydration or gentle pause
        if top_score <= 10.0:
            best_modality = "hydration" if "hydration" != last_dismissed_type else "micro_break"

        # Adaptive dismissal rationale note
        adaptation_note = ""
        if last_dismissed_type and last_dismissed_type in ("breathing", "micro_break", "focus_reset"):
            adaptation_note = f" (Prior {last_dismissed_type.replace('_', ' ')} prompt was dismissed; adapted recommendation.)"

        # C. Format Decision per Best-Fit Modality
        if best_modality == "cognitive_recovery":
            reason = (
                f"Typing cadence dropped {typing_drop_pct:.1f}% below baseline with {error_bursts:.1f} error corrections/min, "
                f"indicating rising mental friction.{adaptation_note}"
            )
            return InterventionDecision(
                intervention_needed=True,
                severity=InterventionSeverity.HIGH.value if current_stress >= 55.0 else InterventionSeverity.MODERATE.value,
                intervention_type="cognitive_recovery",
                title="Cognitive Friction Detected — Reset Recommended",
                message="Typing rhythm and error bursts indicate elevated cognitive friction. Take 5 minutes to step back and clear your thoughts.",
                reason=reason,
                priority=InterventionPriority.HIGH.value,
                confidence=confidence,
                recommended_duration_mins=5,
                delivery_channels=[
                    DeliveryChannel.IN_APP_MODAL.value,
                    DeliveryChannel.IN_APP_BANNER.value,
                ],
            )

        if best_modality == "focus_reset":
            reason = (
                f"Attention fragmentation detected ({focus_blur_events} window focus shifts) with focus reserves at {focus_reserves_pct:.1f}%; "
                f"a 3-minute focus reset is recommended.{adaptation_note}"
            )
            return InterventionDecision(
                intervention_needed=True,
                severity=InterventionSeverity.MODERATE.value,
                intervention_type="focus_reset",
                title="Focus Deficit Detected — Recalibration Pause",
                message="Frequent window switches and depleted focus reserves detected. Take 3 minutes for single-task grounding and eye rest.",
                reason=reason,
                priority=InterventionPriority.MEDIUM.value,
                confidence=confidence,
                recommended_duration_mins=3,
                delivery_channels=[
                    DeliveryChannel.IN_APP_BANNER.value,
                ],
            )

        if best_modality == "micro_break":
            reason = (
                f"Continuous screen session has reached {session_hours:.1f} hours without break; "
                f"a 5-minute micro-break is recommended to prevent ocular and postural strain.{adaptation_note}"
            )
            return InterventionDecision(
                intervention_needed=True,
                severity=InterventionSeverity.HIGH.value if session_hours >= th.SESSION_DURATION_HOURS_HIGH else InterventionSeverity.MODERATE.value,
                intervention_type="micro_break",
                title="Prolonged Session — Micro-Break Recommended",
                message="You have been working continuously without a break. Step away for 5 minutes: 20-20-20 eye rest and shoulder stretches.",
                reason=reason,
                priority=InterventionPriority.HIGH.value if session_hours >= th.SESSION_DURATION_HOURS_HIGH else InterventionPriority.MEDIUM.value,
                confidence=confidence,
                recommended_duration_mins=5,
                delivery_channels=[
                    DeliveryChannel.IN_APP_BANNER.value,
                    DeliveryChannel.IN_APP_MODAL.value,
                ],
            )

        if best_modality == "breathing":
            is_high_stress = current_stress >= th.STRESS_HIGH or sustained_strain
            severity = InterventionSeverity.HIGH.value if is_high_stress else InterventionSeverity.MODERATE.value
            priority = InterventionPriority.HIGH.value if is_high_stress else InterventionPriority.MEDIUM.value
            reason = (
                f"Elevated stress indicators ({current_stress:.1f}%) detected across recent telemetry"
                + (" with sustained high strain pattern" if sustained_strain else "")
                + f"; a 3-minute guided breathing pause is recommended to down-regulate sympathetic arousal.{adaptation_note}"
            )
            delivery_channels = [
                DeliveryChannel.IN_APP_BANNER.value,
                DeliveryChannel.IN_APP_MODAL.value,
            ] if is_high_stress else [
                DeliveryChannel.IN_APP_BANNER.value,
            ]
            return InterventionDecision(
                intervention_needed=True,
                severity=severity,
                intervention_type="breathing",
                title="Guided Respiration — Autonomic Reset",
                message="Elevated cognitive stress observed. Take 3 minutes for box breathing (4 in, hold 4, out 6) to restore composure.",
                reason=reason,
                priority=priority,
                confidence=confidence,
                recommended_duration_mins=3,
                delivery_channels=delivery_channels,
            )

        # Default fallback: Hydration & Posture Reset
        reason = (
            f"Cognitive load is elevated ({current_stress:.1f}%) over an active work session; "
            f"a 2-minute hydration and posture reset is recommended.{adaptation_note}"
        )
        return InterventionDecision(
            intervention_needed=True,
            severity=InterventionSeverity.LOW.value,
            intervention_type="hydration",
            title="Hydration & Posture Reset",
            message="Cognitive strain is rising. Drink a glass of water, roll your shoulders back, and rest your eyes.",
            reason=reason,
            priority=InterventionPriority.MEDIUM.value if current_stress >= th.STRESS_MODERATE else InterventionPriority.LOW.value,
            confidence=confidence,
            recommended_duration_mins=2,
            delivery_channels=[
                DeliveryChannel.IN_APP_BANNER.value,
            ],
        )

    def get_cooldown_seconds(self, severity: str) -> int:
        """Return the cooldown period in seconds for a given intervention severity."""
        sev = severity.upper()
        if sev == InterventionSeverity.CRITICAL.value:
            return self.cooldown_config.CRITICAL
        if sev == InterventionSeverity.HIGH.value:
            return self.cooldown_config.HIGH
        if sev == InterventionSeverity.MODERATE.value:
            return self.cooldown_config.MODERATE
        if sev == InterventionSeverity.LOW.value:
            return self.cooldown_config.LOW
        return 0


# Global singleton instance
intervention_agent = InterventionAgent()
