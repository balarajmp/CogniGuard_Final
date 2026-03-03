from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from jose import jwt, JWTError

from app.db.session import get_db
from app.schemas import schemas
from app.models import models
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
router = APIRouter()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    if username == "guest":
        # Return a mock user object representing the guest
        return models.UserProfile(id=0, username="guest", role="guest")
        
    user = db.query(models.UserProfile).filter(models.UserProfile.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/ingest", response_model=schemas.StressHistoryResponse)
def ingest_biometrics(
    data: schemas.BiometricIngest,
    db: Session = Depends(get_db),
    current_user: models.UserProfile = Depends(get_current_user)
):
    """
    Ingest real-time biometric telemetry. Guest users receive calculated responses but data is not saved.
    """
    stress = (data.heart_rate_bpm / 120.0) * 0.4 + data.facial_fatigue_score * 0.4 + (100 / max(data.typing_speed_wpm, 1)) * 0.2
    stress_level = min(max(stress * 100, 0), 100) # Clamp 0-100
    
    if current_user.role == "guest":
        return {
            "id": 0,
            "timestamp": datetime.utcnow(),
            "typing_speed_wpm": data.typing_speed_wpm,
            "heart_rate_bpm": data.heart_rate_bpm,
            "facial_fatigue_score": data.facial_fatigue_score,
            "calculated_stress_level": stress_level
        }

    db_record = models.StressHistory(
        user_id=current_user.id,
        typing_speed_wpm=data.typing_speed_wpm,
        heart_rate_bpm=data.heart_rate_bpm,
        facial_fatigue_score=data.facial_fatigue_score,
        calculated_stress_level=stress_level
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/history", response_model=list[schemas.StressHistoryResponse])
def get_stress_history(
    db: Session = Depends(get_db),
    current_user: models.UserProfile = Depends(get_current_user)
):
    """
    Fetch the user's personal stress trends history.
    """
    if current_user.role == "guest":
        return []
        
    records = db.query(models.StressHistory).filter(
        models.StressHistory.user_id == current_user.id
    ).order_by(models.StressHistory.timestamp.desc()).limit(10).all()
    return records
