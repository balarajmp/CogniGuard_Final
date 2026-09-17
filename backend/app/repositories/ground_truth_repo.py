from __future__ import annotations
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.biometric import UserGroundTruthLabel


class GroundTruthRepository:
    """Repository for user self-report ground-truth labels."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, label: UserGroundTruthLabel) -> UserGroundTruthLabel:
        self.db.add(label)
        await self.db.commit()
        await self.db.refresh(label)
        return label

    async def get_recent(self, user_id: int, limit: int = 50) -> list[UserGroundTruthLabel]:
        result = await self.db.execute(
            select(UserGroundTruthLabel)
            .where(UserGroundTruthLabel.user_id == user_id)
            .order_by(desc(UserGroundTruthLabel.timestamp))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_last_label(self, user_id: int) -> UserGroundTruthLabel | None:
        result = await self.db.execute(
            select(UserGroundTruthLabel)
            .where(UserGroundTruthLabel.user_id == user_id)
            .order_by(desc(UserGroundTruthLabel.timestamp))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_labels_in_window(
        self,
        user_id: int,
        since: datetime,
        until: datetime | None = None,
    ) -> list[UserGroundTruthLabel]:
        """Fetch labels within a time range (used by feature enrichment)."""
        if until is None:
            until = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(UserGroundTruthLabel)
            .where(
                and_(
                    UserGroundTruthLabel.user_id == user_id,
                    UserGroundTruthLabel.timestamp >= since,
                    UserGroundTruthLabel.timestamp <= until,
                )
            )
            .order_by(UserGroundTruthLabel.timestamp)
        )
        return list(result.scalars().all())
