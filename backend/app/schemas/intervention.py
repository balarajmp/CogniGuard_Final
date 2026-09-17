from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field


class InterventionSeverity(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InterventionPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class DeliveryChannel(str, Enum):
    IN_APP_BANNER = "IN_APP_BANNER"
    IN_APP_MODAL = "IN_APP_MODAL"
    AUDIO_CHIME = "AUDIO_CHIME"
    SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION"
    FULLSCREEN_OVERLAY = "FULLSCREEN_OVERLAY"


class InterventionDecision(BaseModel):
    intervention_needed: bool
    severity: str = InterventionSeverity.NONE.value
    intervention_type: str = "none"
    title: str = "Cognitive State Normal"
    message: str = "You are currently within healthy cognitive load parameters."
    reason: str = "Normal cognitive indicators observed."
    priority: str = InterventionPriority.LOW.value
    confidence: float = 1.0
    recommended_duration_mins: int = 0
    delivery_channels: list[str] = Field(default_factory=list)
    cooldown_active: bool = False
    cooldown_remaining_seconds: int = 0
    active_intervention_id: Optional[int] = None
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InterventionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    triggered_at: datetime
    intervention_type: str
    message: str
    stress_level_at_trigger: float
    risk_tier_at_trigger: str
    severity: Optional[str] = "MODERATE"
    priority: Optional[str] = "MEDIUM"
    confidence: Optional[float] = 1.0
    recommended_duration_mins: Optional[int] = 5
    delivery_channel: Optional[str] = "IN_APP_BANNER"
    reason: Optional[str] = None
    was_acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    was_dismissed: bool = False
    dismissed_at: Optional[datetime] = None
    dismissal_reason: Optional[str] = None
    was_aborted: bool = False
    aborted_at: Optional[datetime] = None
    abort_reason: Optional[str] = None
    effectiveness_result: Optional[str] = None
    effectiveness_score: Optional[float] = None
    effectiveness_evaluated_at: Optional[datetime] = None
    effectiveness_summary: Optional[str] = None
    decision_context: Optional[str] = None


class InterventionMLTuple(BaseModel):
    """
    ML dataset-ready representation of an intervention:
    State (s) -> Action (a) -> User Response (u) -> Outcome (r, ΔM).
    """
    intervention_id: int
    user_id: int
    triggered_at: Optional[str] = None
    state: dict[str, Any] = Field(default_factory=dict)
    action: dict[str, Any] = Field(default_factory=dict)
    user_response: str = "pending"  # completed, dismissed, aborted, pending
    outcome: dict[str, Any] = Field(default_factory=dict)


class AcknowledgeIntervention(BaseModel):
    intervention_id: int


class DismissIntervention(BaseModel):
    intervention_id: int
    reason: Optional[str] = None


class AbortIntervention(BaseModel):
    intervention_id: int
    reason: Optional[str] = "User exited recovery early"


class EffectivenessResult(str, Enum):
    IMPROVED = "IMPROVED"
    STABLE = "STABLE"
    DECLINED = "DECLINED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class MetricDelta(BaseModel):
    before: Optional[float] = None
    after: Optional[float] = None
    delta_pct: Optional[float] = None
    improved: Optional[bool] = None


class InterventionEffectiveness(BaseModel):
    intervention_id: int
    intervention_type: str
    acknowledged_at: Optional[datetime] = None
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    result: str = EffectivenessResult.INSUFFICIENT_DATA.value
    summary: str = "Awaiting post-recovery telemetry observation."
    score: Optional[float] = None
    has_sufficient_data: bool = False
    observation_window_mins: float = 0.0
    metrics: dict[str, MetricDelta] = Field(default_factory=dict)

