from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=72)  # bcrypt max is 72 bytes
    email: Optional[str] = None
    role: str = "user"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"user", "admin"}
        if v not in allowed:
            raise ValueError(f"Role must be one of {allowed}")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    email: Optional[str]
    role: str
    is_active: bool
    is_guest: bool
    created_at: Optional[datetime] = None
    keyboard_tracking: bool
    heart_rate_telemetry: bool
    facial_fatigue_webcam: bool
    ambient_noise_mapping: bool
    noise_multiplier: float


class UserSettingsUpdate(BaseModel):
    keyboard_tracking: Optional[bool] = None
    heart_rate_telemetry: Optional[bool] = None
    facial_fatigue_webcam: Optional[bool] = None
    ambient_noise_mapping: Optional[bool] = None
    noise_multiplier: Optional[float] = None


class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None

