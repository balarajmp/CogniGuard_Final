from __future__ import annotations
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.insights import AIInsight
from app.repositories.base import BaseRepository


class InsightRepository(BaseRepository[AIInsight]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AIInsight, db)

    async def get_latest_by_timeframe(self, user_id: int, timeframe: str) -> AIInsight | None:
        """Get the most recent AI insight for a given user and timeframe."""
        result = await self.db.execute(
            select(AIInsight)
            .where((AIInsight.user_id == user_id) & (AIInsight.timeframe == timeframe))
            .order_by(desc(AIInsight.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_user_insights(self, user_id: int, limit: int = 30) -> list[AIInsight]:
        """Get all AI insights for a given user ordered by creation date desc."""
        result = await self.db.execute(
            select(AIInsight)
            .where(AIInsight.user_id == user_id)
            .order_by(desc(AIInsight.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())
