from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.biometric import BiometricSnapshot, UserGroundTruthLabel


# ─── Core Feature Extraction ──────────────────────────────────────────────────

def extract_features_for_window(snapshots: list[BiometricSnapshot]) -> dict[str, Any]:
    """
    Extract aggregations, statistical variances, totals, frequencies,
    and ratios from a window of raw biometric and telemetry snapshots.

    All features are computed purely from numerical behavioral metadata.
    No character data is ever stored or processed here.
    """
    _EMPTY: dict[str, Any] = {
        # Keyboard
        "typing_speed_avg": 0.0,
        "typing_speed_var": 0.0,
        "typing_speed_variance_avg": 0.0,
        "typing_cadence_avg": 0.0,
        "typing_cadence_var": 0.0,
        "inter_key_delay_var_avg": 0.0,
        "key_hold_duration_avg": 0.0,
        "backspace_freq_avg": 0.0,
        "error_burst_avg": 0.0,
        # Mouse
        "mouse_velocity_avg": 0.0,
        "mouse_velocity_var": 0.0,
        "mouse_acceleration_avg": 0.0,
        "mouse_clicks_total": 0,
        "mouse_clicks_frequency": 0.0,
        "double_clicks_total": 0,
        "right_clicks_total": 0,
        # Scroll
        "scroll_distance_total": 0.0,
        "scroll_speed_avg": 0.0,
        "scroll_acceleration_avg": 0.0,
        # Physiological (optional hardware sensor)
        "heart_rate_avg": 0.0,
        "heart_rate_var": 0.0,
        "hrv_avg": 0.0,
        "hrv_var": 0.0,
        "facial_fatigue_avg": 0.0,
        # Session
        "focus_blur_total": 0,
        "page_visibility_changes_total": 0,
        "idle_ratio": 0.0,
        "active_ratio": 0.0,
        "active_session_duration_max": 0.0,
        "interaction_frequency": 0.0,
    }

    if not snapshots:
        return _EMPTY

    n = len(snapshots)

    def _avg_var(field: str) -> tuple[float, float]:
        """Return (mean, variance) for a nullable float column across snapshots."""
        vals = [getattr(s, field) for s in snapshots if getattr(s, field) is not None]
        if not vals:
            return 0.0, 0.0
        mean = sum(vals) / len(vals)
        var = sum((x - mean) ** 2 for x in vals) / len(vals) if len(vals) > 1 else 0.0
        return float(mean), float(var)

    def _avg(field: str) -> float:
        return _avg_var(field)[0]

    def _total(field: str) -> float:
        vals = [getattr(s, field) for s in snapshots if getattr(s, field) is not None]
        return float(sum(vals))

    def _total_int(field: str) -> int:
        vals = [getattr(s, field) for s in snapshots if getattr(s, field) is not None]
        return int(sum(vals))

    # --- Keyboard ---
    typing_speed_avg, typing_speed_var = _avg_var("typing_speed_wpm")
    typing_cadence_avg, typing_cadence_var = _avg_var("typing_cadence_ms")

    # --- Mouse ---
    mouse_velocity_avg, mouse_velocity_var = _avg_var("mouse_velocity")

    clicks_total = _total_int("mouse_clicks")
    # Frequency = clicks per minute (each snapshot window = 30 s by default)
    window_minutes = (n * 30.0) / 60.0
    clicks_freq = (clicks_total / window_minutes) if window_minutes > 0 else 0.0

    # --- Session / Idle ---
    idle_times = [s.idle_time_seconds for s in snapshots if s.idle_time_seconds is not None]
    idle_total = sum(idle_times)
    total_time_estimate = n * 30.0  # 30-second windows
    idle_ratio = min(1.0, idle_total / total_time_estimate) if total_time_estimate > 0 else 0.0
    active_ratio = max(0.0, 1.0 - idle_ratio)

    sessions = [s.active_session_duration for s in snapshots if s.active_session_duration is not None]
    session_max = max(sessions) if sessions else 0.0

    # Interaction frequency = (clicks + scroll_events_proxy) per minute
    scroll_dist = _total("scroll_distance")
    scroll_events_proxy = scroll_dist / 100.0  # rough scroll event count
    interaction_frequency = (clicks_total + scroll_events_proxy) / window_minutes if window_minutes > 0 else 0.0

    return {
        # Keyboard
        "typing_speed_avg": typing_speed_avg,
        "typing_speed_var": typing_speed_var,
        "typing_speed_variance_avg": _avg("typing_speed_variance"),
        "typing_cadence_avg": typing_cadence_avg,
        "typing_cadence_var": typing_cadence_var,
        "inter_key_delay_var_avg": _avg("inter_key_delay_var"),
        "key_hold_duration_avg": _avg("key_hold_duration_avg"),
        "backspace_freq_avg": _avg("backspace_freq"),
        "error_burst_avg": _avg("error_burst_per_min"),
        # Mouse
        "mouse_velocity_avg": mouse_velocity_avg,
        "mouse_velocity_var": mouse_velocity_var,
        "mouse_acceleration_avg": _avg("mouse_acceleration"),
        "mouse_clicks_total": clicks_total,
        "mouse_clicks_frequency": clicks_freq,
        "double_clicks_total": _total_int("double_clicks"),
        "right_clicks_total": _total_int("right_clicks"),
        # Scroll
        "scroll_distance_total": scroll_dist,
        "scroll_speed_avg": _avg("scroll_speed"),
        "scroll_acceleration_avg": _avg("scroll_acceleration"),
        # Physiological (optional)
        "heart_rate_avg": _avg_var("heart_rate_bpm")[0],
        "heart_rate_var": _avg_var("heart_rate_bpm")[1],
        "hrv_avg": _avg_var("hrv_ms")[0],
        "hrv_var": _avg_var("hrv_ms")[1],
        "facial_fatigue_avg": _avg("facial_fatigue_score"),
        # Session
        "focus_blur_total": _total_int("focus_blur_events"),
        "page_visibility_changes_total": _total_int("page_visibility_changes"),
        "idle_ratio": idle_ratio,
        "active_ratio": active_ratio,
        "active_session_duration_max": session_max,
        "interaction_frequency": interaction_frequency,
    }


