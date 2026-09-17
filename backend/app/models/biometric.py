from __future__ import annotations
from sqlalchemy import Float, DateTime, ForeignKey, func, Integer, Column, Index, String, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class BaselineMetrics(Base):
    __tablename__ = "baseline_metrics"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    avg_typing_speed_wpm = Column(Float, default=60.0)
    avg_heart_rate_bpm = Column(Float, default=70.0)
    avg_hrv_ms = Column(Float, default=45.0)
    avg_facial_fatigue_score = Column(Float, default=0.1)
    avg_ambient_noise_db = Column(Float, default=40.0)
    avg_luminance_pct = Column(Float, default=50.0)
    avg_error_burst_per_min = Column(Float, default=0.5)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="baseline_metrics")


class BiometricSnapshot(Base):
    """
    One 30-second aggregated window of real behavioral telemetry.
    Physiological fields (heart_rate_bpm, hrv_ms) are optional; they are only
    populated when a real hardware sensor provides them. The burnout engine
    skips null fields gracefully.
    """
    __tablename__ = "biometric_snapshots"

    __table_args__ = (
        Index("ix_biometric_snapshots_user_id_captured_at", "user_id", "captured_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Physiological (sensor-provided; null when no hardware sensor) ---
    typing_speed_wpm = Column(Float, nullable=True)
    heart_rate_bpm = Column(Float, nullable=True)
    hrv_ms = Column(Float, nullable=True)
    facial_fatigue_score = Column(Float, nullable=True)
    ambient_noise_db = Column(Float, nullable=True)
    luminance_pct = Column(Float, nullable=True)
    error_burst_per_min = Column(Float, nullable=True)

    # --- Mouse telemetry (real browser events) ---
    mouse_velocity = Column(Float, nullable=True)          # avg pixels/ms
    mouse_acceleration = Column(Float, nullable=True)      # avg velocity delta / ms
    mouse_clicks = Column(Integer, nullable=True)          # left click count
    double_clicks = Column(Integer, nullable=True)         # dblclick count
    right_clicks = Column(Integer, nullable=True)          # contextmenu count

    # --- Keyboard telemetry (timing only; no characters stored) ---
    typing_cadence_ms = Column(Float, nullable=True)       # avg inter-key delay (ms)
    inter_key_delay_var = Column(Float, nullable=True)     # variance of inter-key delays
    key_hold_duration_avg = Column(Float, nullable=True)   # avg key hold time (ms)
    backspace_freq = Column(Float, nullable=True)          # backspace/delete per minute
    typing_speed_variance = Column(Float, nullable=True)   # WPM variance within window

    # --- Scroll telemetry ---
    scroll_distance = Column(Float, nullable=True)         # total pixels scrolled
    scroll_speed = Column(Float, nullable=True)            # avg pixels/ms
    scroll_acceleration = Column(Float, nullable=True)     # avg speed delta / ms

    # --- Browser / session ---
    focus_blur_events = Column(Integer, nullable=True)     # window focus/blur count
    page_visibility_changes = Column(Integer, nullable=True)
    idle_time_seconds = Column(Float, nullable=True)
    active_session_duration = Column(Float, nullable=True) # seconds since session start

    # --- Ground-truth label attached to this snapshot (user-submitted via slider) ---
    user_reported_stress = Column(Integer, nullable=True)  # 1-5; null if not submitted


class UserGroundTruthLabel(Base):
    """
    Dedicated table for timed self-report labels submitted via the periodic
    check-in prompt. These are the primary supervised learning targets for
    the future XGBoost model.
    """
    __tablename__ = "user_ground_truth_labels"

    __table_args__ = (
        Index("ix_ground_truth_user_id_timestamp", "user_id", "timestamp"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Required
    stress_level = Column(Integer, nullable=False)         # 1 = Very Relaxed … 5 = Highly Stressed

    # Optional enrichment signals
    fatigue_level = Column(Integer, nullable=True)         # 1-5
    focus_level = Column(Integer, nullable=True)           # 1-5

    # Short free-text note (not used for ML; stored for human review only)
    notes = Column(String(200), nullable=True)

    user = relationship("User", back_populates="ground_truth_labels")
