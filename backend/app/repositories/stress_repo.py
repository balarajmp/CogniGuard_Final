from __future__ import annotations
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.stress import StressHistory
from app.repositories.base import BaseRepository


class StressRepository(BaseRepository[StressHistory]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(StressHistory, db)

    async def get_history(self, user_id: int, limit: int = 30) -> list[StressHistory]:
        result = await self.db.execute(
            select(StressHistory)
            .where(StressHistory.user_id == user_id)
            .order_by(desc(StressHistory.recorded_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_latest(self) -> list[StressHistory]:
        """Get the most recent stress record per user (for enterprise aggregation)."""
        # Subquery to get max recorded_at per user
        subq = (
            select(
                StressHistory.user_id,
                func.max(StressHistory.recorded_at).label("max_date"),
            )
            .group_by(StressHistory.user_id)
            .subquery()
        )
        result = await self.db.execute(
            select(StressHistory).join(
                subq,
                (StressHistory.user_id == subq.c.user_id)
                & (StressHistory.recorded_at == subq.c.max_date),
            )
        )
        return list(result.scalars().all())
