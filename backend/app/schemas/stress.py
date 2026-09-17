from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StressHistoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    snapshot_id: Optional[int]
    recorded_at: datetime
    stress_level: float
    burnout_risk_pct: float
    focus_reserves_pct: float
    risk_tier: str


class BurnoutRiskResult(BaseModel):
    stress_level: float
    burnout_risk_pct: float
    focus_reserves_pct: float
    risk_tier: str
    intervention_needed: bool
    intervention_type: Optional[str] = None
    intervention_message: Optional[str] = None


from app.schemas.intervention import (
    InterventionResponse,
    AcknowledgeIntervention,
    DismissIntervention,
    InterventionDecision,
    InterventionSeverity,
    InterventionPriority,
    DeliveryChannel,
)


class DailyAverageItem(BaseModel):
    date: str
    avg_stress_level: float
    avg_burnout_risk_pct: float
    avg_focus_reserves_pct: float
    count: int


class BurnoutForecastResponse(BaseModel):
    forecast_points: list[float]
    estimated_depletion_hours: Optional[float] = None

