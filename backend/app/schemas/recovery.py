from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── G-R10 — Recovery Usage Insights DTOs ──────────────────────────────────────

class ActivityUsageDTO(BaseModel):
    """Per-activity usage breakdown derived from completed recovery sessions."""
    activity_id: str
    activity_title: str
    activity_type: str
    session_count: int
    completed_count: int
    total_elapsed_seconds: int
    average_elapsed_seconds: float


class RecoveryPatternDTO(BaseModel):
    """Observed usage frequency by time-of-day bucket (purely observational, no ML)."""
    hour_bucket: str  # e.g. "morning", "afternoon", "evening", "night"
    session_count: int


class RecoverySummaryDTO(BaseModel):
    """
    Aggregate recovery usage summary for the authenticated user.
    All fields are computed from real recovery_sessions records.
    No fabricated or estimated values.
    """
    total_sessions: int
    completed_sessions: int
    aborted_sessions: int
    active_sessions: int
    completion_rate_pct: float  # 0–100, rounded to 1 dp
    total_elapsed_seconds: int  # across all sessions
    total_completed_elapsed_seconds: int  # completed only
    average_completed_duration_seconds: float  # avg of completed sessions
    most_used_activity_id: Optional[str] = None
    most_used_activity_title: Optional[str] = None
    activity_breakdown: list[ActivityUsageDTO]
    time_of_day_patterns: list[RecoveryPatternDTO]
    streak_days: int  # consecutive calendar days with ≥1 completed session (up to today)
    sessions_this_week: int  # ISO week of today, completed + aborted


# ── G-R9 — Session Tracking DTOs ──────────────────────────────────────────────

class RecoverySessionCreate(BaseModel):
    activity_id: str = Field(..., min_length=1, max_length=100, description="Catalog activity ID")
    activity_type: str = Field(..., min_length=1, max_length=50, description="Activity type enum string")
    activity_title: str = Field(..., min_length=1, max_length=255, description="Display title")
    guided_content_id: Optional[str] = Field(None, max_length=100, description="Selected guided content ID if any")
    video_id: Optional[str] = Field(None, max_length=100, description="YouTube or media video ID if any")
    planned_duration_seconds: int = Field(..., ge=1, description="Planned total duration in seconds")


class RecoverySessionComplete(BaseModel):
    elapsed_duration_seconds: int = Field(..., ge=0, description="Actual elapsed duration in seconds")
    completion_reason: Optional[str] = Field("completed", max_length=255, description="Reason or context for completion")


class RecoverySessionAbort(BaseModel):
    elapsed_duration_seconds: int = Field(..., ge=0, description="Actual elapsed duration in seconds prior to abort")
    completion_reason: Optional[str] = Field("aborted", max_length=255, description="Reason for abort/early exit")


class RecoverySessionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    activity_id: str
    activity_type: str
    activity_title: str
    guided_content_id: Optional[str] = None
    video_id: Optional[str] = None
    session_start: datetime
    session_end: Optional[datetime] = None
    planned_duration_seconds: int
    elapsed_duration_seconds: int
    status: str
    completion_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
