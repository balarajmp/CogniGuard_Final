from __future__ import annotations
from sqlalchemy import Float, DateTime, ForeignKey, func, Integer, String, Boolean, Column
from sqlalchemy.orm import relationship
from app.db.session import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    intervention_type = Column(String(50), nullable=False)
    message = Column(String(500), nullable=False)
    stress_level_at_trigger = Column(Float, nullable=False)
    risk_tier_at_trigger = Column(String(20), nullable=False)
    was_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="interventions")
