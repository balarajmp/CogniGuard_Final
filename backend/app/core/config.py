from __future__ import annotations
from functools import lru_cache
from typing import Literal
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App ---
    PROJECT_NAME: str = "CogniGuard Sentinel Ecosystem"
    API_V1_STR: str = "/api"
    API_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # --- Security ---
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_DEV_ONLY_DO_NOT_USE_IN_PROD_CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    GUEST_TOKEN_EXPIRE_MINUTES: int = 60              # 1 hour

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./cognitoshield.db"

    # --- CORS ---
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    # --- Burnout Engine Thresholds ---
    STRESS_THRESHOLD_MODERATE: float = 40.0
    STRESS_THRESHOLD_HIGH: float = 65.0
    STRESS_THRESHOLD_CRITICAL: float = 85.0

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_set(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters for security.")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
