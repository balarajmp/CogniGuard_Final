from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BiometricIngest(BaseModel):
    """
    Payload sent from the browser over the WebSocket every 30 seconds.
    Physiological fields are Optional and null when no hardware sensor is available.
    All keyboard data is timing-only — no characters are ever collected.
    """
    # Physiological (null if no hardware sensor)
    typing_speed_wpm: Optional[float] = Field(None, ge=0, le=300)
    heart_rate_bpm: Optional[float] = Field(None, ge=20, le=220)
    hrv_ms: Optional[float] = Field(None, ge=0, le=200)
    facial_fatigue_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    ambient_noise_db: Optional[float] = Field(None, ge=0, le=130)
    luminance_pct: Optional[float] = Field(None, ge=0, le=100)
    error_burst_per_min: Optional[float] = Field(None, ge=0)

    # Mouse telemetry
    mouse_velocity: Optional[float] = Field(None, ge=0)
    mouse_acceleration: Optional[float] = Field(None, ge=0)
    mouse_clicks: Optional[int] = Field(None, ge=0)
    double_clicks: Optional[int] = Field(None, ge=0)
    right_clicks: Optional[int] = Field(None, ge=0)

    # Keyboard telemetry (timing only)
    typing_cadence_ms: Optional[float] = Field(None, ge=0)
    inter_key_delay_var: Optional[float] = Field(None, ge=0)
    key_hold_duration_avg: Optional[float] = Field(None, ge=0)
    backspace_freq: Optional[float] = Field(None, ge=0)
    typing_speed_variance: Optional[float] = Field(None, ge=0)

    # Scroll telemetry
    scroll_distance: Optional[float] = Field(None, ge=0)
    scroll_speed: Optional[float] = Field(None, ge=0)
    scroll_acceleration: Optional[float] = Field(None, ge=0)

    # Browser / session
    focus_blur_events: Optional[int] = Field(None, ge=0)
    page_visibility_changes: Optional[int] = Field(None, ge=0)
    idle_time_seconds: Optional[float] = Field(None, ge=0)
    active_session_duration: Optional[float] = Field(None, ge=0)

    # Ground-truth label (only present when user submits via slider during this window)
    user_reported_stress: Optional[int] = Field(None, ge=1, le=5)


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

    # Mouse
    mouse_velocity: Optional[float]
    mouse_acceleration: Optional[float]
    mouse_clicks: Optional[int]
    double_clicks: Optional[int]
    right_clicks: Optional[int]

    # Keyboard
    typing_cadence_ms: Optional[float]
    inter_key_delay_var: Optional[float]
    key_hold_duration_avg: Optional[float]
    backspace_freq: Optional[float]
    typing_speed_variance: Optional[float]

    # Scroll
    scroll_distance: Optional[float]
    scroll_speed: Optional[float]
    scroll_acceleration: Optional[float]

    # Browser / session
    focus_blur_events: Optional[int]
    page_visibility_changes: Optional[int]
    idle_time_seconds: Optional[float]
    active_session_duration: Optional[float]
    user_reported_stress: Optional[int]


class BiometricCalibrationRequest(BaseModel):
    typing_intervals: list[float] = Field(..., description="Keystroke interval timings in milliseconds during task")
    heart_rates: list[float] = Field(..., description="Heart rate readouts during calibration")
    hrv_ms: Optional[float] = 45.0
    facial_fatigue_score: Optional[float] = 0.1
    ambient_noise_db: Optional[float] = 40.0
    luminance_pct: Optional[float] = 50.0
    error_burst_per_min: Optional[float] = 0.5


# ─── Ground-Truth Label Schemas ────────────────────────────────────────────────

class GroundTruthLabelCreate(BaseModel):
    """Posted by the frontend periodic check-in prompt."""
    stress_level: int = Field(..., ge=1, le=5, description="1=Very Relaxed, 5=Highly Stressed")
    fatigue_level: Optional[int] = Field(None, ge=1, le=5)
    focus_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=200)


class GroundTruthLabelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    timestamp: datetime
    stress_level: int
    fatigue_level: Optional[int]
    focus_level: Optional[int]
    notes: Optional[str]