# ─── Context Enrichment ───────────────────────────────────────────────────────

async def enrich_features_with_context(
    features: dict[str, Any],
    user_id: int,
    db: AsyncSession,
    reference_time: datetime | None = None,
) -> dict[str, Any]:
    """
    Add time-context and historical label features that cannot be derived
    from a single snapshot window alone.

    Injects:
      - time_of_day_hour (0–23)
      - day_of_week (0=Mon … 6=Sun)
      - prev_stress_label (last ground-truth label, or -1 if none)
      - prev_fatigue_label (-1 if none)
      - prev_focus_label (-1 if none)
      - break_count_today (number of ground-truth submissions today)
    """
    now = reference_time or datetime.now(timezone.utc)
    features = dict(features)  # copy

    features["time_of_day_hour"] = now.hour
    features["day_of_week"] = now.weekday()  # 0 = Monday

    # Last ground-truth label
    result = await db.execute(
        select(UserGroundTruthLabel)
        .where(UserGroundTruthLabel.user_id == user_id)
        .order_by(desc(UserGroundTruthLabel.timestamp))
        .limit(1)
    )
    last_label: UserGroundTruthLabel | None = result.scalar_one_or_none()

    features["prev_stress_label"] = last_label.stress_level if last_label else -1
    features["prev_fatigue_label"] = last_label.fatigue_level if (last_label and last_label.fatigue_level) else -1
    features["prev_focus_label"] = last_label.focus_level if (last_label and last_label.focus_level) else -1

    # Break count today = ground-truth submissions since midnight
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    count_result = await db.execute(
        select(UserGroundTruthLabel)
        .where(
            and_(
                UserGroundTruthLabel.user_id == user_id,
                UserGroundTruthLabel.timestamp >= day_start,
            )
        )
    )
    features["break_count_today"] = len(list(count_result.scalars().all()))

    return features


# ─── Rolling Feature Query ────────────────────────────────────────────────────

