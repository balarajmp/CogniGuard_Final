from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.exceptions import NotFoundException
from app.models.intervention import Intervention
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.stress import BurnoutRiskResult


class InterventionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._repo = BaseRepository(Intervention, db)

    async def trigger_if_needed(
        self, user: User, risk: BurnoutRiskResult
    ) -> Intervention | None:
        if not risk.intervention_needed:
            return None

        intervention = Intervention(
            user_id=user.id,
            intervention_type=risk.intervention_type,
            message=risk.intervention_message or "",
            stress_level_at_trigger=risk.stress_level,
            risk_tier_at_trigger=risk.risk_tier,
            was_acknowledged=False,
        )
        return await self._repo.create(intervention)

    async def get_user_interventions(
        self, user_id: int, limit: int = 20
    ) -> list[Intervention]:
        result = await self.db.execute(
            select(Intervention)
            .where(Intervention.user_id == user_id)
            .order_by(desc(Intervention.triggered_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def acknowledge(self, intervention_id: int, user_id: int) -> Intervention:
        result = await self.db.execute(
            select(Intervention).where(
                Intervention.id == intervention_id,
                Intervention.user_id == user_id,
            )
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundException("Intervention")
        obj.was_acknowledged = True
        obj.acknowledged_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get_active_count(self) -> int:
        result = await self.db.execute(
            select(Intervention).where(Intervention.was_acknowledged == False)
        )
        return len(result.scalars().all())
