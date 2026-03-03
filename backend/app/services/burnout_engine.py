from __future__ import annotations
from dataclasses import dataclass
from app.core.config import settings
from app.models.biometric import BaselineMetrics, BiometricSnapshot
from app.schemas.stress import BurnoutRiskResult

# Intervention messages per type
INTERVENTION_MESSAGES = {
    "breathing": "Your stress indicators are elevated. Take 2 minutes: 4 counts in, hold 4, out 6.",
    "micro_break": "You've been in deep focus for a while. Step away for 5 minutes. Stretch and rest your eyes.",
    "hydration": "Cognitive load spike detected. Drink a glass of water and take a short walk.",
    "walk": "Critical burnout risk detected. Take an immediate 10-minute walk before continuing.",
}


@dataclass
class ScoringWeights:
    heart_rate: float = 0.25
    hrv: float = 0.20
    facial_fatigue: float = 0.20
    typing_speed: float = 0.15
    ambient_noise: float = 0.10
    error_burst: float = 0.10


class BurnoutEngine:
    """
    Computes a normalized stress level (0-100) from multi-modal biometric signals.
    Personalizes scores against user baseline when available.
    """

    WEIGHTS = ScoringWeights()

    def compute(
        self,
        snapshot: BiometricSnapshot,
        baseline: BaselineMetrics | None,
    ) -> BurnoutRiskResult:
        score = self._score(snapshot, baseline)
        risk_tier = self._classify(score)
        focus_reserves = max(0.0, 100.0 - score)
        burnout_risk = min(100.0, score * 1.15)  # slight amplification
        intervention_needed = score >= settings.STRESS_THRESHOLD_MODERATE
        intervention_type, message = self._pick_intervention(score) if intervention_needed else (None, None)

        return BurnoutRiskResult(
            stress_level=round(score, 2),
            burnout_risk_pct=round(burnout_risk, 2),
            focus_reserves_pct=round(focus_reserves, 2),
            risk_tier=risk_tier,
            intervention_needed=intervention_needed,
            intervention_type=intervention_type,
            intervention_message=message,
        )

    def _score(self, s: BiometricSnapshot, b: BaselineMetrics | None) -> float:
        score = 0.0
        w = self.WEIGHTS

        # Heart Rate: higher than baseline = more stress
        if s.heart_rate_bpm is not None:
            baseline_hr = b.avg_heart_rate_bpm if b else 70.0
            hr_ratio = (s.heart_rate_bpm - baseline_hr) / max(baseline_hr, 1)
            score += self._clamp(hr_ratio * 100, 0, 100) * w.heart_rate

        # HRV: lower HRV = higher stress (inverted)
        if s.hrv_ms is not None:
            baseline_hrv = b.avg_hrv_ms if b else 45.0
            hrv_ratio = (baseline_hrv - s.hrv_ms) / max(baseline_hrv, 1)
            score += self._clamp(hrv_ratio * 100, 0, 100) * w.hrv

        # Facial Fatigue: direct score 0-1, scale to 0-100
        if s.facial_fatigue_score is not None:
            score += s.facial_fatigue_score * 100 * w.facial_fatigue

        # Typing Speed: slower than baseline = more stress
        if s.typing_speed_wpm is not None:
            baseline_wpm = b.avg_typing_speed_wpm if b else 60.0
            wpm_ratio = (baseline_wpm - s.typing_speed_wpm) / max(baseline_wpm, 1)
            score += self._clamp(wpm_ratio * 100, 0, 100) * w.typing_speed

        # Ambient Noise: above 65dB is stressful
        if s.ambient_noise_db is not None:
            noise_score = self._clamp((s.ambient_noise_db - 40) / 60 * 100, 0, 100)
            score += noise_score * w.ambient_noise

        # Error Burst: higher errors = more stress
        if s.error_burst_per_min is not None:
            baseline_err = b.avg_error_burst_per_min if b else 0.5
            err_ratio = (s.error_burst_per_min - baseline_err) / max(baseline_err, 1)
            score += self._clamp(err_ratio * 100, 0, 100) * w.error_burst

        return self._clamp(score, 0.0, 100.0)

    def _classify(self, score: float) -> str:
        if score >= settings.STRESS_THRESHOLD_CRITICAL:
            return "critical"
        if score >= settings.STRESS_THRESHOLD_HIGH:
            return "high"
        if score >= settings.STRESS_THRESHOLD_MODERATE:
            return "moderate"
        return "low"

    def _pick_intervention(self, score: float) -> tuple[str, str]:
        if score >= settings.STRESS_THRESHOLD_CRITICAL:
            itype = "walk"
        elif score >= settings.STRESS_THRESHOLD_HIGH:
            itype = "micro_break"
        elif score >= settings.STRESS_THRESHOLD_MODERATE:
            itype = "breathing"
        else:
            itype = "hydration"
        return itype, INTERVENTION_MESSAGES[itype]

    @staticmethod
    def _clamp(value: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, value))


burnout_engine = BurnoutEngine()
