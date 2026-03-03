from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.enterprise import GlobalRiskSummary
from app.services.enterprise_service import EnterpriseService

router = APIRouter()


@router.get("/summary", response_model=GlobalRiskSummary)
async def get_enterprise_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> GlobalRiskSummary:
    """
    Anonymized global burnout risk overview for enterprise/admin dashboard.
    Returns department-level aggregations with no individual user data exposed.
    Requires admin role.
    """
    svc = EnterpriseService(db)
    return await svc.get_global_summary()
