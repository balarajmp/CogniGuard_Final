from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class RecoverySessionRecord(Base):
    __tablename__ = "recovery_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(String(100), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False, index=True)
    activity_title = Column(String(255), nullable=False)
    guided_content_id = Column(String(100), nullable=True)
    video_id = Column(String(100), nullable=True)
    session_start = Column(DateTime(timezone=True), nullable=False)
    session_end = Column(DateTime(timezone=True), nullable=True)
    planned_duration_seconds = Column(Integer, nullable=False)
    elapsed_duration_seconds = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="active", nullable=False, index=True)  # active | completed | aborted
    completion_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="recovery_sessions")
