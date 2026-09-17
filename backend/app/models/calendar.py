from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class CalendarIntegration(Base):
    __tablename__ = "calendar_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False) # 'google', 'outlook', 'apple'
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    sync_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="calendar_integrations")


class ScheduledFocusBlock(Base):
    __tablename__ = "scheduled_focus_blocks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    calendar_event_id = Column(String(255), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    block_type = Column(String(50), nullable=False) # 'deep_work', 'rest_buffer'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="focus_blocks")
