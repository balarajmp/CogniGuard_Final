from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "user"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True

# --- Biometric Data Schemas ---
class BiometricIngest(BaseModel):
    typing_speed_wpm: float = Field(..., description="Typing speed in words per minute")
    heart_rate_bpm: float = Field(..., description="Heart rate in beats per minute")
    facial_fatigue_score: float = Field(..., description="Calculated facial fatigue from 0 to 1")

class StressHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    typing_speed_wpm: float
    heart_rate_bpm: float
    facial_fatigue_score: float
    calculated_stress_level: float
    
    class Config:
        from_attributes = True
