from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user, require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.stress import AcknowledgeIntervention, InterventionResponse
from app.services.intervention_service import InterventionService

router = APIRouter()


@router.get("/", response_model=list[InterventionResponse])
async def list_interventions(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> list:
    """List all triggered interventions for the current user."""
    svc = InterventionService(db)
    return await svc.get_user_interventions(current_user.id, limit=limit)


@router.post("/acknowledge", response_model=InterventionResponse)
async def acknowledge_intervention(
    payload: AcknowledgeIntervention,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> object:
    """Mark an intervention as acknowledged by the user."""
    svc = InterventionService(db)
    return await svc.acknowledge(payload.intervention_id, current_user.id)
