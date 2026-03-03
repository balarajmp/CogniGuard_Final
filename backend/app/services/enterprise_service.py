from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.stress_repo import StressRepository
from app.repositories.user_repo import UserRepository
from app.schemas.enterprise import DepartmentRiskSummary, GlobalRiskSummary
from app.services.intervention_service import InterventionService


class EnterpriseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.stress_repo = StressRepository(db)
        self.user_repo = UserRepository(db)
        self.intervention_svc = InterventionService(db)

    async def get_global_summary(self) -> GlobalRiskSummary:
        all_latest = await self.stress_repo.get_all_latest()
        active_users = await self.user_repo.get_all_active_users()
        active_count = await self.intervention_svc.get_active_count()

        if not all_latest:
            return GlobalRiskSummary(
                total_active_users=len(active_users),
                avg_stress_level=0.0,
                avg_burnout_risk_pct=0.0,
                high_risk_count=0,
                critical_risk_count=0,
                departments=[],
            )

        avg_stress = sum(r.stress_level for r in all_latest) / len(all_latest)
        avg_burnout = sum(r.burnout_risk_pct for r in all_latest) / len(all_latest)
        high_risk = sum(1 for r in all_latest if r.risk_tier in ("high", "critical"))
        critical_risk = sum(1 for r in all_latest if r.risk_tier == "critical")

        # Anonymized single-department view (no department column on User yet)
        dept_summary = DepartmentRiskSummary(
            department="Engineering",
            total_users=len(all_latest),
            avg_stress_level=round(avg_stress, 2),
            avg_burnout_risk_pct=round(avg_burnout, 2),
            avg_focus_reserves_pct=round(
                sum(r.focus_reserves_pct for r in all_latest) / len(all_latest), 2
            ),
            high_risk_user_count=high_risk,
            critical_risk_user_count=critical_risk,
            active_interventions=active_count,
        )

        return GlobalRiskSummary(
            total_active_users=len(active_users),
            avg_stress_level=round(avg_stress, 2),
            avg_burnout_risk_pct=round(avg_burnout, 2),
            high_risk_count=high_risk,
            critical_risk_count=critical_risk,
            departments=[dept_summary],
        )
