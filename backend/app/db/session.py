from __future__ import annotations
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables on startup (including new Phase 6.5 tables)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        from sqlalchemy import inspect, text
        def add_cols(connection):
            inspector = inspect(connection)

            # ── users table ──────────────────────────────────────────────────
            columns = [c["name"] for c in inspector.get_columns("users")]
            user_new_cols = {
                "keyboard_tracking": "BOOLEAN DEFAULT 1 NOT NULL",
                "heart_rate_telemetry": "BOOLEAN DEFAULT 1 NOT NULL",
                "facial_fatigue_webcam": "BOOLEAN DEFAULT 0 NOT NULL",
                "ambient_noise_mapping": "BOOLEAN DEFAULT 1 NOT NULL",
                "noise_multiplier": "FLOAT DEFAULT 0.1 NOT NULL"
            }
            for col_name, col_type in user_new_cols.items():
                if col_name not in columns:
                    connection.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

            # ── biometric_snapshots table ─────────────────────────────────────
            columns_snapshots = [c["name"] for c in inspector.get_columns("biometric_snapshots")]
            snapshot_new_cols = {
                # Phase 6 (real telemetry – first wave)
                "mouse_velocity": "FLOAT DEFAULT NULL",
                "mouse_clicks": "INTEGER DEFAULT NULL",
                "typing_cadence_ms": "FLOAT DEFAULT NULL",
                "scroll_distance": "FLOAT DEFAULT NULL",
                "scroll_speed": "FLOAT DEFAULT NULL",
                "focus_blur_events": "INTEGER DEFAULT NULL",
                "page_visibility_changes": "INTEGER DEFAULT NULL",
                "idle_time_seconds": "FLOAT DEFAULT NULL",
                "active_session_duration": "FLOAT DEFAULT NULL",
                "user_reported_stress": "INTEGER DEFAULT NULL",
                # Phase 6.5 (richer behavioral signals)
                "mouse_acceleration": "FLOAT DEFAULT NULL",
                "double_clicks": "INTEGER DEFAULT NULL",
                "right_clicks": "INTEGER DEFAULT NULL",
                "inter_key_delay_var": "FLOAT DEFAULT NULL",
                "key_hold_duration_avg": "FLOAT DEFAULT NULL",
                "backspace_freq": "FLOAT DEFAULT NULL",
                "typing_speed_variance": "FLOAT DEFAULT NULL",
                "scroll_acceleration": "FLOAT DEFAULT NULL",
            }
            for col_name, col_type in snapshot_new_cols.items():
                if col_name not in columns_snapshots:
                    connection.execute(text(f"ALTER TABLE biometric_snapshots ADD COLUMN {col_name} {col_type}"))

            # ── interventions table ───────────────────────────────────────────
            columns_interventions = [c["name"] for c in inspector.get_columns("interventions")]
            intervention_new_cols = {
                "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                "severity": "VARCHAR(20) DEFAULT 'MODERATE'",
                "priority": "VARCHAR(20) DEFAULT 'MEDIUM'",
                "confidence": "FLOAT DEFAULT 1.0",
                "recommended_duration_mins": "INTEGER DEFAULT 5",
                "delivery_channel": "VARCHAR(50) DEFAULT 'IN_APP_BANNER'",
                "reason": "VARCHAR(500) DEFAULT NULL",
                "was_dismissed": "BOOLEAN DEFAULT 0 NOT NULL",
                "dismissed_at": "DATETIME DEFAULT NULL",
                "dismissal_reason": "VARCHAR(255) DEFAULT NULL",
                "was_aborted": "BOOLEAN DEFAULT 0 NOT NULL",
                "aborted_at": "DATETIME DEFAULT NULL",
                "abort_reason": "VARCHAR(255) DEFAULT NULL",
                "effectiveness_result": "VARCHAR(30) DEFAULT NULL",
                "effectiveness_score": "FLOAT DEFAULT NULL",
                "effectiveness_evaluated_at": "DATETIME DEFAULT NULL",
                "effectiveness_metrics": "VARCHAR(1000) DEFAULT NULL",
                "effectiveness_summary": "VARCHAR(500) DEFAULT NULL",
                "decision_context": "TEXT DEFAULT NULL",
            }
            for col_name, col_type in intervention_new_cols.items():
                if col_name not in columns_interventions:
                    connection.execute(text(f"ALTER TABLE interventions ADD COLUMN {col_name} {col_type}"))

            # ── recovery_sessions table (G-R9 Recovery Tracking) ─────────────
            if "recovery_sessions" in inspector.get_table_names():
                columns_recovery = [c["name"] for c in inspector.get_columns("recovery_sessions")]
                recovery_cols = {
                    "activity_id": "VARCHAR(100) DEFAULT '' NOT NULL",
                    "activity_type": "VARCHAR(50) DEFAULT '' NOT NULL",
                    "activity_title": "VARCHAR(255) DEFAULT '' NOT NULL",
                    "guided_content_id": "VARCHAR(100) DEFAULT NULL",
                    "video_id": "VARCHAR(100) DEFAULT NULL",
                    "session_start": "DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL",
                    "session_end": "DATETIME DEFAULT NULL",
                    "planned_duration_seconds": "INTEGER DEFAULT 180 NOT NULL",
                    "elapsed_duration_seconds": "INTEGER DEFAULT 0 NOT NULL",
                    "status": "VARCHAR(20) DEFAULT 'active' NOT NULL",
                    "completion_reason": "VARCHAR(255) DEFAULT NULL",
                    "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL",
                    "updated_at": "DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL",
                }
                for col_name, col_type in recovery_cols.items():
                    if col_name not in columns_recovery:
                        connection.execute(text(f"ALTER TABLE recovery_sessions ADD COLUMN {col_name} {col_type}"))

        await conn.run_sync(add_cols)
