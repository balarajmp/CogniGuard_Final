from __future__ import annotations
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_class = Column(String(50), nullable=False) # 'focus_state', 'load_spike', 'fatigue_detected', 'wellness_break', 'goal_reached'
    severity = Column(String(20), nullable=False) # 'info', 'warning', 'critical'
    trigger_reason = Column(String(255), nullable=False)
    ai_explanation = Column(String(1000), nullable=False)
    recommendation_text = Column(String(1000), nullable=True)
    action_url = Column(String(255), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="timeline_events")
