from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class DailyProductivitySummary(Base):
    __tablename__ = "daily_productivity_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    deep_work_seconds = Column(Integer, default=0, nullable=False)
    focus_seconds = Column(Integer, default=0, nullable=False)
    screen_seconds = Column(Integer, default=0, nullable=False)
    break_seconds = Column(Integer, default=0, nullable=False)
    focus_streak_count = Column(Integer, default=0, nullable=False)
    wellness_score = Column(Float, default=100.0, nullable=False)
    daily_xp_earned = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="productivity_summaries")


class ProductivityGoal(Base):
    __tablename__ = "productivity_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_type = Column(String(50), nullable=False) # 'deep_work', 'screen_time', 'breaks_taken', 'wellness_score'
    cadence = Column(String(20), nullable=False) # 'daily', 'weekly', 'monthly'
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="productivity_goals")
