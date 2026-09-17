from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    duration_seconds = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    target_timer_seconds = Column(Integer, nullable=False)
    distraction_count = Column(Integer, default=0, nullable=False)
    average_cognitive_load = Column(Float, nullable=True)
    productivity_score = Column(Integer, nullable=True)
    soundscape_used = Column(String(100), nullable=True)
    was_completed = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="focus_sessions")
