from __future__ import annotations
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class GamificationProfile(Base):
    __tablename__ = "gamification_profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    level = Column(Integer, default=1, nullable=False)
    current_xp = Column(Integer, default=0, nullable=False)
    xp_to_next_level = Column(Integer, default=1000, nullable=False)
    active_streak = Column(Integer, default=0, nullable=False)
    last_streak_date = Column(Date, nullable=True)
    longest_streak = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="gamification_profile")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    badge_key = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon_svg = Column(String, nullable=True)
    xp_reward = Column(Integer, default=100, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements_map"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True, index=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="unlocked_achievements")
    achievement = relationship("Achievement")
