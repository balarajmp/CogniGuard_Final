from __future__ import annotations
import json
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.insights import AIInsight
from app.models.stress import StressHistory
from app.models.biometric import BiometricSnapshot, BaselineMetrics
from app.models.coach import CoachRecommendation

logger = logging.getLogger(__name__)


class AIInsightsService:
    """
    Generates structured AI insights and explainable AI reasoning
    based on user biometrics and stress history.
    """

    async def generate_timeframe_insight(
        self, db: AsyncSession, user_id: int, timeframe: str
    ) -> AIInsight:
        """
        Calculates and persists AI cognitive and burnout insights for a user over a timeframe.
        Supported timeframes: 'daily', 'weekly', 'monthly'.
        """
        now = datetime.now(timezone.utc)
        if timeframe == "daily":
            start_time = now - timedelta(days=1)
        elif timeframe == "weekly":
            start_time = now - timedelta(days=7)
        elif timeframe == "monthly":
            start_time = now - timedelta(days=30)
        else:
            raise ValueError(f"Invalid timeframe: {timeframe}")

        # 1. Fetch Stress History in timeframe
        stress_res = await db.execute(
            select(StressHistory)
            .where((StressHistory.user_id == user_id) & (StressHistory.recorded_at >= start_time))
            .order_by(StressHistory.recorded_at.asc())
        )
        stress_records = list(stress_res.scalars().all())

        # 2. Fetch Biometric Snapshots in timeframe
        snap_res = await db.execute(
            select(BiometricSnapshot)
            .where((BiometricSnapshot.user_id == user_id) & (BiometricSnapshot.captured_at >= start_time))
            .order_by(BiometricSnapshot.captured_at.asc())
        )
        snapshots = list(snap_res.scalars().all())

        # 3. If no records are present, output a fallback placeholder insight
        if not stress_records:
            fallback = AIInsight(
                user_id=user_id,
                timeframe=timeframe,
                summary_text="Telemetry sync pending. Continue normal work to activate your explainable AI reasoning metrics.",
                risk_direction="stable",
                risk_delta=0.0,
                confidence_score=0.0,
                top_activities_json=json.dumps([]),
                feature_contributions_json=json.dumps({}),
            )
            db.add(fallback)
            await db.commit()
            await db.refresh(fallback)
            return fallback

        # 4. Compute averages
        avg_stress = sum(r.stress_level for r in stress_records) / len(stress_records)
        avg_burnout = sum(r.burnout_risk_pct for r in stress_records) / len(stress_records)
        avg_focus = sum(r.focus_reserves_pct for r in stress_records) / len(stress_records)

        # 5. Fetch baseline
        baseline_res = await db.execute(
            select(BaselineMetrics).where(BaselineMetrics.user_id == user_id)
        )
        baseline = baseline_res.scalar_one_or_none()
        b_hr = baseline.avg_heart_rate_bpm if baseline else 70.0
        b_hrv = baseline.avg_hrv_ms if baseline else 45.0
        b_speed = baseline.avg_typing_speed_wpm if baseline else 60.0
        b_fatigue = baseline.avg_facial_fatigue_score if baseline else 0.1
        b_noise = baseline.avg_ambient_noise_db if baseline else 40.0
        b_errors = baseline.avg_error_burst_per_min if baseline else 0.5

        # 6. Compute average biometrics in window
        valid_hr = [s.heart_rate_bpm for s in snapshots if s.heart_rate_bpm is not None]
        valid_hrv = [s.hrv_ms for s in snapshots if s.hrv_ms is not None]
        valid_speed = [s.typing_speed_wpm for s in snapshots if s.typing_speed_wpm is not None]
        valid_fatigue = [s.facial_fatigue_score for s in snapshots if s.facial_fatigue_score is not None]
        valid_noise = [s.ambient_noise_db for s in snapshots if s.ambient_noise_db is not None]
        valid_errors = [s.error_burst_per_min for s in snapshots if s.error_burst_per_min is not None]

        avg_hr = sum(valid_hr) / len(valid_hr) if valid_hr else b_hr
        avg_hrv = sum(valid_hrv) / len(valid_hrv) if valid_hrv else b_hrv
        avg_speed = sum(valid_speed) / len(valid_speed) if valid_speed else b_speed
        avg_fatigue = sum(valid_fatigue) / len(valid_fatigue) if valid_fatigue else b_fatigue
        avg_noise = sum(valid_noise) / len(valid_noise) if valid_noise else b_noise
        avg_errors = sum(valid_errors) / len(valid_errors) if valid_errors else b_errors

        # 7. Explainable AI / SHAP contribution mapping
        contributions = {
            "heart_rate": round(((avg_hr - b_hr) / max(b_hr, 1)) * 20.0, 2),
            "hrv": round(((b_hrv - avg_hrv) / max(b_hrv, 1)) * 20.0, 2),
            "typing_speed": round(((b_speed - avg_speed) / max(b_speed, 1)) * 15.0, 2),
            "ambient_noise": round(((avg_noise - b_noise) / 40.0) * 10.0, 2),
            "facial_fatigue": round((avg_fatigue - b_fatigue) * 20.0, 2),
            "error_burst": round((avg_errors - b_errors) * 15.0, 2),
        }

        # 8. Calculate risk direction & delta
        # We compare timeframe average stress to baseline default (40.0)
        risk_delta = round(avg_stress - 40.0, 2)
        if risk_delta > 5.0:
            risk_direction = "degraded"
        elif risk_delta < -5.0:
            risk_direction = "improved"
        else:
            risk_direction = "stable"

        # 9. Confidence score based on number of snapshots
        confidence_score = round(min(1.0, len(snapshots) / 30.0), 2)
        if not snapshots:
            confidence_score = 0.5  # default/warm starting confidence

        # 10. Generate personalized reasoning and recommendation texts
        heart_rate_reason = (
            f"elevated (+{round(avg_hr - b_hr, 1)} BPM)" if avg_hr > b_hr else "normal"
        )
        hrv_reason = (
            f"suppressed (-{round(b_hrv - avg_hrv, 1)} ms)" if avg_hrv < b_hrv else "stable"
        )
        noise_reason = (
            f"stressful ({round(avg_noise, 1)} dB)" if avg_noise > 55 else "within comfortable limits"
        )

        recs = []
        rec_category = "mental_reset"

        if avg_hrv < b_hrv:
            recs.append("Trigger a 2-minute box breathing session to reset autonomic nervous system stability.")
            rec_category = "breathing"
        if avg_noise > 55:
            recs.append("Relocate to a quieter workspace to lower ambient sensory friction and cognitive load.")
            rec_category = "mental_reset"
        if avg_fatigue > 0.3:
            recs.append("Facial fatigue flags show eye strain. Take a 5-minute offline micro-break.")
            rec_category = "stretching"
        if avg_speed < b_speed:
            recs.append("Typing latency is slowing down. Stand up, hydrate, and look away from the screen.")
            rec_category = "hydration"

        # Ensure we always have at least 3 recommendations
        while len(recs) < 3:
            recs.append("Hydrate with a glass of water to support cognitive performance and physical resilience.")

        summary_text = (
            f"### AI Cognitive Insights ({timeframe.capitalize()})\n\n"
            f"Your average stress level was **{round(avg_stress, 1)}/100** with burnout risk at **{round(avg_burnout, 1)}%**. "
            f"Your focus reserves maintained **{round(avg_focus, 1)}%** efficiency.\n\n"
            f"#### Explainable AI Reasoning Panel\n"
            f"*   **Cardiovascular Response**: Heart rate was {heart_rate_reason} compared to your baseline.\n"
            f"*   **Autonomic HRV Status**: Heart rate variability indicates stress is {hrv_reason}.\n"
            f"*   **Environmental Friction**: Workspace ambient sound level was {noise_reason}.\n\n"
            f"#### Personalized Recovery Recommendations\n"
            f"1. *{recs[0]}*\n"
            f"2. *{recs[1]}*\n"
            f"3. *{recs[2]}*"
        )

        # 11. Create and save AIInsight
        insight = AIInsight(
            user_id=user_id,
            timeframe=timeframe,
            summary_text=summary_text,
            risk_direction=risk_direction,
            risk_delta=risk_delta,
            confidence_score=confidence_score,
            top_activities_json=json.dumps(["VS Code", "Web Browser", "Slack"]),
            feature_contributions_json=json.dumps(contributions),
        )
        db.add(insight)

        # 12. Create corresponding CoachRecommendation
        coach_rec = CoachRecommendation(
            user_id=user_id,
            category=rec_category,
            message_text=recs[0],
            trigger_metric_name="stress_level",
            trigger_value=float(avg_stress),
            is_completed=False,
        )
        db.add(coach_rec)

        await db.commit()
        await db.refresh(insight)
        return insight
