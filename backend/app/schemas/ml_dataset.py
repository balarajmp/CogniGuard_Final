"""
ml_dataset.py – Pydantic schemas for Phase 7.1 Dataset Preparation API.
Enhanced with multi-target support, dataset versioning, feature manifest, and split export metadata.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ─── Prediction Target Registry ───────────────────────────────────────────────

# All supported prediction targets and their human-readable descriptions.
PREDICTION_TARGETS: dict[str, dict[str, str]] = {
    "stress_level": {
        "description": "Self-reported perceived stress (1–5 ordinal)",
        "task": "multiclass_classification",
        "source": "user_ground_truth_labels",
        "recommended": "true",
    },
    "fatigue_level": {
        "description": "Self-reported fatigue / energy depletion (1–5 ordinal)",
        "task": "multiclass_classification",
        "source": "user_ground_truth_labels",
        "recommended": "false",
    },
    "focus_level": {
        "description": "Self-reported cognitive focus clarity (1–5 ordinal)",
        "task": "multiclass_classification",
        "source": "user_ground_truth_labels",
        "recommended": "false",
    },
    "burnout_risk_pct": {
        "description": "System-computed cumulative burnout risk score (0–100 continuous)",
        "task": "regression",
        "source": "stress_history",
        "recommended": "false",
    },
    "cognitive_load_score": {
        "description": "Derived composite of stress + fatigue + inverted focus (1–5 continuous)",
        "task": "regression",
        "source": "engineered",
        "recommended": "false",
    },
}

DEFAULT_TARGET = "stress_level"


# ─── Validation ──────────────────────────────────────────────────────────────

class NullSummary(BaseModel):
    column: str
    null_count: int
    null_pct: float


class OutlierSummary(BaseModel):
    column: str
    outlier_count: int
    outlier_pct: float
    min_val: float
    max_val: float
    z_score_threshold: float = 3.0


class ValidationReport(BaseModel):
    total_rows: int
    duplicate_rows: int
    duplicate_pct: float
    invalid_timestamps: int
    null_summary: list[NullSummary]
    outliers: list[OutlierSummary]
    issues: list[str]
    passed: bool
    target: str = DEFAULT_TARGET


# ─── Feature Catalogue ────────────────────────────────────────────────────────

class FeatureInfo(BaseModel):
    name: str
    source: str
    dtype: str
    null_pct: float
    description: str


class FeatureCatalogue(BaseModel):
    input_features: list[FeatureInfo]
    target_labels: list[FeatureInfo]
    meta_columns: list[str]
    recommended_primary_target: str
    target_recommendation_reason: str
    available_targets: dict[str, dict[str, str]] = Field(
        default_factory=lambda: PREDICTION_TARGETS
    )


# ─── Feature Manifest (for explainability / maintenance) ─────────────────────

class FeatureManifestEntry(BaseModel):
    name: str
    source: str               # table or "engineered"
    dtype: str                # continuous | count | ordinal | ratio | binary
    description: str
    value_range: str          # e.g. "[0, 100]" or "unbounded"
    ml_purpose: str           # "input_feature" | "target_label" | "meta"
    importance_hint: str      # "high" | "medium" | "low"
    null_pct: float = 0.0
    engineering_formula: Optional[str] = None   # filled for engineered features


class FeatureManifest(BaseModel):
    schema_version: str
    total_input_features: int
    total_target_labels: int
    input_features: list[FeatureManifestEntry]
    target_labels: list[FeatureManifestEntry]
    meta_columns: list[str]
    generated_at: str
    target: str


# ─── Dataset Statistics ───────────────────────────────────────────────────────

class ClassDistribution(BaseModel):
    label_value: float
    count: int
    pct: float


class DatasetStatistics(BaseModel):
    user_count: int
    telemetry_records: int
    ground_truth_labels: int
    stress_history_records: int
    feature_count: int
    target_count: int
    date_range_start: Optional[str]
    date_range_end: Optional[str]
    missing_value_pct_overall: float
    class_distribution: list[ClassDistribution]
    top_correlated_features: list[dict[str, Any]]
    active_target: str = DEFAULT_TARGET


# ─── Dataset Versioning ───────────────────────────────────────────────────────

class DatasetVersion(BaseModel):
    version_id: str               # 16-char deterministic SHA-256 hex
    schema_version: str           # pipeline schema version e.g. "1.0.0"
    generated_at: str
    user_id: int
    target: str
    feature_count: int
    record_count: int
    labeled_count: int            # rows with non-null target value
    split_strategy: str           # "chronological_70_15_15"
    export_format: str            # "csv" | "parquet"
    pipeline_config: dict[str, Any]


# ─── Dataset Split ────────────────────────────────────────────────────────────

class DatasetSplitInfo(BaseModel):
    strategy: str = "chronological"
    train_rows: int
    val_rows: int
    test_rows: int
    train_pct: float
    val_pct: float
    test_pct: float
    train_date_range: list[Optional[str]]
    val_date_range: list[Optional[str]]
    test_date_range: list[Optional[str]]
    leakage_risk: str = "none"
    target: str = DEFAULT_TARGET


# ─── Split Export (files written to disk) ────────────────────────────────────

class SplitExportInfo(BaseModel):
    version_id: str
    target: str
    train_file: str           # absolute path to train CSV
    val_file: str
    test_file: str
    train_parquet_file: Optional[str] = None
    val_parquet_file: Optional[str] = None
    test_parquet_file: Optional[str] = None
    train_rows: int
    val_rows: int
    test_rows: int
    format: str               # "csv" | "parquet" | "both"
    export_dir: str
    generated_at: str
    manifest_file: str        # path to manifest.json in the same directory


# ─── Quality Report ───────────────────────────────────────────────────────────

class QualityDimension(BaseModel):
    dimension: str
    score: float
    weight: float
    notes: str


class QualityReport(BaseModel):
    dimensions: list[QualityDimension]
    overall_score: float
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    generated_at: str
    target: str = DEFAULT_TARGET


# ─── Readiness Verdict ────────────────────────────────────────────────────────

class ReadinessVerdict(BaseModel):
    verdict: str
    verdict_emoji: str
    quality_score: float
    reasons: list[str]
    blocking_issues: list[str]
    total_training_samples: int
    estimated_model_quality: str
    next_steps: list[str]
    target: str = DEFAULT_TARGET


# ─── Export ───────────────────────────────────────────────────────────────────

class DatasetExportMeta(BaseModel):
    format: str
    rows: int
    columns: int
    features_included: list[str]
    target_column: str
    exported_at: str
    file_size_bytes: int
