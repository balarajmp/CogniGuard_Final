from __future__ import annotations
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.biometric import BaselineMetrics, BiometricSnapshot
from app.repositories.base import BaseRepository


class BiometricRepository(BaseRepository[BiometricSnapshot]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(BiometricSnapshot, db)

    async def get_recent_snapshots(self, user_id: int, limit: int = 20) -> list[BiometricSnapshot]:
        result = await self.db.execute(
            select(BiometricSnapshot)
            .where(BiometricSnapshot.user_id == user_id)
            .order_by(desc(BiometricSnapshot.captured_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_baseline(self, user_id: int) -> BaselineMetrics | None:
        result = await self.db.execute(
            select(BaselineMetrics).where(BaselineMetrics.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_or_update_baseline(
        self, user_id: int, data: dict
    ) -> BaselineMetrics:
        existing = await self.get_baseline(user_id)
        if existing:
            return await self.update(existing, data)
        baseline = BaselineMetrics(user_id=user_id, **data)
        return await self.create(baseline)
