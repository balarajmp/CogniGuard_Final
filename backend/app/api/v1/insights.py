from __future__ import annotations
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.models.coach import CoachRecommendation, MoodJournalEntry
from app.repositories.insight_repo import InsightRepository
from app.services.insights_service import AIInsightsService
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


class MoodRequest(BaseModel):
    mood: str
    notes: str | None = None
    correlated_stress_score: float | None = None


@router.get("/center")
async def get_ai_insights(
    timeframe: str = "daily",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
):
    """
    Fetch the latest AI insight for the authenticated user and specified timeframe.
    If no insight exists yet, one is dynamically generated on-the-fly.
    """
    if timeframe not in ["daily", "weekly", "monthly"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timeframe must be 'daily', 'weekly', or 'monthly'",
        )

    try:
        repo = InsightRepository(db)
        insight = await repo.get_latest_by_timeframe(current_user.id, timeframe)

        if not insight:
            logger.info(f"No existing {timeframe} insight for user {current_user.id}. Generating dynamically.")
            service = AIInsightsService()
            insight = await service.generate_timeframe_insight(db, current_user.id, timeframe)

        return {
            "id": insight.id,
            "timeframe": insight.timeframe,
            "summary_text": insight.summary_text,
            "risk_direction": insight.risk_direction,
            "risk_delta": insight.risk_delta,
            "confidence_score": insight.confidence_score,
            "top_activities": json.loads(insight.top_activities_json) if insight.top_activities_json else [],
            "feature_contributions": json.loads(insight.feature_contributions_json) if insight.feature_contributions_json else {},
            "created_at": insight.created_at,
        }
    except Exception as e:
        logger.error(f"Error fetching/generating AI insight: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI insights",
        )


@router.get("/recommendations")
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
):
    """
    Retrieve recent coach recommendations for the authenticated user.
    """
    try:
        result = await db.execute(
            select(CoachRecommendation)
            .filter(CoachRecommendation.user_id == current_user.id)
            .order_by(CoachRecommendation.created_at.desc())
            .limit(10)
        )
        recommendations = result.scalars().all()

        return [
            {
                "id": r.id,
                "category": r.category,
                "message_text": r.message_text,
                "trigger_metric_name": r.trigger_metric_name,
                "trigger_value": r.trigger_value,
                "is_completed": r.is_completed,
                "created_at": r.created_at,
            }
            for r in recommendations
        ]
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendations",
        )


@router.post("/recommendations/{rec_id}/complete")
async def complete_recommendation(
    rec_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
):
    """
    Mark a specific recommendation as completed.
    """
    try:
        result = await db.execute(
            select(CoachRecommendation)
            .where((CoachRecommendation.id == rec_id) & (CoachRecommendation.user_id == current_user.id))
        )
        rec = result.scalar_one_or_none()
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found or unauthorized",
            )
        rec.is_completed = True
        await db.commit()
        return {"status": "success", "id": rec.id, "is_completed": rec.is_completed}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing recommendation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete recommendation",
        )


@router.post("/mood", status_code=status.HTTP_201_CREATED)
async def log_mood(
    payload: MoodRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
):
    """
    Log a new mood journal entry.
    """
    try:
        entry = MoodJournalEntry(
            user_id=current_user.id,
            mood=payload.mood,
            notes=payload.notes,
            correlated_stress_score=payload.correlated_stress_score or 40.0,
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return {"status": "success", "id": entry.id}
    except Exception as e:
        logger.error(f"Error logging mood: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log mood",
        )
