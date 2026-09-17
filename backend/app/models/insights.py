from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timeframe = Column(String(20), nullable=False) # 'daily', 'weekly', 'monthly', 'ad_hoc'
    summary_text = Column(String(1000), nullable=False)
    risk_direction = Column(String(20), nullable=False) # 'improved', 'stable', 'degraded'
    risk_delta = Column(Float, nullable=False, default=0.0)
    confidence_score = Column(Float, nullable=False, default=1.0)
    top_activities_json = Column(String, nullable=False) # Serialized JSON array of active apps
    feature_contributions_json = Column(String, nullable=False) # Serialized JSON key-value of SHAP values
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_insights")
