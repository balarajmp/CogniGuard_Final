"""
ml_dataset.py – Phase 9.1 Router for Machine Learning Dataset Preparation APIs.
Enhanced with custom target selections, feature manifests, and split file export on disk.
"""
from __future__ import annotations

import io
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.services.dataset_pipeline import DatasetPipeline
from app.schemas.ml_dataset import (
    DatasetStatistics,
    ValidationReport,
    FeatureCatalogue,
    QualityReport,
    ReadinessVerdict,
    DatasetSplitInfo,
    FeatureManifest,
    DatasetVersion,
    SplitExportInfo,
)

router = APIRouter()

@router.get("", response_model=list[dict[str, Any]])
async def get_raw_dataset_records(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> list[dict[str, Any]]:
    """
    Returns the complete dataset as a JSON list of records containing all engineered features and selected target.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    if df.empty:
        return []
    
    # Handle datetime objects to ISO strings
    df_copy = df.copy()
    for col in df_copy.columns:
        if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
            df_copy[col] = df_copy[col].dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            
    # Replace NaN with None so it serializes to JSON null
    df_copy = df_copy.replace({np.nan: None})
    return df_copy.to_dict(orient="records")


@router.get("/stats", response_model=DatasetStatistics)
async def get_dataset_stats(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DatasetStatistics:
    """
    Retrieves statistical summaries of the collected telemetry, ground-truth labels, and target distributions.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    return pipeline.get_dataset_statistics(df)


@router.get("/validate", response_model=ValidationReport)
async def validate_dataset(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> ValidationReport:
    """
    Performs data quality validation checks for null counts, duplicates, outliers, and sequence ordering.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    return pipeline.validate_dataset(df)


@router.get("/features", response_model=FeatureCatalogue)
async def get_features_catalogue(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> FeatureCatalogue:
    """
    Lists the input feature catalogue, target labels, and recommends target configurations.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    return pipeline.get_feature_catalogue(df)


@router.get("/manifest", response_model=FeatureManifest)
async def get_feature_manifest(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> FeatureManifest:
    """
    Retrieves a production-grade Feature Manifest for model explainability and maintenance.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    return pipeline.get_feature_manifest(df)


@router.get("/version", response_model=DatasetVersion)
async def get_dataset_version_meta(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DatasetVersion:
    """
    Retrieves dataset version metadata with a unique, content-derived version identifier.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    return pipeline.get_dataset_version(df)


@router.get("/quality-report", response_model=QualityReport)
async def get_quality_report(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> QualityReport:
    """
    Evaluates data cleanliness, sample size completeness, label density, and compiles a quality score report.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    val_rep = pipeline.validate_dataset(df)
    return pipeline.generate_quality_report(df, val_rep)


@router.get("/quality", response_model=QualityReport)
async def get_quality_report_alias(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> QualityReport:
    """
    Alias route for get_quality_report.
    """
    return await get_quality_report(target=target, db=db, current_user=current_user)


@router.get("/readiness", response_model=ReadinessVerdict)
async def get_readiness_verdict(
    target: str = "stress_level",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> ReadinessVerdict:
    """
    Returns the diagnostic verdict of whether the collected dataset is suitable/ready for XGBoost training.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    val_rep = pipeline.validate_dataset(df)
    qual_rep = pipeline.generate_quality_report(df, val_rep)
    return pipeline.get_readiness_verdict(df, qual_rep)


@router.post("/split", response_model=SplitExportInfo)
async def split_dataset(
    target: str = "stress_level",
    export_dir: str = "artifacts/ml_splits",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> SplitExportInfo:
    """
    Splits the dataset, exports physical train/val/test CSV and Parquet files to disk, and returns split stats.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data available to perform splitting."
        )
    return pipeline.write_split_files(df, base_export_dir=export_dir)


@router.post("/export-splits", response_model=SplitExportInfo)
async def export_splits_on_disk(
    target: str = "stress_level",
    export_dir: str = "artifacts/ml_splits",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> SplitExportInfo:
    """
    Splits the dataset and exports physical train/val/test CSV and Parquet files and the manifest.json to disk.
    """
    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data available to perform splitting."
        )
    return pipeline.write_split_files(df, base_export_dir=export_dir)


@router.get("/export")
async def export_dataset(
    target: str = "stress_level",
    fmt: str = "csv",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Streams the clean behavioral telemetry dataset containing engineered features and labels as a file download.
    Supports 'csv' and 'parquet' formats.
    """
    if fmt.lower() not in ["csv", "parquet"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format option. Only 'csv' and 'parquet' are supported."
        )

    pipeline = DatasetPipeline(user_id=current_user.id, db=db, target=target)
    df = await pipeline.get_raw_dataframe()
    
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data found for the authenticated user to export."
        )

    if fmt.lower() == "csv":
        csv_data = pipeline.export_dataset_csv(df)
        return StreamingResponse(
            io.BytesIO(csv_data),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=cogniguard_ml_dataset_{target}_{current_user.id}.csv"}
        )
    else:
        pq_data = pipeline.export_dataset_parquet(df)
        return StreamingResponse(
            io.BytesIO(pq_data),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename=cogniguard_ml_dataset_{target}_{current_user.id}.parquet"}
        )
