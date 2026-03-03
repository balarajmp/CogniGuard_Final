from __future__ import annotations
from sqlalchemy import Float, DateTime, ForeignKey, func, Integer, Column
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
    __tablename__ = "biometric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
    typing_speed_wpm = Column(Float, nullable=True)
    heart_rate_bpm = Column(Float, nullable=True)
    hrv_ms = Column(Float, nullable=True)
    facial_fatigue_score = Column(Float, nullable=True)
    ambient_noise_db = Column(Float, nullable=True)
    luminance_pct = Column(Float, nullable=True)
    error_burst_per_min = Column(Float, nullable=True)
