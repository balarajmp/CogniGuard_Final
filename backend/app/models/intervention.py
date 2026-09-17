from __future__ import annotations
import json
from typing import Any
from sqlalchemy import Float, DateTime, ForeignKey, func, Integer, String, Boolean, Column, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    intervention_type = Column(String(50), nullable=False)
    message = Column(String(500), nullable=False)
    stress_level_at_trigger = Column(Float, nullable=False)
    risk_tier_at_trigger = Column(String(20), nullable=False)
    severity = Column(String(20), nullable=True, default="MODERATE")
    priority = Column(String(20), nullable=True, default="MEDIUM")
    confidence = Column(Float, nullable=True, default=1.0)
    recommended_duration_mins = Column(Integer, nullable=True, default=5)
    delivery_channel = Column(String(50), nullable=True, default="IN_APP_BANNER")
    reason = Column(String(500), nullable=True)
    was_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    was_dismissed = Column(Boolean, default=False, nullable=False)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    dismissal_reason = Column(String(255), nullable=True)
    was_aborted = Column(Boolean, default=False, nullable=False)
    aborted_at = Column(DateTime(timezone=True), nullable=True)
    abort_reason = Column(String(255), nullable=True)

    # Closed-loop effectiveness fields (Phase F)
    effectiveness_result = Column(String(30), nullable=True)  # IMPROVED, STABLE, DECLINED, INSUFFICIENT_DATA
    effectiveness_score = Column(Float, nullable=True)        # Normalized score (0-100)
    effectiveness_evaluated_at = Column(DateTime(timezone=True), nullable=True)
    effectiveness_metrics = Column(String(1000), nullable=True)  # JSON-encoded metric deltas
    effectiveness_summary = Column(String(500), nullable=True)   # Non-medical behavioral summary

    # ML-ready context logging (Phase G.1)
    decision_context = Column(Text, nullable=True)  # JSON-encoded state feature vector at trigger time

    user = relationship("User", back_populates="interventions")

    def to_ml_tuple(self) -> dict[str, Any]:
        """
        Convert intervention record into a dataset-ready ML tuple:
        State (s) -> Action (a) -> User Response (u) -> Outcome (r, ΔM).
        """
        parsed_context: dict[str, Any] = {}
        if self.decision_context:
            try:
                parsed_context = json.loads(self.decision_context)
            except Exception:
                parsed_context = {}

        parsed_eff_metrics: dict[str, Any] = {}
        if self.effectiveness_metrics:
            try:
                parsed_eff_metrics = json.loads(self.effectiveness_metrics)
            except Exception:
                parsed_eff_metrics = {}

        # User response classification
        if self.was_acknowledged:
            user_response = "completed"
            response_at = self.acknowledged_at
        elif getattr(self, "was_aborted", False):
            user_response = "aborted"
            response_at = self.aborted_at
        elif getattr(self, "was_dismissed", False):
            user_response = "dismissed"
            response_at = self.dismissed_at
        else:
            user_response = "pending"
            response_at = None

        return {
            "intervention_id": self.id,
            "user_id": self.user_id,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "state": parsed_context,
            "action": {
                "intervention_type": self.intervention_type,
                "severity": self.severity,
                "priority": self.priority,
                "confidence": self.confidence,
                "recommended_duration_mins": self.recommended_duration_mins,
                "delivery_channel": self.delivery_channel,
                "message": self.message,
                "reason": self.reason,
            },
            "user_response": user_response,
            "outcome": {
                "response_at": response_at.isoformat() if response_at else None,
                "dismissal_reason": self.dismissal_reason,
                "abort_reason": getattr(self, "abort_reason", None),
                "effectiveness_result": self.effectiveness_result,
                "effectiveness_score": self.effectiveness_score,
                "effectiveness_evaluated_at": (
                    self.effectiveness_evaluated_at.isoformat()
                    if self.effectiveness_evaluated_at
                    else None
                ),
                "effectiveness_metrics": parsed_eff_metrics,
                "effectiveness_summary": self.effectiveness_summary,
            },
        }
