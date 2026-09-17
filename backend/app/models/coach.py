from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class CoachRecommendation(Base):
    __tablename__ = "coach_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False) # 'hydration', 'breathing', 'stretching', 'walking', 'mental_reset'
    message_text = Column(String(500), nullable=False)
    trigger_metric_name = Column(String(100), nullable=False)
    trigger_value = Column(Float, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    recovery_efficacy_delta = Column(Float, nullable=True) # Difference in stress level after completion
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="coach_recommendations")


class MoodJournalEntry(Base):
    __tablename__ = "mood_journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mood = Column(String(50), nullable=False) # Happy, Good, Neutral, Tired, Stressed, Frustrated, Burned_Out
    notes = Column(String(1000), nullable=True)
    correlated_stress_score = Column(Float, nullable=True)
    correlated_typing_variance = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="mood_journal_entries")
