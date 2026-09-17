from __future__ import annotations
from sqlalchemy import String, Boolean, DateTime, Integer, Column, func, Float
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_guest = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Telemetry and privacy configurations
    keyboard_tracking = Column(Boolean, default=True, nullable=False)
    heart_rate_telemetry = Column(Boolean, default=True, nullable=False)
    facial_fatigue_webcam = Column(Boolean, default=False, nullable=False)
    ambient_noise_mapping = Column(Boolean, default=True, nullable=False)
    noise_multiplier = Column(Float, default=0.1, nullable=False)

    baseline_metrics = relationship("BaselineMetrics", back_populates="user", uselist=False, cascade="all, delete-orphan")
    stress_history = relationship("StressHistory", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="user", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    productivity_summaries = relationship("DailyProductivitySummary", back_populates="user", cascade="all, delete-orphan")
    productivity_goals = relationship("ProductivityGoal", back_populates="user", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="user", cascade="all, delete-orphan")
    gamification_profile = relationship("GamificationProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    unlocked_achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    calendar_integrations = relationship("CalendarIntegration", back_populates="user", cascade="all, delete-orphan")
    focus_blocks = relationship("ScheduledFocusBlock", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    coach_recommendations = relationship("CoachRecommendation", back_populates="user", cascade="all, delete-orphan")
    mood_journal_entries = relationship("MoodJournalEntry", back_populates="user", cascade="all, delete-orphan")
    ai_memory_nodes = relationship("AIMemoryNode", back_populates="user", cascade="all, delete-orphan")
    ground_truth_labels = relationship("UserGroundTruthLabel", back_populates="user", cascade="all, delete-orphan")
    recovery_sessions = relationship("RecoverySessionRecord", back_populates="user", cascade="all, delete-orphan")


# Import dependent models HERE after User is defined so SQLAlchemy mapper resolves relationships
from app.models.biometric import BaselineMetrics, BiometricSnapshot  # noqa: E402, F401
from app.models.stress import StressHistory  # noqa: E402, F401
from app.models.intervention import Intervention  # noqa: E402, F401
from app.models.insights import AIInsight  # noqa: E402, F401
from app.models.chat import ChatSession, ChatMessage  # noqa: E402, F401
from app.models.productivity import DailyProductivitySummary, ProductivityGoal  # noqa: E402, F401
from app.models.timeline import TimelineEvent  # noqa: E402, F401
from app.models.gamification import GamificationProfile, Achievement, UserAchievement  # noqa: E402, F401
from app.models.calendar import CalendarIntegration, ScheduledFocusBlock  # noqa: E402, F401
from app.models.focus import FocusSession  # noqa: E402, F401
from app.models.coach import CoachRecommendation, MoodJournalEntry  # noqa: E402, F401
from app.models.memory import AIMemoryNode  # noqa: E402, F401
from app.models.biometric import UserGroundTruthLabel  # noqa: E402, F401
from app.models.recovery import RecoverySessionRecord  # noqa: E402, F401
