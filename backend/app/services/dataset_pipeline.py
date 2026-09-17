"""
dataset_pipeline.py – Phase 9.1: modular, multi-target dataset preparation pipeline.
Supports versioning, split file exports (CSV + Parquet), feature manifests, and multi-target selection.
"""
from __future__ import annotations

import io
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Optional
import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.biometric import BiometricSnapshot, UserGroundTruthLabel
from app.models.stress import StressHistory
from app.models.insights import AIInsight
from app.schemas.ml_dataset import (
    ValidationReport,
    NullSummary,
    OutlierSummary,
    FeatureCatalogue,
    FeatureInfo,
    DatasetStatistics,
    ClassDistribution,
    DatasetSplitInfo,
    QualityReport,
    QualityDimension,
    ReadinessVerdict,
    DatasetVersion,
    FeatureManifest,
    FeatureManifestEntry,
    SplitExportInfo,
)

class DatasetPipeline:
    def __init__(self, user_id: int, db: AsyncSession, target: str = "stress_level"):
        self.user_id = user_id
        self.db = db
        self.target = target if target in ["stress_level", "fatigue_level", "focus_level", "burnout_risk_pct", "cognitive_load_score"] else "stress_level"
        self.schema_version = "1.0.0"

    async def get_raw_dataframe(self) -> pd.DataFrame:
        """
        Pulls biometric_snapshots and pairs them with UserGroundTruthLabel records,
        StressHistory records, and AIInsight records via time-proximity matching.
        Calculates all engineered features and applies cleaning / outlier mitigation.
        """
        snap_query = select(BiometricSnapshot).where(BiometricSnapshot.user_id == self.user_id).order_by(BiometricSnapshot.captured_at.asc())
        snap_res = await self.db.execute(snap_query)
        snapshots = snap_res.scalars().all()

        if not snapshots:
            return pd.DataFrame()

        gt_query = select(UserGroundTruthLabel).where(UserGroundTruthLabel.user_id == self.user_id).order_by(UserGroundTruthLabel.timestamp.asc())
        gt_res = await self.db.execute(gt_query)
        gt_labels = gt_res.scalars().all()

        stress_query = select(StressHistory).where(StressHistory.user_id == self.user_id).order_by(StressHistory.recorded_at.asc())
        stress_res = await self.db.execute(stress_query)
        stress_history = stress_res.scalars().all()

        insight_query = select(AIInsight).where(AIInsight.user_id == self.user_id).order_by(AIInsight.created_at.asc())
        insight_res = await self.db.execute(insight_query)
        insights_list = insight_res.scalars().all()

        snap_data = []
        for s in snapshots:
            snap_data.append({
                "id": s.id,
                "captured_at": pd.to_datetime(s.captured_at),
                "typing_speed_wpm": s.typing_speed_wpm,
                "typing_speed_variance": s.typing_speed_variance,
                "typing_cadence_ms": s.typing_cadence_ms,
                "inter_key_delay_var": s.inter_key_delay_var,
                "key_hold_duration_avg": s.key_hold_duration_avg,
                "backspace_freq": s.backspace_freq,
                "error_burst_per_min": s.error_burst_per_min,
                "mouse_velocity": s.mouse_velocity,
                "mouse_acceleration": s.mouse_acceleration,
                "mouse_clicks": s.mouse_clicks,
                "double_clicks": s.double_clicks,
                "right_clicks": s.right_clicks,
                "scroll_distance": s.scroll_distance,
                "scroll_speed": s.scroll_speed,
                "scroll_acceleration": s.scroll_acceleration,
                "focus_blur_events": s.focus_blur_events,
                "page_visibility_changes": s.page_visibility_changes,
                "idle_time_seconds": s.idle_time_seconds,
                "active_session_duration": s.active_session_duration,
                "heart_rate_bpm": s.heart_rate_bpm,
                "hrv_ms": s.hrv_ms,
                "facial_fatigue_score": s.facial_fatigue_score,
                "ambient_noise_db": s.ambient_noise_db,
                "luminance_pct": s.luminance_pct,
            })
        df_snap = pd.DataFrame(snap_data)

        # 1. Cleaning: Drop duplicate timestamps before merging
        df_snap = df_snap.drop_duplicates(subset=["captured_at"]).sort_values("captured_at")

        df_gt = pd.DataFrame([{
            "timestamp": pd.to_datetime(gt.timestamp),
            "stress_level": gt.stress_level,
            "fatigue_level": gt.fatigue_level,
            "focus_level": gt.focus_level,
            "notes": gt.notes
        } for gt in gt_labels])

        df_stress = pd.DataFrame([{
            "recorded_at": pd.to_datetime(sh.recorded_at),
            "stress_history_level": sh.stress_level,
            "burnout_risk_pct": sh.burnout_risk_pct,
            "focus_reserves_pct": sh.focus_reserves_pct
        } for sh in stress_history])

        df_insights = pd.DataFrame([{
            "insight_created_at": pd.to_datetime(ins.created_at),
            "insight_confidence": ins.confidence_score,
            "insight_risk_delta": ins.risk_delta,
            "insight_risk_direction": ins.risk_direction,
        } for ins in insights_list])

        # Merge User Ground Truth labels
        if not df_gt.empty:
            df_gt = df_gt.sort_values("timestamp")
            df_merged = pd.merge_asof(
                df_snap,
                df_gt,
                left_on="captured_at",
                right_on="timestamp",
                direction="nearest",
                tolerance=pd.Timedelta("5m")
            )
        else:
            df_merged = df_snap.copy()
            df_merged["stress_level"] = np.nan
            df_merged["fatigue_level"] = np.nan
            df_merged["focus_level"] = np.nan
            df_merged["notes"] = np.nan

        # Merge Stress History
        if not df_stress.empty:
            df_stress = df_stress.sort_values("recorded_at")
            df_merged = pd.merge_asof(
                df_merged,
                df_stress,
                left_on="captured_at",
                right_on="recorded_at",
                direction="nearest",
                tolerance=pd.Timedelta("30s")
            )
        else:
            df_merged["stress_history_level"] = np.nan
            df_merged["burnout_risk_pct"] = np.nan
            df_merged["focus_reserves_pct"] = np.nan

        # Merge AI Insights
        if not df_insights.empty:
            df_insights = df_insights.sort_values("insight_created_at")
            df_merged = pd.merge_asof(
                df_merged,
                df_insights,
                left_on="captured_at",
                right_on="insight_created_at",
                direction="nearest",
                tolerance=pd.Timedelta("24h")
            )
        else:
            df_merged["insight_created_at"] = pd.to_datetime(np.nan)
            df_merged["insight_confidence"] = np.nan
            df_merged["insight_risk_delta"] = np.nan
            df_merged["insight_risk_direction"] = np.nan

        # Categorical Encoding for AI Insights
        if "insight_risk_direction" in df_merged.columns:
            df_merged["insight_risk_direction_encoded"] = df_merged["insight_risk_direction"].map({
                "improved": 1,
                "stable": 0,
                "degraded": -1
            }).fillna(0)
        else:
            df_merged["insight_risk_direction_encoded"] = 0.0

        # Feature engineering (All 17 required features)
        df_merged["hour_of_day"] = df_merged["captured_at"].dt.hour
        df_merged["day_of_week"] = df_merged["captured_at"].dt.dayofweek
        df_merged["weekend_flag"] = (df_merged["captured_at"].dt.dayofweek >= 5).astype(int)
        df_merged["session_duration"] = df_merged["active_session_duration"]

        df_merged["idle_ratio"] = df_merged["idle_time_seconds"] / (df_merged["idle_time_seconds"] + df_merged["active_session_duration"] + 1e-5)
        df_merged["active_ratio"] = 1.0 - df_merged["idle_ratio"]
        df_merged["interaction_frequency"] = (df_merged["mouse_clicks"] + df_merged["focus_blur_events"] + df_merged["page_visibility_changes"]) / 30.0

        # Rolling statistics (5-row rolling averages)
        df_merged["rolling_mouse_speed"] = df_merged["mouse_velocity"].rolling(window=5, min_periods=1).mean()
        df_merged["rolling_typing_speed"] = df_merged["typing_speed_wpm"].rolling(window=5, min_periods=1).mean()
        df_merged["rolling_idle_time"] = df_merged["idle_time_seconds"].rolling(window=5, min_periods=1).mean()
        df_merged["rolling_scroll_speed"] = df_merged["scroll_speed"].rolling(window=5, min_periods=1).mean()

        # Rates and variances
        df_merged["focus_change_rate"] = df_merged["focus_blur_events"] / (df_merged["active_session_duration"] / 60.0 + 1e-5)
        df_merged["blur_frequency"] = df_merged["focus_blur_events"]
        df_merged["click_rate"] = df_merged["mouse_clicks"] / (df_merged["active_session_duration"] / 60.0 + 1e-5)
        df_merged["keyboard_variance"] = df_merged["inter_key_delay_var"]

        # Backwards compatibility aliases
        df_merged["rolling_typing_speed_avg"] = df_merged["rolling_typing_speed"]
        df_merged["rolling_mouse_vel_avg"] = df_merged["rolling_mouse_speed"]
        df_merged["rolling_idle_ratio_avg"] = df_merged["idle_ratio"].rolling(window=5, min_periods=1).mean()

        # Outlier Detection and Mitigation: replace values > 3.0 stds with the median
        numeric_cols = df_merged.select_dtypes(include=[np.number]).columns
        cols_to_exclude = ["id", "hour_of_day", "day_of_week", "weekend_flag", "stress_level", "fatigue_level", "focus_level", "burnout_risk_pct", "cognitive_load_score"]
        cols_to_clean = [c for c in numeric_cols if c not in cols_to_exclude]
        
        for col in cols_to_clean:
            col_data = df_merged[col]
            if len(col_data.dropna()) > 3:
                median = col_data.median()
                std = col_data.std()
                mean = col_data.mean()
                if std > 0:
                    z_scores = np.abs((col_data - mean) / std)
                    # Replace outlier rows with median value
                    df_merged.loc[z_scores > 3.0, col] = median

        # Impute missing values with forward-fill, then backward-fill, then 0.0
        for col in cols_to_clean:
            df_merged[col] = df_merged[col].ffill().bfill().fillna(0.0)

        # Compute derived prediction target if selected
        if "stress_level" in df_merged.columns and "fatigue_level" in df_merged.columns and "focus_level" in df_merged.columns:
            s_val = df_merged["stress_level"].fillna(3.0)
            f_val = df_merged["fatigue_level"].fillna(3.0)
            fo_val = df_merged["focus_level"].fillna(3.0)
            df_merged["cognitive_load_score"] = (s_val + f_val + (6.0 - fo_val)) / 3.0
        else:
            df_merged["cognitive_load_score"] = np.nan

        return df_merged

    def validate_dataset(self, df: pd.DataFrame) -> ValidationReport:
        """
        Validates the dataset relative to the selected prediction target.
        """
        if df.empty:
            return ValidationReport(
                total_rows=0,
                duplicate_rows=0,
                duplicate_pct=0.0,
                invalid_timestamps=0,
                null_summary=[],
                outliers=[],
                issues=["Dataset is empty."],
                passed=False,
                target=self.target
            )

        total_rows = len(df)
        dup_count = int(df.duplicated(subset=["captured_at"]).sum())
        dup_pct = (dup_count / total_rows) * 100.0

        null_counts = df.isnull().sum()
        null_sums = []
        for col, count in null_counts.items():
            if count > 0:
                null_sums.append(NullSummary(
                    column=str(col),
                    null_count=int(count),
                    null_pct=float((count / total_rows) * 100.0)
                ))

        outliers_summary = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        cols_to_exclude = ["id", "hour_of_day", "day_of_week", "weekend_flag", "stress_level", "fatigue_level", "focus_level", "burnout_risk_pct", "cognitive_load_score"]
        cols_to_check = [c for c in numeric_cols if c not in cols_to_exclude]
        
        for col in cols_to_check:
            col_data = df[col].dropna()
            if len(col_data) > 3:
                mean = col_data.mean()
                std = col_data.std()
                if std > 0:
                    z_scores = np.abs((col_data - mean) / std)
                    outliers_count = int((z_scores > 3.0).sum())
                    if outliers_count > 0:
                        outliers_summary.append(OutlierSummary(
                            column=str(col),
                            outlier_count=outliers_count,
                            outlier_pct=float((outliers_count / len(col_data)) * 100.0),
                            min_val=float(col_data.min()),
                            max_val=float(col_data.max()),
                            z_score_threshold=3.0
                        ))

        invalid_ts = 0 if df["captured_at"].is_monotonic_increasing else 1

        issues = []
        if dup_count > 0:
            issues.append(f"Found {dup_count} duplicate snapshots by timestamp.")
        if invalid_ts > 0:
            issues.append("Timestamps are not strictly monotonically increasing.")
        
        # Selected prediction target validation
        if self.target in df.columns:
            target_missing = df[self.target].isnull().sum()
            if target_missing == total_rows:
                issues.append(f"All values for target '{self.target}' are missing. Model training cannot proceed.")
            elif target_missing > 0:
                issues.append(f"Missing target labels on {target_missing} records out of {total_rows} for target '{self.target}'.")
        else:
            issues.append(f"Target column '{self.target}' is missing from the dataset.")

        passed = len(issues) == 0 or (df[self.target].notnull().sum() >= 3 and dup_count == 0)

        return ValidationReport(
            total_rows=total_rows,
            duplicate_rows=dup_count,
            duplicate_pct=dup_pct,
            invalid_timestamps=invalid_ts,
            null_summary=null_sums,
            outliers=outliers_summary,
            issues=issues,
            passed=passed,
            target=self.target
        )

    def get_feature_catalogue(self, df: pd.DataFrame) -> FeatureCatalogue:
        """
        Generates the feature list and recommends classification/regression targets.
        """
        manifest = self.get_feature_manifest(df)
        input_features = [
            FeatureInfo(
                name=entry.name,
                source=entry.source,
                dtype=entry.dtype,
                null_pct=entry.null_pct,
                description=entry.description
            ) for entry in manifest.input_features
        ]
        target_labels = [
            FeatureInfo(
                name=entry.name,
                source=entry.source,
                dtype=entry.dtype,
                null_pct=entry.null_pct,
                description=entry.description
            ) for entry in manifest.target_labels
        ]

        return FeatureCatalogue(
            input_features=input_features,
            target_labels=target_labels,
            meta_columns=manifest.meta_columns,
            recommended_primary_target="stress_level",
            target_recommendation_reason="Self-reported stress_level represents direct user-supplied labels (1-5), making it the purest ground-truth target without intermediate model or algorithmic bias."
        )

    def get_feature_manifest(self, df: pd.DataFrame) -> FeatureManifest:
        """
        Generates a structured, self-documenting catalog of features.
        Supports explainability and metadata audits.
        """
        input_entries = [
            FeatureManifestEntry(name="typing_speed_wpm", source="biometric_snapshots", dtype="continuous", description="Words per minute calculated from typing intervals", value_range="[0, 150]", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="typing_speed_variance", source="biometric_snapshots", dtype="continuous", description="Variance in typing speed cadence", value_range="[0, 100]", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="typing_cadence_ms", source="biometric_snapshots", dtype="continuous", description="Average keystroke timing delay in milliseconds", value_range="[0, 2000]", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="inter_key_delay_var", source="biometric_snapshots", dtype="continuous", description="Variance of inter-key delays", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="key_hold_duration_avg", source="biometric_snapshots", dtype="continuous", description="Average duration keystroke is depressed", value_range="[0, 500]", ml_purpose="input_feature", importance_hint="low"),
            FeatureManifestEntry(name="backspace_freq", source="biometric_snapshots", dtype="continuous", description="Frequency of backspace key usage", value_range="unbounded", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="error_burst_per_min", source="biometric_snapshots", dtype="continuous", description="Rate of typo corrections and bursts", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="mouse_velocity", source="biometric_snapshots", dtype="continuous", description="Average velocity of mouse cursor movement", value_range="unbounded", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="mouse_acceleration", source="biometric_snapshots", dtype="continuous", description="Acceleration magnitude of mouse movements", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="mouse_clicks", source="biometric_snapshots", dtype="count", description="Total mouse clicks within telemetry window", value_range="[0, 100]", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="double_clicks", source="biometric_snapshots", dtype="count", description="Double-clicks count within telemetry window", value_range="[0, 50]", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="right_clicks", source="biometric_snapshots", dtype="count", description="Right-clicks count within telemetry window", value_range="[0, 50]", ml_purpose="input_feature", importance_hint="low"),
            FeatureManifestEntry(name="scroll_distance", source="biometric_snapshots", dtype="continuous", description="Total vertical/horizontal scroll distance in pixels", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="scroll_speed", source="biometric_snapshots", dtype="continuous", description="Average speed of scrolling in pixels per second", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="scroll_acceleration", source="biometric_snapshots", dtype="continuous", description="Acceleration magnitude of scrolling", value_range="unbounded", ml_purpose="input_feature", importance_hint="low"),
            FeatureManifestEntry(name="focus_blur_events", source="biometric_snapshots", dtype="count", description="Tab changes and window blur event occurrences", value_range="[0, 20]", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="page_visibility_changes", source="biometric_snapshots", dtype="count", description="Number of times tab visibility toggled", value_range="[0, 20]", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="idle_time_seconds", source="biometric_snapshots", dtype="continuous", description="Total duration of keyboard/mouse inactivity", value_range="[0, 30]", ml_purpose="input_feature", importance_hint="high"),
            FeatureManifestEntry(name="active_session_duration", source="biometric_snapshots", dtype="continuous", description="Active session engagement timer", value_range="[0, 30]", ml_purpose="input_feature", importance_hint="low"),
            FeatureManifestEntry(name="idle_ratio", source="engineered", dtype="ratio", description="Proportion of telemetry window spent idle", value_range="[0.0, 1.0]", ml_purpose="input_feature", importance_hint="high", engineering_formula="idle_time_seconds / (idle_time_seconds + active_session_duration)"),
            FeatureManifestEntry(name="active_ratio", source="engineered", dtype="ratio", description="Proportion of telemetry window spent active", value_range="[0.0, 1.0]", ml_purpose="input_feature", importance_hint="high", engineering_formula="1.0 - idle_ratio"),
            FeatureManifestEntry(name="interaction_frequency", source="engineered", dtype="continuous", description="Interactive events frequency per second", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium", engineering_formula="(mouse_clicks + focus_blur_events + page_visibility_changes) / 30.0"),
            FeatureManifestEntry(name="rolling_mouse_speed", source="engineered", dtype="continuous", description="5-row simple rolling average of mouse velocity", value_range="unbounded", ml_purpose="input_feature", importance_hint="high", engineering_formula="rolling_mean(mouse_velocity, window=5)"),
            FeatureManifestEntry(name="rolling_typing_speed", source="engineered", dtype="continuous", description="5-row simple rolling average of typing speed", value_range="[0, 150]", ml_purpose="input_feature", importance_hint="high", engineering_formula="rolling_mean(typing_speed_wpm, window=5)"),
            FeatureManifestEntry(name="rolling_idle_time", source="engineered", dtype="continuous", description="5-row simple rolling average of idle time", value_range="[0, 30]", ml_purpose="input_feature", importance_hint="high", engineering_formula="rolling_mean(idle_time_seconds, window=5)"),
            FeatureManifestEntry(name="rolling_scroll_speed", source="engineered", dtype="continuous", description="5-row simple rolling average of scroll speed", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium", engineering_formula="rolling_mean(scroll_speed, window=5)"),
            FeatureManifestEntry(name="focus_change_rate", source="engineered", dtype="continuous", description="Rate of tab changes/blur events per minute", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium", engineering_formula="focus_blur_events / (active_session_duration / 60)"),
            FeatureManifestEntry(name="blur_frequency", source="engineered", dtype="count", description="Alias for tab change/blur count", value_range="[0, 20]", ml_purpose="input_feature", importance_hint="medium", engineering_formula="focus_blur_events"),
            FeatureManifestEntry(name="click_rate", source="engineered", dtype="continuous", description="Rate of mouse clicks per minute", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium", engineering_formula="mouse_clicks / (active_session_duration / 60)"),
            FeatureManifestEntry(name="keyboard_variance", source="engineered", dtype="continuous", description="Keystroke interval variance", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium", engineering_formula="inter_key_delay_var"),
            FeatureManifestEntry(name="hour_of_day", source="engineered", dtype="ordinal", description="Hour component extracted from timestamp", value_range="[0, 23]", ml_purpose="input_feature", importance_hint="medium", engineering_formula="timestamp.hour"),
            FeatureManifestEntry(name="day_of_week", source="engineered", dtype="ordinal", description="Day index of week extracted from timestamp", value_range="[0, 6]", ml_purpose="input_feature", importance_hint="medium", engineering_formula="timestamp.dayofweek"),
            FeatureManifestEntry(name="weekend_flag", source="engineered", dtype="binary", description="Flag indicating if session occurred on weekend", value_range="[0, 1]", ml_purpose="input_feature", importance_hint="medium", engineering_formula="1 if day_of_week >= 5 else 0"),
            FeatureManifestEntry(name="session_duration", source="engineered", dtype="continuous", description="Total active duration of interaction session", value_range="unbounded", ml_purpose="input_feature", importance_hint="low", engineering_formula="active_session_duration"),
            FeatureManifestEntry(name="insight_confidence", source="ai_insights", dtype="continuous", description="Confidence score from historical AI insights model", value_range="[0.0, 1.0]", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="insight_risk_delta", source="ai_insights", dtype="continuous", description="Change value in risk metric from AI insights", value_range="unbounded", ml_purpose="input_feature", importance_hint="medium"),
            FeatureManifestEntry(name="insight_risk_direction_encoded", source="ai_insights", dtype="ordinal", description="Direction of risk trend (-1 = degraded, 0 = stable, 1 = improved)", value_range="[-1, 1]", ml_purpose="input_feature", importance_hint="medium", engineering_formula="map_risk(insight_risk_direction)")
        ]

        target_entries = [
            FeatureManifestEntry(name="stress_level", source="user_ground_truth_labels", dtype="ordinal", description="User self-reported stress severity label", value_range="[1, 5]", ml_purpose="target_label", importance_hint="high"),
            FeatureManifestEntry(name="fatigue_level", source="user_ground_truth_labels", dtype="ordinal", description="User self-reported fatigue severity label", value_range="[1, 5]", ml_purpose="target_label", importance_hint="high"),
            FeatureManifestEntry(name="focus_level", source="user_ground_truth_labels", dtype="ordinal", description="User self-reported focus severity label", value_range="[1, 5]", ml_purpose="target_label", importance_hint="high"),
            FeatureManifestEntry(name="burnout_risk_pct", source="stress_history", dtype="continuous", description="Algorithmic cumulative burnout risk tier level", value_range="[0.0, 100.0]", ml_purpose="target_label", importance_hint="medium"),
            FeatureManifestEntry(name="cognitive_load_score", source="engineered", dtype="continuous", description="Composite score of stress, fatigue, and inverted focus levels", value_range="[1.0, 5.0]", ml_purpose="target_label", importance_hint="high", engineering_formula="(stress_level + fatigue_level + (6.0 - focus_level)) / 3.0"),
        ]

        if not df.empty:
            total = len(df)
            for f in input_entries:
                if f.name in df.columns:
                    f.null_pct = float((df[f.name].isnull().sum() / total) * 100.0)
            for t in target_entries:
                if t.name in df.columns:
                    t.null_pct = float((df[t.name].isnull().sum() / total) * 100.0)

        return FeatureManifest(
            schema_version=self.schema_version,
            total_input_features=len(input_entries),
            total_target_labels=len(target_entries),
            input_features=input_entries,
            target_labels=target_entries,
            meta_columns=["id", "captured_at", "timestamp", "recorded_at"],
            generated_at=datetime.now(timezone.utc).isoformat(),
            target=self.target
        )

    def get_dataset_version(self, df: pd.DataFrame) -> DatasetVersion:
        """
        Generates a version descriptor containing deterministically hashed dataset metadata.
        """
        manifest = self.get_feature_manifest(df)
        if df.empty:
            record_count = 0
            labeled_count = 0
            hash_str = "empty"
        else:
            record_count = len(df)
            labeled_count = int(df[self.target].notnull().sum())
            raw_hash_data = f"{self.user_id}:{record_count}:{len(df.columns)}:{self.target}:{df['captured_at'].min()}:{df['captured_at'].max()}"
            hash_str = hashlib.sha256(raw_hash_data.encode("utf-8")).hexdigest()[:16]

        return DatasetVersion(
            version_id=hash_str,
            schema_version=self.schema_version,
            generated_at=datetime.now(timezone.utc).isoformat(),
            user_id=self.user_id,
            target=self.target,
            feature_count=len(manifest.input_features),
            record_count=record_count,
            labeled_count=labeled_count,
            split_strategy="chronological_70_15_15",
            export_format="both",
            pipeline_config={
                "proximity_tolerance_labels": "5m",
                "proximity_tolerance_history": "30s",
                "proximity_tolerance_insights": "24h",
                "rolling_window_rows": 5,
                "outlier_zscore_threshold": 3.0
            }
        )

    def get_dataset_statistics(self, df: pd.DataFrame) -> DatasetStatistics:
        """
        Computes general summary statistics for the dataset, centered on the active target.
        """
        manifest = self.get_feature_manifest(df)
        if df.empty:
            return DatasetStatistics(
                user_count=0,
                telemetry_records=0,
                ground_truth_labels=0,
                stress_history_records=0,
                feature_count=len(manifest.input_features),
                target_count=len(manifest.target_labels),
                date_range_start=None,
                date_range_end=None,
                missing_value_pct_overall=0.0,
                class_distribution=[],
                top_correlated_features=[],
                active_target=self.target
            )

        total_cells = df.size
        missing_cells = df.isnull().sum().sum()
        missing_pct = float((missing_cells / total_cells) * 100.0) if total_cells > 0 else 0.0

        class_dist = []
        if self.target in df.columns and not df[self.target].dropna().empty:
            target_data = df[self.target].dropna()
            if self.target in ["burnout_risk_pct", "cognitive_load_score"]:
                rounded = target_data.round(1)
            else:
                rounded = target_data
            
            counts = rounded.value_counts()
            total_labels = len(rounded)
            for val, count in counts.items():
                class_dist.append(ClassDistribution(
                    label_value=float(val),
                    count=int(count),
                    pct=float((count / total_labels) * 100.0)
                ))

        # Top correlated features
        correlations = []
        if self.target in df.columns and not df[self.target].dropna().empty:
            numeric_df = df.select_dtypes(include=[np.number]).dropna(subset=[self.target])
            if len(numeric_df) > 3:
                corr_matrix = numeric_df.corr()[self.target]
                targets_list = ["stress_level", "fatigue_level", "focus_level", "burnout_risk_pct", "cognitive_load_score", "id", "stress_history_level"]
                for col, score in corr_matrix.items():
                    if col not in targets_list:
                        if not np.isnan(score):
                            correlations.append({
                                "feature": str(col),
                                "correlation": float(score)
                            })
                correlations = sorted(correlations, key=lambda x: abs(x["correlation"]), reverse=True)[:5]

        # Count active users
        user_cnt = 1 if self.user_id else 0

        return DatasetStatistics(
            user_count=user_cnt,
            telemetry_records=len(df),
            ground_truth_labels=int(df["stress_level"].notnull().sum()),
            stress_history_records=int(df["burnout_risk_pct"].notnull().sum()),
            feature_count=len(manifest.input_features),
            target_count=len(manifest.target_labels),
            date_range_start=str(df["captured_at"].min()),
            date_range_end=str(df["captured_at"].max()),
            missing_value_pct_overall=missing_pct,
            class_distribution=class_dist,
            top_correlated_features=correlations,
            active_target=self.target
        )

    def split_dataset(self, df: pd.DataFrame) -> DatasetSplitInfo:
        """
        Splits the dataset chronologically (70% train, 15% val, 15% test).
        """
        if df.empty:
            return DatasetSplitInfo(
                train_rows=0,
                val_rows=0,
                test_rows=0,
                train_pct=70.0,
                val_pct=15.0,
                test_pct=15.0,
                train_date_range=[None, None],
                val_date_range=[None, None],
                test_date_range=[None, None],
                leakage_risk="none",
                target=self.target
            )

        df_sorted = df.sort_values("captured_at")
        total = len(df_sorted)
        
        train_end = int(total * 0.70)
        val_end = int(total * 0.85)

        df_train = df_sorted.iloc[:train_end]
        df_val = df_sorted.iloc[train_end:val_end]
        df_test = df_sorted.iloc[val_end:]

        # Validate leakage risk (verify no overlap in dates)
        leakage = "none"
        if not df_train.empty and not df_val.empty:
            if df_train["captured_at"].max() >= df_val["captured_at"].min():
                leakage = "temporal_overlap_train_val"
        if not df_val.empty and not df_test.empty:
            if df_val["captured_at"].max() >= df_test["captured_at"].min():
                leakage = "temporal_overlap_val_test"

        return DatasetSplitInfo(
            strategy="chronological",
            train_rows=len(df_train),
            val_rows=len(df_val),
            test_rows=len(df_test),
            train_pct=float((len(df_train) / total) * 100.0) if total > 0 else 0.0,
            val_pct=float((len(df_val) / total) * 100.0) if total > 0 else 0.0,
            test_pct=float((len(df_test) / total) * 100.0) if total > 0 else 0.0,
            train_date_range=[
                str(df_train["captured_at"].min()) if not df_train.empty else None,
                str(df_train["captured_at"].max()) if not df_train.empty else None
            ],
            val_date_range=[
                str(df_val["captured_at"].min()) if not df_val.empty else None,
                str(df_val["captured_at"].max()) if not df_val.empty else None
            ],
            test_date_range=[
                str(df_test["captured_at"].min()) if not df_test.empty else None,
                str(df_test["captured_at"].max()) if not df_test.empty else None
            ],
            leakage_risk=leakage,
            target=self.target
        )

    def write_split_files(self, df: pd.DataFrame, base_export_dir: str = "artifacts/ml_splits") -> SplitExportInfo:
        """
        Creates and writes train, validation, and test split CSV and Parquet files on disk.
        Also outputs a feature manifest file.
        """
        os.makedirs(base_export_dir, exist_ok=True)
        version_meta = self.get_dataset_version(df)
        version_id = version_meta.version_id

        # Target folder for this specific version split
        version_dir = os.path.join(base_export_dir, version_id)
        os.makedirs(version_dir, exist_ok=True)

        if df.empty:
            train_rows = val_rows = test_rows = 0
            train_path = val_path = test_path = manifest_path = ""
            train_path_pq = val_path_pq = test_path_pq = ""
        else:
            df_sorted = df.copy().sort_values("captured_at")
            
            # Exclude metadata index/reference values not fed to modeling
            cols_to_drop = [c for c in ["id", "timestamp", "recorded_at", "insight_created_at"] if c in df_sorted.columns]
            df_cleaned = df_sorted.drop(columns=cols_to_drop, errors="ignore")

            total = len(df_cleaned)
            train_end = int(total * 0.70)
            val_end = int(total * 0.85)

            df_train = df_cleaned.iloc[:train_end]
            df_val = df_cleaned.iloc[train_end:val_end]
            df_test = df_cleaned.iloc[val_end:]

            train_rows = len(df_train)
            val_rows = len(df_val)
            test_rows = len(df_test)

            # Define absolute paths
            train_path = os.path.abspath(os.path.join(version_dir, "train.csv"))
            val_path = os.path.abspath(os.path.join(version_dir, "val.csv"))
            test_path = os.path.abspath(os.path.join(version_dir, "test.csv"))

            train_path_pq = os.path.abspath(os.path.join(version_dir, "train.parquet"))
            val_path_pq = os.path.abspath(os.path.join(version_dir, "val.parquet"))
            test_path_pq = os.path.abspath(os.path.join(version_dir, "test.parquet"))

            manifest_path = os.path.abspath(os.path.join(version_dir, "manifest.json"))

            # Write CSV files
            df_train.to_csv(train_path, index=False)
            df_val.to_csv(val_path, index=False)
            df_test.to_csv(test_path, index=False)

            # Write Parquet files using pyarrow engine
            df_train.to_parquet(train_path_pq, index=False, engine="pyarrow")
            df_val.to_parquet(val_path_pq, index=False, engine="pyarrow")
            df_test.to_parquet(test_path_pq, index=False, engine="pyarrow")

            # Write manifest JSON
            manifest_data = self.get_feature_manifest(df).model_dump()
            with open(manifest_path, "w", encoding="utf-8") as mf:
                json.dump(manifest_data, mf, indent=2)

        return SplitExportInfo(
            version_id=version_id,
            target=self.target,
            train_file=train_path,
            val_file=val_path,
            test_file=test_path,
            train_parquet_file=train_path_pq,
            val_parquet_file=val_path_pq,
            test_parquet_file=test_path_pq,
            train_rows=train_rows,
            val_rows=val_rows,
            test_rows=test_rows,
            format="both",
            export_dir=os.path.abspath(version_dir),
            generated_at=datetime.now(timezone.utc).isoformat(),
            manifest_file=manifest_path
        )

    def generate_quality_report(self, df: pd.DataFrame, val_rep: ValidationReport) -> QualityReport:
        """
        Evaluates data quality metrics score on 0-10 scale.
        """
        strengths = []
        weaknesses = []
        recommendations = []

        total_rows = len(df)
        labeled_rows = int(df[self.target].notnull().sum()) if not df.empty else 0

        score_completeness = 10.0 if total_rows >= 200 else (total_rows / 20.0)
        if total_rows >= 200:
            strengths.append("High volume of behavioral telemetry snapshots.")
        else:
            weaknesses.append(f"Low telemetry count ({total_rows} snapshots). Suggest at least 200 samples.")
            recommendations.append("Continue running the dashboard to log more active telemetry sessions.")

        score_labels = 10.0 if labeled_rows >= 10 else (labeled_rows * 1.0)
        if labeled_rows >= 10:
            strengths.append(f"Adequate labels logged ({labeled_rows} samples) for selected target '{self.target}'.")
        else:
            weaknesses.append(f"Insufficient label samples ({labeled_rows} total) for selected target '{self.target}'.")
            recommendations.append(f"Submit wellness check-in prompts to tag telemetry windows with ground-truth '{self.target}' values.")

        score_validation = 10.0
        if val_rep.duplicate_rows > 0:
            score_validation -= 3.0
            weaknesses.append("Duplicate timestamps detected in telemetry pipeline.")
            recommendations.append("Deduplicate telemetry inputs using unique timestamps.")
        if val_rep.invalid_timestamps > 0:
            score_validation -= 2.0
            weaknesses.append("Non-monotonic timestamp sequence.")

        score_missingness = 10.0
        if not df.empty:
            crucial_cols = ["typing_speed_wpm", "mouse_velocity", "scroll_speed", "idle_time_seconds"]
            missing_cols_count = sum(df[c].isnull().sum() for c in crucial_cols if c in df.columns)
            if missing_cols_count > 0:
                score_missingness -= min(5.0, missing_cols_count * 0.5)
                weaknesses.append("Missing core input metrics.")
                recommendations.append("Verify interaction tracking is active during operational sessions.")

        dimensions = [
            QualityDimension(dimension="Data Quantity (Completeness)", score=float(score_completeness), weight=0.3, notes="Pertains to sample counts."),
            QualityDimension(dimension="Label Count (Ground Truth)", score=float(score_labels), weight=0.4, notes="Target labeled count."),
            QualityDimension(dimension="Validation Cleanness", score=float(score_validation), weight=0.15, notes="Presence of duplicates, ordering issues."),
            QualityDimension(dimension="Feature Completeness", score=float(score_missingness), weight=0.15, notes="Availability of mouse/keyboard telemetry."),
        ]

        overall_score = sum(d.score * d.weight for d in dimensions)

        return QualityReport(
            dimensions=dimensions,
            overall_score=round(float(overall_score), 2),
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            generated_at=datetime.now(timezone.utc).isoformat(),
            target=self.target
        )

    def get_readiness_verdict(self, df: pd.DataFrame, report: QualityReport) -> ReadinessVerdict:
        """
        Outputs diagnostic verdict of XGBoost model readiness.
        """
        score = report.overall_score
        total_rows = len(df)
        labeled_rows = int(df[self.target].notnull().sum()) if not df.empty else 0

        blocking = []
        reasons = []
        next_steps = []

        if total_rows == 0:
            verdict = "NOT_READY"
            verdict_emoji = "❌"
            blocking.append("Telemetry dataset is completely empty.")
            reasons.append("No active session data recorded.")
            next_steps.append("Launch frontend app to ingest live keyboard/mouse telemetry.")
        elif labeled_rows < 3:
            verdict = "PARTIAL"
            verdict_emoji = "⚠"
            blocking.append(f"Too few labels for target '{self.target}' (minimum 3 required).")
            reasons.append(f"Only {labeled_rows} labels found.")
            next_steps.append(f"Prompt user with the Wellness Check-in widget to collect target labels.")
        elif score < 6.5:
            verdict = "PARTIAL"
            verdict_emoji = "⚠"
            reasons.append(f"Dataset contains enough labels but has lower overall quality ({score}/10).")
            next_steps.append("Gather higher density of telemetry sessions corresponding to ground-truth label submissions.")
        else:
            verdict = "READY"
            verdict_emoji = "✅"
            reasons.append("Telemetry pipeline features are complete and populated with sufficient ground-truth targets.")
            next_steps.append("Proceed to Phase 7.2 to train, validate and serialize the XGBoost classifier model.")

        return ReadinessVerdict(
            verdict=verdict,
            verdict_emoji=verdict_emoji,
            quality_score=score,
            reasons=reasons,
            blocking_issues=blocking,
            total_training_samples=labeled_rows,
            estimated_model_quality="High" if verdict == "READY" else ("Medium" if verdict == "PARTIAL" else "None"),
            next_steps=next_steps,
            target=self.target
        )

    def export_dataset_csv(self, df: pd.DataFrame) -> bytes:
        """
        Exports the compiled dataset to CSV bytes.
        """
        if df.empty:
            return b""
        
        df_export = df.copy().sort_values("captured_at")
        cols_to_drop = [c for c in ["id", "timestamp", "recorded_at", "insight_created_at"] if c in df_export.columns]
        df_export = df_export.drop(columns=cols_to_drop, errors="ignore")

        csv_buffer = io.StringIO()
        df_export.to_csv(csv_buffer, index=False)
        return csv_buffer.getvalue().encode("utf-8")

    def export_dataset_parquet(self, df: pd.DataFrame) -> bytes:
        """
        Exports the compiled dataset to Parquet bytes using pyarrow engine.
        """
        if df.empty:
            return b""
        
        df_export = df.copy().sort_values("captured_at")
        cols_to_drop = [c for c in ["id", "timestamp", "recorded_at", "insight_created_at"] if c in df_export.columns]
        df_export = df_export.drop(columns=cols_to_drop, errors="ignore")

        parquet_buffer = io.BytesIO()
        df_export.to_parquet(parquet_buffer, index=False, engine="pyarrow")
        return parquet_buffer.getvalue()
