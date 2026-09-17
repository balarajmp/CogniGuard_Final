from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class AIMemoryNode(Base):
    __tablename__ = "ai_memory_nodes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key_category = Column(String(100), nullable=False, index=True) # e.g. 'preferred_focus_start', 'effective_soundscape'
    value_text = Column(String(500), nullable=False)
    weight = Column(Float, default=1.0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="ai_memory_nodes")
