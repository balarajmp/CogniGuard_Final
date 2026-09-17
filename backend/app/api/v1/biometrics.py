from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.biometric import BiometricSnapshot, UserGroundTruthLabel
from app.models.user import User
from app.repositories.biometric_repo import BiometricRepository
from app.repositories.stress_repo import StressRepository
from app.repositories.ground_truth_repo import GroundTruthRepository
from app.schemas.biometric import (
    BiometricIngest,
    BiometricSnapshotResponse,
    BiometricCalibrationRequest,
    BaselineMetricsResponse,
    GroundTruthLabelCreate,
    GroundTruthLabelResponse,
)
from app.schemas.stress import BurnoutRiskResult, StressHistoryResponse, DailyAverageItem, BurnoutForecastResponse
from app.services.burnout_engine import burnout_engine
from app.services.intervention_service import InterventionService
from app.services.gmm import GaussianMixture1D
from app.models.biometric import BaselineMetrics
from app.services.forecast_service import ForecastService


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

        # Trigger intervention if needed (with cooldown & agent logic)
        intervention_svc = InterventionService(db)
        await intervention_svc.trigger_if_needed(current_user, risk, snapshot=saved_snapshot)

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


@router.get("/history/daily-averages", response_model=list[DailyAverageItem])
async def get_daily_averages(
    start_date: str | None = None,
    end_date: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[DailyAverageItem]:
    """Fetch daily aggregated averages of stress history."""
    if current_user.is_guest:
        return []
    
    from datetime import datetime
    parsed_start = None
    parsed_end = None
    if start_date:
        try:
            parsed_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        except ValueError:
            pass
    if end_date:
        try:
            parsed_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            pass

    repo = StressRepository(db)
    return await repo.get_daily_averages(current_user.id, start_date=parsed_start, end_date=parsed_end)


@router.get("/forecast", response_model=BurnoutForecastResponse)
async def get_burnout_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> BurnoutForecastResponse:
    """
    Generate a 24-hour predictive forecast of focus reserves for the authenticated user.
    """
    service = ForecastService(db)
    return await service.get_burnout_forecast(
        user_id=current_user.id, is_guest=current_user.is_guest
    )



@router.get("/ml-dataset")
async def get_my_ml_dataset(
    window_minutes: int = 5,
    min_snapshots: int = 3,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve aggregated, ML-ready feature training dataset derived from
    user's self-reported stress labels attached to biometric snapshots.
    """
    if current_user.is_guest:
        return []
    from app.services.feature_pipeline import get_ml_dataset
    return await get_ml_dataset(
        db=db,
        user_id=current_user.id,
        window_minutes=window_minutes,
        min_snapshots=min_snapshots,
        enrich=True,
    )


@router.post("/ground-truth", response_model=GroundTruthLabelResponse)
async def submit_ground_truth(
    payload: GroundTruthLabelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserGroundTruthLabel:
    """
    Store a user self-report ground-truth label from the periodic check-in prompt.
    These are the primary supervised learning targets for the future XGBoost model.
    """
    if current_user.is_guest:
        # Return a transient response for guests (not stored)
        from app.models.biometric import UserGroundTruthLabel as GTL
        from datetime import datetime, timezone
        dummy = GTL(
            id=0,
            user_id=0,
            timestamp=datetime.now(timezone.utc),
            stress_level=payload.stress_level,
            fatigue_level=payload.fatigue_level,
            focus_level=payload.focus_level,
            notes=payload.notes,
        )
        return dummy

    repo = GroundTruthRepository(db)
    label = UserGroundTruthLabel(
        user_id=current_user.id,
        stress_level=payload.stress_level,
        fatigue_level=payload.fatigue_level,
        focus_level=payload.focus_level,
        notes=payload.notes,
    )
    return await repo.create(label)


@router.get("/ground-truth", response_model=list[GroundTruthLabelResponse])
async def get_ground_truth_labels(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list:
    """Retrieve recent ground-truth stress labels for the current user."""
    if current_user.is_guest:
        return []
    repo = GroundTruthRepository(db)
    return await repo.get_recent(current_user.id, limit=limit)


@router.get("/ground-truth/ml-dataset")
async def get_ground_truth_ml_dataset(
    window_minutes: int = 30,
    min_snapshots: int = 3,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Primary ML training dataset: pairs each dedicated ground-truth label with
    the preceding window of real behavioral telemetry features.
    Richer and more reliable than snapshot-attached labels.
    """
    if current_user.is_guest:
        return []
    from app.services.feature_pipeline import get_ground_truth_ml_dataset
    return await get_ground_truth_ml_dataset(
        db=db,
        user_id=current_user.id,
        window_minutes=window_minutes,
        min_snapshots=min_snapshots,
    )


@router.get("/rolling-features")
async def get_rolling_features(
    window_minutes: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Return live engineered features for the current user's recent telemetry window.
    Useful for real-time dashboards and debugging the feature pipeline.
    """
    if current_user.is_guest:
        return {}
    from app.services.feature_pipeline import calculate_rolling_features
    return await calculate_rolling_features(
        user_id=current_user.id,
        window_minutes=window_minutes,
        db=db,
        enrich=True,
    )


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


@router.post("/calibrate", response_model=BaselineMetricsResponse)
async def calibrate_baseline(
    payload: BiometricCalibrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> BaselineMetrics:
    """
    Calibrate and lock the user's cognitive and physiological baseline.
    Uses a 2-component Gaussian Mixture Model (GMM) fit with Expectation-Maximization
    to isolate focused keystroke intervals and resting heart rates.
    """
    # 1. Fit GMM on typing intervals to find the focused typing speed
    calibrated_wpm = 60.0
    if payload.typing_intervals:
        gmm_typing = GaussianMixture1D(k=2)
        gmm_typing.fit(payload.typing_intervals)
        if gmm_typing.means:
            fastest_mean_ms = min(gmm_typing.means)
            if fastest_mean_ms > 0:
                calibrated_wpm = min(max(12000.0 / fastest_mean_ms, 20.0), 200.0)

    # 2. Fit GMM on heart rates to find resting heart rate
    calibrated_hr = 70.0
    if payload.heart_rates:
        gmm_hr = GaussianMixture1D(k=2)
        gmm_hr.fit(payload.heart_rates)
        if gmm_hr.means:
            calibrated_hr = min(gmm_hr.means)
            if calibrated_hr < 30.0 or calibrated_hr > 180.0:
                calibrated_hr = 70.0

    baseline_data = {
        "avg_typing_speed_wpm": float(calibrated_wpm),
        "avg_heart_rate_bpm": float(calibrated_hr),
        "avg_hrv_ms": float(payload.hrv_ms),
        "avg_facial_fatigue_score": float(payload.facial_fatigue_score),
        "avg_ambient_noise_db": float(payload.ambient_noise_db),
        "avg_luminance_pct": float(payload.luminance_pct),
        "avg_error_burst_per_min": float(payload.error_burst_per_min),
    }

    bio_repo = BiometricRepository(db)
    if current_user.is_guest:
        return BaselineMetrics(user_id=0, id=0, **baseline_data)
        
    return await bio_repo.create_or_update_baseline(current_user.id, baseline_data)


@router.delete("/purge")
async def purge_biometrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Purges all user biometric history and stress records."""
    if current_user.is_guest:
        return {"status": "success", "message": "Guest data not stored"}
    
    from sqlalchemy import delete
    from app.models.stress import StressHistory
    
    await db.execute(delete(StressHistory).where(StressHistory.user_id == current_user.id))
    await db.execute(delete(BiometricSnapshot).where(BiometricSnapshot.user_id == current_user.id))
    await db.commit()
    
    return {"status": "success", "message": "All local biometric data and stress history purged."}


