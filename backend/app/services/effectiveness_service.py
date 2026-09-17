from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.intervention import Intervention
from app.models.stress import StressHistory
from app.models.biometric import BiometricSnapshot
from app.repositories.biometric_repo import BiometricRepository
from app.schemas.intervention import (
    EffectivenessResult,
    MetricDelta,
    InterventionEffectiveness,
)

logger = logging.getLogger(__name__)


class EffectivenessService:
    """
    Closed-Loop Intervention Effectiveness Engine (Phase F).
    
    Deterministically computes before-vs-after behavioral and cognitive changes
    following an acknowledged intervention.
    
    Non-Medical Observational Boundary:
    Measures solely whether the user's behavioral/cognitive indicators changed
    relative to their pre-intervention state.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def calculate_effectiveness(
        self,
        intervention_id: int,
        user_id: int,
        min_observation_seconds: int = 30,
    ) -> InterventionEffectiveness:
        """
        Evaluate before-vs-after telemetry for an acknowledged intervention.
        """
        now = datetime.now(timezone.utc)

        # 1. Fetch intervention
        query = select(Intervention).where(
            Intervention.id == intervention_id,
            Intervention.user_id == user_id,
        )
        res = await self.db.execute(query)
        intervention = res.scalar_one_or_none()
        if not intervention:
            raise NotFoundException("Intervention")

        def to_aware(dt: Optional[datetime]) -> Optional[datetime]:
            if dt is None:
                return None
            return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

        ack_time = to_aware(intervention.acknowledged_at)
        trig_time = to_aware(intervention.triggered_at) or ack_time

        # 2. Check completion (P2: check if unacknowledged or aborted early)
        is_aborted = getattr(intervention, "was_aborted", False)
        if not intervention.was_acknowledged or not ack_time or is_aborted:
            summary_msg = (
                "Intervention was aborted before completion. Effectiveness cannot be evaluated."
                if is_aborted
                else "Intervention was not completed (dismissed or exited early). Effectiveness cannot be evaluated."
            )
            return InterventionEffectiveness(
                intervention_id=intervention.id,
                intervention_type=intervention.intervention_type,
                acknowledged_at=None if is_aborted else intervention.acknowledged_at,
                evaluated_at=now,
                result=EffectivenessResult.INSUFFICIENT_DATA.value,
                summary=summary_msg,
                score=None,
                has_sufficient_data=False,
                observation_window_mins=0.0,
                metrics={},
            )

        observation_seconds = (now - ack_time).total_seconds()
        observation_window_mins = round(max(0.0, observation_seconds) / 60.0, 1)

        # 3. Retrieve pre-intervention telemetry (prior to trigger / ack)
        # Pre-Stress: last 5 records before trigger_time (fallback to intervention.stress_level_at_trigger)
        pre_stress_query = (
            select(StressHistory)
            .where(
                StressHistory.user_id == user_id,
                StressHistory.recorded_at <= (trig_time or ack_time),
            )
            .order_by(desc(StressHistory.recorded_at))
            .limit(5)
        )
        pre_stress_res = await self.db.execute(pre_stress_query)
        pre_stress = list(pre_stress_res.scalars().all())

        # Pre-Snapshots: last 5 records before trigger_time
        pre_snap_query = (
            select(BiometricSnapshot)
            .where(
                BiometricSnapshot.user_id == user_id,
                BiometricSnapshot.captured_at <= (trig_time or ack_time),
            )
            .order_by(desc(BiometricSnapshot.captured_at))
            .limit(5)
        )
        pre_snap_res = await self.db.execute(pre_snap_query)
        pre_snaps = list(pre_snap_res.scalars().all())

        # 4. Retrieve post-intervention telemetry (after ack_time)
        post_stress_query = (
            select(StressHistory)
            .where(
                StressHistory.user_id == user_id,
                StressHistory.recorded_at >= ack_time,
            )
            .order_by(StressHistory.recorded_at.asc())
            .limit(5)
        )
        post_stress_res = await self.db.execute(post_stress_query)
        post_stress = list(post_stress_res.scalars().all())

        post_snap_query = (
            select(BiometricSnapshot)
            .where(
                BiometricSnapshot.user_id == user_id,
                BiometricSnapshot.captured_at >= ack_time,
            )
            .order_by(BiometricSnapshot.captured_at.asc())
            .limit(5)
        )
        post_snap_res = await self.db.execute(post_snap_query)
        post_snaps = list(post_snap_res.scalars().all())

        # 5. Check data sufficiency (P3: Require at least 2 valid post-intervention snapshots)
        valid_post_stress = [s for s in post_stress if s.stress_level is not None]
        valid_post_snaps = [
            s for s in post_snaps
            if any(getattr(s, f) is not None for f in ("typing_speed_wpm", "typing_cadence_ms", "error_burst_per_min", "backspace_freq", "mouse_velocity"))
        ]
        has_sufficient_post = len(valid_post_stress) >= 2 or len(valid_post_snaps) >= 2

        if not has_sufficient_post or observation_seconds < min_observation_seconds:
            return InterventionEffectiveness(
                intervention_id=intervention.id,
                intervention_type=intervention.intervention_type,
                acknowledged_at=intervention.acknowledged_at,
                evaluated_at=now,
                result=EffectivenessResult.INSUFFICIENT_DATA.value,
                summary="Observation in progress. At least 2 valid post-intervention telemetry snapshots required.",
                score=None,
                has_sufficient_data=False,
                observation_window_mins=observation_window_mins,
                metrics={},
            )

        # 6. Calculate Metric Deltas
        metrics: dict[str, MetricDelta] = {}
        improvements = 0
        declines = 0

        # A. Stress Level (Lower is better)
        pre_stress_val = (
            sum(s.stress_level for s in pre_stress) / len(pre_stress)
            if pre_stress
            else getattr(intervention, "stress_level_at_trigger", 50.0)
        )
        if post_stress:
            post_stress_val = sum(s.stress_level for s in post_stress) / len(post_stress)
            delta = post_stress_val - pre_stress_val
            delta_pct = round((delta / pre_stress_val) * 100, 1) if pre_stress_val > 0 else 0.0
            # Reduction of >= 3 points or >= 5% is improvement
            improved = delta <= -3.0 or delta_pct <= -5.0
            declined = delta >= 4.0 and delta_pct >= 6.0
            if improved:
                improvements += 1
            elif declined:
                declines += 1
            metrics["stress_level"] = MetricDelta(
                before=round(pre_stress_val, 1),
                after=round(post_stress_val, 1),
                delta_pct=delta_pct,
                improved=improved,
            )

        # B. Focus Reserves (Higher is better)
        pre_focus_list = [s.focus_reserves_pct for s in pre_stress if s.focus_reserves_pct is not None]
        post_focus_list = [s.focus_reserves_pct for s in post_stress if s.focus_reserves_pct is not None]
        if pre_focus_list and post_focus_list:
            pre_f_val = sum(pre_focus_list) / len(pre_focus_list)
            post_f_val = sum(post_focus_list) / len(post_focus_list)
            f_delta = post_f_val - pre_f_val
            f_delta_pct = round((f_delta / pre_f_val) * 100, 1) if pre_f_val > 0 else 0.0
            f_improved = f_delta >= 3.0 or f_delta_pct >= 5.0
            f_declined = f_delta <= -5.0 and f_delta_pct <= -7.0
            if f_improved:
                improvements += 1
            elif f_declined:
                declines += 1
            metrics["focus_reserves"] = MetricDelta(
                before=round(pre_f_val, 1),
                after=round(post_f_val, 1),
                delta_pct=f_delta_pct,
                improved=f_improved,
            )

        # C. Typing Speed (WPM) (P5: Noise reduction via baseline-relative threshold)
        pre_wpm_list = [s.typing_speed_wpm for s in pre_snaps if s.typing_speed_wpm is not None]
        post_wpm_list = [s.typing_speed_wpm for s in post_snaps if s.typing_speed_wpm is not None]
        if pre_wpm_list and post_wpm_list:
            pre_wpm_val = sum(pre_wpm_list) / len(pre_wpm_list)
            post_wpm_val = sum(post_wpm_list) / len(post_wpm_list)
            wpm_delta = post_wpm_val - pre_wpm_val
            wpm_delta_pct = round((wpm_delta / pre_wpm_val) * 100, 1) if pre_wpm_val > 0 else 0.0

            # Retrieve baseline for user-relative scaling (~10% of baseline)
            bio_repo = BiometricRepository(self.db)
            baseline = await bio_repo.get_baseline(user_id)
            baseline_wpm = (
                baseline.avg_typing_speed_wpm
                if baseline and baseline.avg_typing_speed_wpm and baseline.avg_typing_speed_wpm > 0
                else (pre_wpm_val if pre_wpm_val > 0 else 60.0)
            )
            # Threshold is ~10% of baseline (with min 5.0 WPM delta)
            wpm_threshold = max(5.0, baseline_wpm * 0.10)

            wpm_improved = wpm_delta >= wpm_threshold and wpm_delta_pct >= 8.0
            wpm_declined = wpm_delta <= -wpm_threshold and wpm_delta_pct <= -8.0
            if wpm_improved:
                improvements += 1
            elif wpm_declined:
                declines += 1
            metrics["typing_speed"] = MetricDelta(
                before=round(pre_wpm_val, 1),
                after=round(post_wpm_val, 1),
                delta_pct=wpm_delta_pct,
                improved=wpm_improved,
            )

        # D. Error Bursts (Lower is better)
        pre_err_list = [s.error_burst_per_min for s in pre_snaps if s.error_burst_per_min is not None]
        post_err_list = [s.error_burst_per_min for s in post_snaps if s.error_burst_per_min is not None]
        if pre_err_list and post_err_list:
            pre_err_val = sum(pre_err_list) / len(pre_err_list)
            post_err_val = sum(post_err_list) / len(post_err_list)
            err_delta = post_err_val - pre_err_val
            err_delta_pct = round((err_delta / max(pre_err_val, 0.1)) * 100, 1)
            err_improved = err_delta <= -0.4 or (pre_err_val > 0.5 and post_err_val < pre_err_val)
            err_declined = err_delta >= 0.8
            if err_improved:
                improvements += 1
            elif err_declined:
                declines += 1
            metrics["error_bursts"] = MetricDelta(
                before=round(pre_err_val, 2),
                after=round(post_err_val, 2),
                delta_pct=err_delta_pct,
                improved=err_improved,
            )

        # E. Backspace Frequency (Lower is better)
        pre_bs_list = [s.backspace_freq for s in pre_snaps if s.backspace_freq is not None]
        post_bs_list = [s.backspace_freq for s in post_snaps if s.backspace_freq is not None]
        if pre_bs_list and post_bs_list:
            pre_bs_val = sum(pre_bs_list) / len(pre_bs_list)
            post_bs_val = sum(post_bs_list) / len(post_bs_list)
            bs_delta = post_bs_val - pre_bs_val
            bs_delta_pct = round((bs_delta / max(pre_bs_val, 1.0)) * 100, 1)
            bs_improved = bs_delta <= -2.0 or bs_delta_pct <= -12.0
            bs_declined = bs_delta >= 4.0
            if bs_improved:
                improvements += 1
            elif bs_declined:
                declines += 1
            metrics["backspace_freq"] = MetricDelta(
                before=round(pre_bs_val, 1),
                after=round(post_bs_val, 1),
                delta_pct=bs_delta_pct,
                improved=bs_improved,
            )

        # 7. Synthesize Composite Result
        if len(metrics) == 0:
            return InterventionEffectiveness(
                intervention_id=intervention.id,
                intervention_type=intervention.intervention_type,
                acknowledged_at=intervention.acknowledged_at,
                evaluated_at=now,
                result=EffectivenessResult.INSUFFICIENT_DATA.value,
                summary="No comparative telemetry metrics available in observation window.",
                score=None,
                has_sufficient_data=False,
                observation_window_mins=observation_window_mins,
                metrics={},
            )

        # Result mapping
        stress_metric = metrics.get("stress_level")
        if stress_metric and stress_metric.improved and declines == 0:
            result = EffectivenessResult.IMPROVED.value
        elif improvements > declines and improvements >= 1:
            result = EffectivenessResult.IMPROVED.value
        elif declines > improvements:
            result = EffectivenessResult.DECLINED.value
        else:
            result = EffectivenessResult.STABLE.value

        # Score computation (0 - 100)
        score = 50.0
        if stress_metric:
            if stress_metric.improved:
                score += min(25.0, abs(stress_metric.delta_pct or 0.0) * 1.2)
            elif stress_metric.improved is False:
                score -= min(25.0, abs(stress_metric.delta_pct or 0.0) * 1.2)
        if "focus_reserves" in metrics and metrics["focus_reserves"].improved:
            score += 15.0
        if "typing_speed" in metrics and metrics["typing_speed"].improved:
            score += 10.0
        score = max(0.0, min(100.0, round(score, 1)))

        # Explainable, non-medical summary
        summary_parts = []
        if stress_metric and stress_metric.delta_pct is not None:
            direction = "decreased" if stress_metric.delta_pct < 0 else "increased"
            summary_parts.append(f"Stress {direction} by {abs(stress_metric.delta_pct):.1f}%")
        if "typing_speed" in metrics and metrics["typing_speed"].delta_pct is not None:
            w_dir = "stabilized" if metrics["typing_speed"].improved else "slowed"
            summary_parts.append(f"typing speed {w_dir} ({metrics['typing_speed'].delta_pct:+.1f}%)")
        if "focus_reserves" in metrics and metrics["focus_reserves"].delta_pct is not None:
            f_dir = "grew" if metrics["focus_reserves"].improved else "dipped"
            summary_parts.append(f"focus reserves {f_dir} ({metrics['focus_reserves'].delta_pct:+.1f}%)")

        clause = ", and ".join(summary_parts) if summary_parts else "Telemetry metrics collected"
        if result == EffectivenessResult.IMPROVED.value:
            summary = f"{clause} relative to pre-intervention baseline, showing cognitive recovery."
        elif result == EffectivenessResult.DECLINED.value:
            summary = f"{clause} relative to pre-intervention baseline; additional pacing may be needed."
        else:
            summary = f"{clause}; cognitive and behavioral indicators remained stable."

        # 8. Persist results for caching
        try:
            intervention.effectiveness_result = result
            intervention.effectiveness_score = score
            intervention.effectiveness_evaluated_at = now
            intervention.effectiveness_metrics = json.dumps({k: v.model_dump() for k, v in metrics.items()})
            intervention.effectiveness_summary = summary
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to persist effectiveness cache for intervention {intervention_id}: {e}")

        return InterventionEffectiveness(
            intervention_id=intervention.id,
            intervention_type=intervention.intervention_type,
            acknowledged_at=intervention.acknowledged_at,
            evaluated_at=now,
            result=result,
            summary=summary,
            score=score,
            has_sufficient_data=True,
            observation_window_mins=observation_window_mins,
            metrics=metrics,
        )

    async def get_latest_effectiveness(
        self,
        user_id: int,
    ) -> Optional[InterventionEffectiveness]:
        """
        Fetch effectiveness for the user's most recently completed intervention.
        """
        query = (
            select(Intervention)
            .where(
                Intervention.user_id == user_id,
                Intervention.was_acknowledged == True,
            )
            .order_by(desc(Intervention.acknowledged_at))
            .limit(1)
        )
        res = await self.db.execute(query)
        latest = res.scalar_one_or_none()
        if not latest:
            return None

        return await self.calculate_effectiveness(latest.id, user_id)
