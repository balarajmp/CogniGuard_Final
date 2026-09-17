from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class AIInsightResponse(BaseModel):
    id: int
    timeframe: str
    summary_text: str
    risk_direction: str
    risk_delta: float
    confidence_score: float
    top_activities_json: str
    feature_contributions_json: str
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: int
    category: str
    recommendation_text: str
    priority: str
    actionable_steps: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