async def calculate_rolling_features(
    user_id: int,
    window_minutes: int,
    db: AsyncSession,
    enrich: bool = True,
) -> dict[str, Any]:
    """
    Retrieve and aggregate real snapshots for a user in the last N minutes,
    then optionally enrich with time-context features.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)

    result = await db.execute(
        select(BiometricSnapshot)
        .where(
            and_(
                BiometricSnapshot.user_id == user_id,
                BiometricSnapshot.captured_at >= cutoff,
            )
        )
        .order_by(desc(BiometricSnapshot.captured_at))
    )
    snapshots = list(result.scalars().all())
    features = extract_features_for_window(snapshots)

    if enrich and snapshots:
        features = await enrich_features_with_context(features, user_id, db)

    return features


# ─── ML Dataset Builder ───────────────────────────────────────────────────────

async def get_ml_dataset(
    db: AsyncSession,
    user_id: Optional[int] = None,
    window_minutes: int = 5,
    min_snapshots: int = 3,
    enrich: bool = True,
) -> list[dict[str, Any]]:
    """
    Build a supervised training dataset.

    For each snapshot that has a user_reported_stress label, aggregate
    the preceding window of snapshots and produce one feature-vector row.
    Optionally enriches with time context.
    """
    query = select(BiometricSnapshot).where(
        BiometricSnapshot.user_reported_stress.isnot(None)
    )
    if user_id is not None:
        query = query.where(BiometricSnapshot.user_id == user_id)

    query = query.order_by(BiometricSnapshot.captured_at)
    labeled_result = await db.execute(query)
    labeled_snapshots = list(labeled_result.scalars().all())

    dataset: list[dict[str, Any]] = []

    for target in labeled_snapshots:
        start_time = target.captured_at - timedelta(minutes=window_minutes)

        preceding_result = await db.execute(
            select(BiometricSnapshot)
            .where(
                and_(
                    BiometricSnapshot.user_id == target.user_id,
                    BiometricSnapshot.captured_at >= start_time,
                    BiometricSnapshot.captured_at < target.captured_at,
                )
            )
            .order_by(BiometricSnapshot.captured_at)
        )
        preceding = list(preceding_result.scalars().all())

        if len(preceding) < min_snapshots:
            continue

        features = extract_features_for_window(preceding)

        if enrich:
            features = await enrich_features_with_context(
                features,
                target.user_id,
                db,
                reference_time=target.captured_at,
            )

        features["label"] = target.user_reported_stress
        features["user_id"] = target.user_id
        features["captured_at"] = target.captured_at.isoformat()
        dataset.append(features)

    return dataset


# ─── Ground-Truth Dataset Builder ────────────────────────────────────────────

async def get_ground_truth_ml_dataset(
    db: AsyncSession,
    user_id: Optional[int] = None,
    window_minutes: int = 30,
    min_snapshots: int = 3,
) -> list[dict[str, Any]]:
    """
    Build a supervised training dataset from the dedicated UserGroundTruthLabel table.

    For each ground-truth label, aggregate the preceding window of biometric
    snapshots and produce one feature-vector row. This is the primary training
    source for the future XGBoost model.
    """
    query = select(UserGroundTruthLabel)
    if user_id is not None:
        query = query.where(UserGroundTruthLabel.user_id == user_id)
    query = query.order_by(UserGroundTruthLabel.timestamp)

    label_result = await db.execute(query)
    labels = list(label_result.scalars().all())

    dataset: list[dict[str, Any]] = []

    for label in labels:
        start_time = label.timestamp - timedelta(minutes=window_minutes)

        preceding_result = await db.execute(
            select(BiometricSnapshot)
            .where(
                and_(
                    BiometricSnapshot.user_id == label.user_id,
                    BiometricSnapshot.captured_at >= start_time,
                    BiometricSnapshot.captured_at <= label.timestamp,
                )
            )
            .order_by(BiometricSnapshot.captured_at)
        )
        preceding = list(preceding_result.scalars().all())

        if len(preceding) < min_snapshots:
            continue

        features = extract_features_for_window(preceding)
        features = await enrich_features_with_context(
            features, label.user_id, db, reference_time=label.timestamp
        )

        features["label_stress"] = label.stress_level
        features["label_fatigue"] = label.fatigue_level
        features["label_focus"] = label.focus_level
        features["user_id"] = label.user_id
        features["label_timestamp"] = label.timestamp.isoformat()
        dataset.append(features)

    return dataset
