from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.recovery import (
    RecoverySessionCreate,
    RecoverySessionComplete,
    RecoverySessionAbort,
    RecoverySessionResponse,
    RecoverySummaryDTO,
)
from app.services.recovery_service import RecoveryService

router = APIRouter()


# ── G-R10 — Recovery History & Personalization Foundation ─────────────────────

@router.get(
    "/history/summary",
    response_model=RecoverySummaryDTO,
    summary="Get aggregate recovery usage summary for the authenticated user",
)
async def get_recovery_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> RecoverySummaryDTO:
    """
    Returns an aggregate summary of the user's recovery session history:
    - total / completed / aborted session counts
    - completion rate
    - total and average elapsed durations
    - per-activity usage breakdown
    - time-of-day usage patterns
    - consecutive-day streak
    - sessions this ISO week

    All values are computed from real recovery_sessions records.
    Empty-history users receive a zero-value response (not an error).
    """
    svc = RecoveryService(db)
    return await svc.get_summary(current_user)


# ── G-R9 — Session Tracking Endpoints ─────────────────────────────────────────


@router.post(
    "/sessions/start",
    response_model=RecoverySessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start/initialize a recovery session tracking record",
)
async def start_recovery_session(
    payload: RecoverySessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> RecoverySessionResponse:
    """
    Create and persist a new recovery session tracking record for the authenticated user.
    """
    svc = RecoveryService(db)
    return await svc.start_session(current_user, payload)


@router.post(
    "/sessions/{session_id}/complete",
    response_model=RecoverySessionResponse,
    summary="Complete a recovery session",
)
async def complete_recovery_session(
    session_id: int,
    payload: RecoverySessionComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> RecoverySessionResponse:
    """
    Mark an active recovery session as completed with actual elapsed duration.
    """
    svc = RecoveryService(db)
    return await svc.complete_session(current_user, session_id, payload)


@router.post(
    "/sessions/{session_id}/abort",
    response_model=RecoverySessionResponse,
    summary="Abort an active recovery session",
)
async def abort_recovery_session(
    session_id: int,
    payload: RecoverySessionAbort,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> RecoverySessionResponse:
    """
    Mark an active recovery session as aborted with actual elapsed duration.
    """
    svc = RecoveryService(db)
    return await svc.abort_session(current_user, session_id, payload)


@router.get(
    "/sessions",
    response_model=list[RecoverySessionResponse],
    summary="Retrieve recent recovery sessions for the authenticated user",
)
async def list_recovery_sessions(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user),
) -> list[RecoverySessionResponse]:
    """
    Retrieve the authenticated user's recent recovery sessions ordered by most recent first.
    """
    svc = RecoveryService(db)
    return await svc.get_user_sessions(current_user, limit=limit)
