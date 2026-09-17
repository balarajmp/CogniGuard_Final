from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.stress import BurnoutRiskResult
from app.schemas.intervention import (
    AcknowledgeIntervention,
    DismissIntervention,
    AbortIntervention,
    InterventionDecision,
    InterventionResponse,
    InterventionEffectiveness,
    InterventionMLTuple,
)
from app.services.intervention_service import InterventionService
from app.services.effectiveness_service import EffectivenessService

router = APIRouter()


@router.get("/evaluate", response_model=InterventionDecision)
async def evaluate_intervention_state(
    test_strain: Optional[bool] = Query(False, description="Safe dev test mode to evaluate an elevated strain condition"),
    test_stress: Optional[float] = Query(None, description="Simulated stress level for dev testing"),
    bypass_cooldown: Optional[bool] = Query(False, description="Bypass active cooldown for dev testing"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> InterventionDecision:
    """
    Evaluate the user's current cognitive state against the centralized AI Intervention Agent.
    Applies cooldown and deduplication rules, persists genuine new interventions (if registered),
    and returns an explainable decision.
    """
    svc = InterventionService(db)
    current_risk = None
    if test_strain:
        sim_stress = float(test_stress) if test_stress is not None else 62.0
        current_risk = BurnoutRiskResult(
            stress_level=sim_stress,
            burnout_risk_pct=70.0,
            focus_reserves_pct=38.0,
            risk_tier="high" if sim_stress >= 60.0 else "moderate",
            intervention_needed=True,
            intervention_type="breathing",
            intervention_message="Box breathing recommended to down-regulate sympathetic arousal.",
        )
    return await svc.evaluate_for_user(
        current_user,
        current_risk=current_risk,
        bypass_cooldown=bool(bypass_cooldown),
    )


@router.get("/active", response_model=Optional[InterventionResponse])
async def get_active_intervention(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> Optional[InterventionResponse]:
    """
    Retrieve the user's current active (unacknowledged and undismissed) intervention, if any.
    """
    svc = InterventionService(db)
    return await svc.get_active_intervention(current_user.id)


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


@router.post("/dismiss", response_model=InterventionResponse)
async def dismiss_intervention(
    payload: DismissIntervention,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> object:
    """Mark an intervention as dismissed by the user with optional reason."""
    svc = InterventionService(db)
    return await svc.dismiss(payload.intervention_id, current_user.id, reason=payload.reason)


@router.post("/abort", response_model=InterventionResponse)
async def abort_intervention(
    payload: AbortIntervention,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> object:
    """Mark an intervention as aborted/abandoned by the user before completion."""
    svc = InterventionService(db)
    return await svc.abort(payload.intervention_id, current_user.id, reason=payload.reason)


@router.get("/latest-effectiveness", response_model=Optional[InterventionEffectiveness])
async def get_latest_intervention_effectiveness(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> Optional[InterventionEffectiveness]:
    """
    Retrieve before-vs-after effectiveness for the user's most recently completed intervention.
    """
    svc = EffectivenessService(db)
    return await svc.get_latest_effectiveness(current_user.id)


@router.get("/{intervention_id}/effectiveness", response_model=InterventionEffectiveness)
async def get_intervention_effectiveness(
    intervention_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> InterventionEffectiveness:
    """
    Calculate before-vs-after behavioral/cognitive effectiveness for a completed intervention.
    """
    svc = EffectivenessService(db)
    return await svc.calculate_effectiveness(intervention_id, current_user.id)


@router.get("/ml-tuples", response_model=list[InterventionMLTuple])
async def list_intervention_ml_tuples(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> list[dict]:
    """
    Retrieve dataset-ready ML tuples: State (s) -> Action (a) -> User Response (u) -> Outcome (r, ΔM).
    """
    svc = InterventionService(db)
    return await svc.get_ml_tuples(current_user.id, limit=limit)


@router.get("/{intervention_id}/ml-tuple", response_model=InterventionMLTuple)
async def get_intervention_ml_tuple(
    intervention_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> dict:
    """
    Retrieve dataset-ready ML tuple for a specific intervention.
    """
    from app.core.exceptions import NotFoundException

    svc = InterventionService(db)
    res = await svc.get_intervention_ml_tuple(intervention_id, current_user.id)
    if not res:
        raise NotFoundException("Intervention")
    return res

