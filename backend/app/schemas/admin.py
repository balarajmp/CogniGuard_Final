"""
admin.py – Pydantic schemas for the Phase 8 Enterprise Admin Dashboard API.
All schemas are read-only aggregations; no personal data is exposed in lists.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Module 1 – Executive Overview
# ---------------------------------------------------------------------------

class AdminOverview(BaseModel):
    total_users: int
    active_users: int
    online_users: int
    total_sessions: int
    total_telemetry_records: int
    total_ground_truth_labels: int
    dataset_version: str
    dataset_quality_score: float
    ml_readiness_pct: float
    ml_readiness_status: str          # NOT_READY | PARTIAL | READY
    avg_stress_level: float
    avg_burnout_risk_pct: float
    avg_focus_reserves_pct: float
    avg_cognitive_load_score: float
    burnout_alerts_today: int
    high_risk_users: int
    critical_risk_users: int


# ---------------------------------------------------------------------------
# Module 2 – Live User Monitoring
# ---------------------------------------------------------------------------

class AdminUserRow(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    latest_stress_level: Optional[float] = None
    latest_burnout_risk_pct: Optional[float] = None
    latest_focus_reserves_pct: Optional[float] = None
    latest_risk_tier: Optional[str] = None
    latest_recorded_at: Optional[datetime] = None
    telemetry_count: int = 0
    ground_truth_count: int = 0


class AdminUserListResponse(BaseModel):
    users: list[AdminUserRow]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Module 3 – Advanced Analytics
# ---------------------------------------------------------------------------

class DailyAnalyticsRow(BaseModel):
    date: str
    new_users: int
    active_users: int
    avg_stress_level: float
    avg_burnout_risk_pct: float
    avg_focus_reserves_pct: float
    telemetry_count: int
    ground_truth_count: int


class HeatmapCell(BaseModel):
    hour: int       # 0-23
    weekday: int    # 0=Sunday … 6=Saturday
    count: int


class AnalyticsResponse(BaseModel):
    daily: list[DailyAnalyticsRow]
    heatmap: list[HeatmapCell]


# ---------------------------------------------------------------------------
# Module 4 – AI Analytics (reuses ML dataset pipeline schemas)
# ---------------------------------------------------------------------------

class AIAnalyticsSummary(BaseModel):
    dataset_quality_score: float
    feature_completeness_pct: float
    missing_value_pct: float
    duplicate_pct: float
    outlier_pct: float
    label_completeness_pct: float
    data_consistency_score: float
    total_features: int
    total_labels: int
    total_telemetry: int
    readiness_status: str
    readiness_pct: float
    recommendations: list[str]


# ---------------------------------------------------------------------------
# Module 5 – Machine Learning Center
# ---------------------------------------------------------------------------

class MLCenterStatus(BaseModel):
    dataset_version: str
    current_target: str
    feature_count: int
    label_count: int
    telemetry_count: int
    training_readiness_pct: float
    readiness_status: str
    model_version: Optional[str] = None        # None until trained
    last_training: Optional[datetime] = None
    model_accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    model_trained: bool = False
    waiting_message: str = "Waiting for sufficient dataset."


# ---------------------------------------------------------------------------
# Module 6 – Telemetry Center
# ---------------------------------------------------------------------------

class TelemetryLiveStats(BaseModel):
    total_records: int
    records_today: int
    avg_mouse_velocity: Optional[float] = None
    avg_mouse_clicks_per_snapshot: Optional[float] = None
    avg_typing_cadence_ms: Optional[float] = None
    avg_scroll_distance: Optional[float] = None
    avg_idle_time_seconds: Optional[float] = None
    avg_active_session_duration: Optional[float] = None
    avg_focus_blur_events: Optional[float] = None
    avg_page_visibility_changes: Optional[float] = None
    active_ws_connections: int = 0
    snapshots_last_hour: int = 0


# ---------------------------------------------------------------------------
# Module 7 – User Management (profile view)
# ---------------------------------------------------------------------------

class AdminUserDetail(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool
    is_guest: bool
    created_at: datetime
    keyboard_tracking: bool
    heart_rate_telemetry: bool
    facial_fatigue_webcam: bool
    ambient_noise_mapping: bool
    telemetry_count: int
    ground_truth_count: int
    stress_records_count: int
    latest_risk_tier: Optional[str] = None


# ---------------------------------------------------------------------------
# Module 8 – Database Dashboard
# ---------------------------------------------------------------------------

class TableStat(BaseModel):
    table_name: str
    row_count: int
    estimated_size_kb: float


class DBStats(BaseModel):
    db_file_size_mb: float
    page_count: int
    page_size_bytes: int
    free_pages: int
    tables: list[TableStat]
    total_rows: int


# ---------------------------------------------------------------------------
# Module 9 – Reports
# ---------------------------------------------------------------------------

class ReportSummary(BaseModel):
    period: str                 # "daily" | "weekly" | "monthly"
    from_date: str
    to_date: str
    total_active_users: int
    total_telemetry_records: int
    total_ground_truth_labels: int
    avg_stress_level: float
    avg_burnout_risk_pct: float
    avg_focus_reserves_pct: float
    high_risk_count: int
    critical_risk_count: int
    new_users: int
    new_interventions: int


# ---------------------------------------------------------------------------
# Module 10 – Notifications
# ---------------------------------------------------------------------------

class AdminNotification(BaseModel):
    id: int
    category: str          # burnout_alert | stress_alert | new_user | system_error
    severity: str          # info | warning | critical
    title: str
    description: str
    timestamp: datetime
    user_id: Optional[int] = None
    username: Optional[str] = None


class NotificationListResponse(BaseModel):
    notifications: list[AdminNotification]
    unread_count: int


# ---------------------------------------------------------------------------
# Module 11 – Enterprise Insights
# ---------------------------------------------------------------------------

class EnterpriseSummary(BaseModel):
    period: str
    total_users: int
    avg_stress: float
    avg_burnout: float
    avg_focus: float
    high_risk_pct: float
    critical_risk_pct: float
    top_intervention_type: str
    summary_text: str


# ---------------------------------------------------------------------------
# Module 12 – System Health
# ---------------------------------------------------------------------------

class ServiceStatus(BaseModel):
    name: str
    status: str        # healthy | degraded | down
    latency_ms: Optional[float] = None
    detail: Optional[str] = None


class SystemHealthResponse(BaseModel):
    overall_status: str
    services: list[ServiceStatus]
    cpu_pct: float
    memory_pct: float
    memory_used_mb: float
    memory_total_mb: float
    disk_pct: float
    disk_used_gb: float
    disk_total_gb: float
    uptime_seconds: float
    python_version: str
    active_ws_connections: int


# ---------------------------------------------------------------------------
# Module 13 – Admin Settings
# ---------------------------------------------------------------------------

class AdminSettings(BaseModel):
    stress_threshold_moderate: float
    stress_threshold_high: float
    stress_threshold_critical: float
    access_token_expire_minutes: int
    guest_token_expire_minutes: int
    environment: str
    project_name: str


class AdminSettingsUpdate(BaseModel):
    stress_threshold_moderate: Optional[float] = None
    stress_threshold_high: Optional[float] = None
    stress_threshold_critical: Optional[float] = None
