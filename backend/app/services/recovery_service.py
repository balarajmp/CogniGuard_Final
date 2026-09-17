from __future__ import annotations
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.recovery import RecoverySessionRecord
from app.models.user import User
from app.schemas.recovery import (
    ActivityUsageDTO,
    RecoveryPatternDTO,
    RecoverySummaryDTO,
    RecoverySessionCreate,
    RecoverySessionComplete,
    RecoverySessionAbort,
)


class RecoveryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def start_session(
        self, user: User, payload: RecoverySessionCreate
    ) -> RecoverySessionRecord:
        """
        Initialize and persist a new active recovery session record for the user.
        Timestamps are recorded in UTC.
        """
        record = RecoverySessionRecord(
            user_id=user.id,
            activity_id=payload.activity_id,
            activity_type=payload.activity_type,
            activity_title=payload.activity_title,
            guided_content_id=payload.guided_content_id,
            video_id=payload.video_id,
            session_start=datetime.now(timezone.utc),
            session_end=None,
            planned_duration_seconds=payload.planned_duration_seconds,
            elapsed_duration_seconds=0,
            status="active",
            completion_reason=None,
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def complete_session(
        self, user: User, session_id: int, payload: RecoverySessionComplete
    ) -> RecoverySessionRecord:
        """
        Mark an active recovery session as completed with actual elapsed duration.
        Idempotent: if already completed, returns existing record.
        """
        result = await self.db.execute(
            select(RecoverySessionRecord).filter(
                RecoverySessionRecord.id == session_id,
                RecoverySessionRecord.user_id == user.id,
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recovery session not found",
            )

        if record.status == "completed":
            return record

        record.status = "completed"
        record.elapsed_duration_seconds = payload.elapsed_duration_seconds
        record.session_end = datetime.now(timezone.utc)
        record.completion_reason = payload.completion_reason or "completed"

        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def abort_session(
        self, user: User, session_id: int, payload: RecoverySessionAbort
    ) -> RecoverySessionRecord:
        """
        Mark a recovery session as aborted with actual elapsed duration prior to exit.
        Idempotent: if already aborted or completed, returns existing record without duplicating.
        """
        result = await self.db.execute(
            select(RecoverySessionRecord).filter(
                RecoverySessionRecord.id == session_id,
                RecoverySessionRecord.user_id == user.id,
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recovery session not found",
            )

        if record.status in ("aborted", "completed"):
            return record

        record.status = "aborted"
        record.elapsed_duration_seconds = payload.elapsed_duration_seconds
        record.session_end = datetime.now(timezone.utc)
        record.completion_reason = payload.completion_reason or "aborted"

        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def get_user_sessions(
        self, user: User, limit: int = 20
    ) -> list[RecoverySessionRecord]:
        """
        Retrieve recent recovery sessions for the authenticated user only.
        """
        result = await self.db.execute(
            select(RecoverySessionRecord)
            .filter(RecoverySessionRecord.user_id == user.id)
            .order_by(RecoverySessionRecord.session_start.desc())
            .limit(min(100, max(1, limit)))
        )
        return list(result.scalars().all())

    async def get_summary(self, user: User) -> RecoverySummaryDTO:
        """
        Compute aggregate recovery usage insights for the authenticated user.
        All values are derived from real recovery_sessions rows — no fabricated statistics.
        """
        # ── 1. Fetch all user sessions (lightweight; we only need timestamps + a few cols) ──
        all_result = await self.db.execute(
            select(RecoverySessionRecord)
            .filter(RecoverySessionRecord.user_id == user.id)
            .order_by(RecoverySessionRecord.session_start.asc())
        )
        all_sessions: list[RecoverySessionRecord] = list(all_result.scalars().all())

        # ── 2. Build activity breakdown in Python from all_sessions ───────────────────────
        activity_map: dict[str, dict] = defaultdict(lambda: {
            "title": "", "type": "", "count": 0, "completed": 0, "elapsed": 0
        })
        for s in all_sessions:
            key = s.activity_id
            activity_map[key]["title"] = s.activity_title
            activity_map[key]["type"] = s.activity_type
            activity_map[key]["count"] += 1
            if s.status == "completed":
                activity_map[key]["completed"] += 1
            activity_map[key]["elapsed"] += s.elapsed_duration_seconds

        activity_breakdown: list[ActivityUsageDTO] = []
        for aid, data in sorted(
            activity_map.items(), key=lambda x: x[1]["count"], reverse=True
        ):
            avg_elapsed = (
                data["elapsed"] / data["count"] if data["count"] > 0 else 0.0
            )
            activity_breakdown.append(
                ActivityUsageDTO(
                    activity_id=aid,
                    activity_title=data["title"],
                    activity_type=data["type"],
                    session_count=data["count"],
                    completed_count=data["completed"],
                    total_elapsed_seconds=data["elapsed"],
                    average_elapsed_seconds=round(avg_elapsed, 1),
                )
            )

        # ── 4. Top-level counts ────────────────────────────────────────────────────────────
        total = len(all_sessions)
        completed = sum(1 for s in all_sessions if s.status == "completed")
        aborted = sum(1 for s in all_sessions if s.status == "aborted")
        active = sum(1 for s in all_sessions if s.status == "active")

        completion_rate = round((completed / total * 100) if total > 0 else 0.0, 1)
        total_elapsed = sum(s.elapsed_duration_seconds for s in all_sessions)
        completed_elapsed = sum(
            s.elapsed_duration_seconds for s in all_sessions if s.status == "completed"
        )
        avg_completed = round(
            completed_elapsed / completed if completed > 0 else 0.0, 1
        )

        # ── 5. Most-used activity (by session count across all statuses) ──────────────────
        most_used_id: Optional[str] = None
        most_used_title: Optional[str] = None
        if activity_breakdown:
            top = activity_breakdown[0]
            most_used_id = top.activity_id
            most_used_title = top.activity_title

        # ── 6. Time-of-day patterns (bucket by session_start local hour, UTC fallback) ────
        hour_buckets: dict[str, int] = {
            "morning": 0, "afternoon": 0, "evening": 0, "night": 0
        }
        for s in all_sessions:
            ts = s.session_start
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            h = ts.hour
            if 5 <= h < 12:
                hour_buckets["morning"] += 1
            elif 12 <= h < 17:
                hour_buckets["afternoon"] += 1
            elif 17 <= h < 21:
                hour_buckets["evening"] += 1
            else:
                hour_buckets["night"] += 1

        time_of_day_patterns = [
            RecoveryPatternDTO(hour_bucket=bucket, session_count=count)
            for bucket, count in hour_buckets.items()
            if count > 0
        ]

        # ── 7. Streak — consecutive calendar days (UTC date) with ≥1 completed session ────
        completed_dates: set[date] = set()
        for s in all_sessions:
            if s.status == "completed" and s.session_start:
                ts = s.session_start
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                completed_dates.add(ts.date())

        streak = 0
        check_date = datetime.now(timezone.utc).date()
        # If today has no completion yet, start checking from yesterday
        if check_date not in completed_dates:
            check_date -= timedelta(days=1)
        while check_date in completed_dates:
            streak += 1
            check_date -= timedelta(days=1)

        # ── 8. Sessions this ISO week (Mon–Sun) ───────────────────────────────────────────
        today = datetime.now(timezone.utc).date()
        week_start = today - timedelta(days=today.weekday())
        sessions_this_week = sum(
            1 for s in all_sessions
            if s.session_start
            and (
                (s.session_start if s.session_start.tzinfo else s.session_start.replace(tzinfo=timezone.utc)).date()
                >= week_start
            )
            and s.status in ("completed", "aborted")
        )

        return RecoverySummaryDTO(
            total_sessions=total,
            completed_sessions=completed,
            aborted_sessions=aborted,
            active_sessions=active,
            completion_rate_pct=completion_rate,
            total_elapsed_seconds=total_elapsed,
            total_completed_elapsed_seconds=completed_elapsed,
            average_completed_duration_seconds=avg_completed,
            most_used_activity_id=most_used_id,
            most_used_activity_title=most_used_title,
            activity_breakdown=activity_breakdown,
            time_of_day_patterns=time_of_day_patterns,
            streak_days=streak,
            sessions_this_week=sessions_this_week,
        )
