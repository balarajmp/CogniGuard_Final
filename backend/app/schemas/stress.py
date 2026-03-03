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


class InterventionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    triggered_at: datetime
    intervention_type: str
    message: str
    stress_level_at_trigger: float
    risk_tier_at_trigger: str
    was_acknowledged: bool
    acknowledged_at: Optional[datetime]


class AcknowledgeIntervention(BaseModel):
    intervention_id: int
