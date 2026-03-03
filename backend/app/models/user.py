from __future__ import annotations
from sqlalchemy import String, Boolean, DateTime, Integer, Column, func
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

    baseline_metrics = relationship("BaselineMetrics", back_populates="user", uselist=False)
    stress_history = relationship("StressHistory", back_populates="user")
    interventions = relationship("Intervention", back_populates="user")


# Import dependent models HERE after User is defined so SQLAlchemy mapper resolves relationships
from app.models.biometric import BaselineMetrics, BiometricSnapshot  # noqa: E402, F401
from app.models.stress import StressHistory  # noqa: E402, F401
from app.models.intervention import Intervention  # noqa: E402, F401
