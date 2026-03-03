from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BiometricIngest(BaseModel):
    typing_speed_wpm: Optional[float] = Field(None, ge=0, le=300)
    heart_rate_bpm: Optional[float] = Field(None, ge=20, le=220)
    hrv_ms: Optional[float] = Field(None, ge=0, le=200)
    facial_fatigue_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    ambient_noise_db: Optional[float] = Field(None, ge=0, le=130)
    luminance_pct: Optional[float] = Field(None, ge=0, le=100)
    error_burst_per_min: Optional[float] = Field(None, ge=0)


class BaselineMetricsResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    avg_typing_speed_wpm: float
    avg_heart_rate_bpm: float
    avg_hrv_ms: float
    avg_facial_fatigue_score: float
    avg_ambient_noise_db: float
    avg_luminance_pct: float
    avg_error_burst_per_min: float
    updated_at: datetime


class BiometricSnapshotResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    captured_at: datetime
    typing_speed_wpm: Optional[float]
    heart_rate_bpm: Optional[float]
    hrv_ms: Optional[float]
    facial_fatigue_score: Optional[float]
    ambient_noise_db: Optional[float]
    luminance_pct: Optional[float]
    error_burst_per_min: Optional[float]
