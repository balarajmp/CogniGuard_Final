from __future__ import annotations
from datetime import datetime
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.stress import StressHistory
from app.repositories.base import BaseRepository


class StressRepository(BaseRepository[StressHistory]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(StressHistory, db)

    async def get_history(
        self,
        user_id: int,
        limit: int = 30,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[StressHistory]:
        query = select(StressHistory).where(StressHistory.user_id == user_id)
        if start_date:
            query = query.where(StressHistory.recorded_at >= start_date)
        if end_date:
            query = query.where(StressHistory.recorded_at <= end_date)
        query = query.order_by(desc(StressHistory.recorded_at))
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_daily_averages(
        self,
        user_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict]:
        date_expr = func.date(StressHistory.recorded_at).label("day")
        query = (
            select(
                date_expr,
                func.avg(StressHistory.stress_level).label("avg_stress"),
                func.avg(StressHistory.burnout_risk_pct).label("avg_burnout"),
                func.avg(StressHistory.focus_reserves_pct).label("avg_focus"),
                func.count(StressHistory.id).label("count")
            )
            .where(StressHistory.user_id == user_id)
        )
        if start_date:
            query = query.where(StressHistory.recorded_at >= start_date)
        if end_date:
            query = query.where(StressHistory.recorded_at <= end_date)
        
        query = query.group_by(date_expr).order_by(date_expr.asc())
        result = await self.db.execute(query)
        rows = result.all()
        return [
            {
                "date": row.day,
                "avg_stress_level": float(row.avg_stress),
                "avg_burnout_risk_pct": float(row.avg_burnout),
                "avg_focus_reserves_pct": float(row.avg_focus),
                "count": int(row.count),
            }
            for row in rows
        ]

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
