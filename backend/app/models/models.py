from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # 'admin', 'user'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    baseline_metrics = relationship("BaselineMetrics", back_populates="user", uselist=False)
    stress_history = relationship("StressHistory", back_populates="user")

class BaselineMetrics(Base):
    __tablename__ = "baseline_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), unique=True)
    
    # Biometric baselines
    avg_typing_speed_wpm = Column(Float, default=60.0)
    avg_heart_rate_bpm = Column(Float, default=70.0)
    avg_facial_fatigue_score = Column(Float, default=0.1) # 0 to 1
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="baseline_metrics")

class StressHistory(Base):
    __tablename__ = "stress_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"))
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Recorded metrics at that time
    typing_speed_wpm = Column(Float)
    heart_rate_bpm = Column(Float)
    facial_fatigue_score = Column(Float)
    
    # Computed risk
    calculated_stress_level = Column(Float) # 0 to 100
    
    user = relationship("UserProfile", back_populates="stress_history")
