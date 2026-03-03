from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.biometric import BiometricSnapshot
from app.models.user import User
from app.repositories.biometric_repo import BiometricRepository
from app.repositories.stress_repo import StressRepository
from app.schemas.biometric import BiometricIngest, BiometricSnapshotResponse
from app.schemas.stress import BurnoutRiskResult, StressHistoryResponse
from app.services.burnout_engine import burnout_engine
from app.services.intervention_service import InterventionService

router = APIRouter()


@router.post("/ingest", response_model=BurnoutRiskResult)
async def ingest_biometrics(
    payload: BiometricIngest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> BurnoutRiskResult:
    """
    Ingest real-time biometric telemetry. Runs through the Burnout Engine.
    Guest users receive results but data is not persisted.
    """
    bio_repo = BiometricRepository(db)
    baseline = None

    if not current_user.is_guest:
        baseline = await bio_repo.get_baseline(current_user.id)

    # Build transient snapshot for engine (not saved for guests)
    snapshot = BiometricSnapshot(
        user_id=current_user.id if not current_user.is_guest else 0,
        **payload.model_dump(exclude_none=True),
    )

    risk = burnout_engine.compute(snapshot, baseline)

    if not current_user.is_guest:
        # Persist snapshot
        snapshot.user_id = current_user.id
        saved_snapshot = await bio_repo.create(snapshot)

        # Persist computed risk
        from app.models.stress import StressHistory
        stress_record = StressHistory(
            user_id=current_user.id,
            snapshot_id=saved_snapshot.id,
            stress_level=risk.stress_level,
            burnout_risk_pct=risk.burnout_risk_pct,
            focus_reserves_pct=risk.focus_reserves_pct,
            risk_tier=risk.risk_tier,
        )
        stress_repo = StressRepository(db)
        await stress_repo.create(stress_record)

        # Trigger intervention if needed
        intervention_svc = InterventionService(db)
        await intervention_svc.trigger_if_needed(current_user, risk)

    return risk


@router.get("/history", response_model=list[StressHistoryResponse])
async def get_stress_history(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list:
    """Fetch the user's personal stress history. Not available in guest mode."""
    if current_user.is_guest:
        return []
    repo = StressRepository(db)
    return await repo.get_history(current_user.id, limit=limit)


@router.get("/snapshots", response_model=list[BiometricSnapshotResponse])
async def get_snapshots(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list:
    """Fetch raw biometric snapshots for the current user."""
    if current_user.is_guest:
        return []
    repo = BiometricRepository(db)
    return await repo.get_recent_snapshots(current_user.id, limit=limit)
