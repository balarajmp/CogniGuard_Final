from __future__ import annotations
from pydantic import BaseModel


class DepartmentRiskSummary(BaseModel):
    """Anonymized department-level stress aggregation."""
    department: str
    total_users: int
    avg_stress_level: float
    avg_burnout_risk_pct: float
    avg_focus_reserves_pct: float
    high_risk_user_count: int     # anonymized count, not IDs
    critical_risk_user_count: int
    active_interventions: int


class GlobalRiskSummary(BaseModel):
    """Platform-wide burnout risk overview."""
    total_active_users: int
    avg_stress_level: float
    avg_burnout_risk_pct: float
    high_risk_count: int
    critical_risk_count: int
    departments: list[DepartmentRiskSummary]
