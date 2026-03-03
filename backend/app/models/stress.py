from __future__ import annotations
from sqlalchemy import Float, DateTime, ForeignKey, func, Integer, String, Column
from sqlalchemy.orm import relationship
from app.db.session import Base


class StressHistory(Base):
    __tablename__ = "stress_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_id = Column(Integer, ForeignKey("biometric_snapshots.id", ondelete="SET NULL"), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    stress_level = Column(Float, nullable=False)
    burnout_risk_pct = Column(Float, nullable=False)
    focus_reserves_pct = Column(Float, nullable=False)
    risk_tier = Column(String(20), nullable=False)

    user = relationship("User", back_populates="stress_history")
