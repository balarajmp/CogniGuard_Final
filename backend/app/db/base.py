# Import all models here so that Alembic or engine.create_all can detect them for migrations/creation
from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.biometric import BaselineMetrics, BiometricSnapshot, UserGroundTruthLabel  # noqa: F401
from app.models.stress import StressHistory  # noqa: F401
from app.models.intervention import Intervention  # noqa: F401
from app.models.insights import AIInsight  # noqa: F401
from app.models.chat import ChatSession, ChatMessage  # noqa: F401
from app.models.productivity import DailyProductivitySummary, ProductivityGoal  # noqa: F401
from app.models.timeline import TimelineEvent  # noqa: F401
from app.models.gamification import GamificationProfile, Achievement, UserAchievement  # noqa: F401
from app.models.calendar import CalendarIntegration, ScheduledFocusBlock  # noqa: F401
from app.models.focus import FocusSession  # noqa: F401
from app.models.coach import CoachRecommendation, MoodJournalEntry  # noqa: F401
from app.models.memory import AIMemoryNode  # noqa: F401
from app.models.recovery import RecoverySessionRecord  # noqa: F401
