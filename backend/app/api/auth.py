from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.schemas import schemas
from app.models import models

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.UserProfile).filter(models.UserProfile.username == user_in.username).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = security.get_password_hash(user_in.password)
    new_user = models.UserProfile(
        username=user_in.username,
        hashed_password=hashed_password,
        role=user_in.role or "user",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Supports regular users and admins from the DB.
    """
    user = db.query(models.UserProfile).filter(models.UserProfile.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.username, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": user.role
    }

@router.post("/guest", response_model=schemas.Token)
def login_guest() -> Any:
    """
    Guest Mode endpoint providing a 1-hour temporary session token.
    No credentials required.
    """
    guest_token = security.create_guest_token()
    return {
        "access_token": guest_token,
        "token_type": "bearer",
        "role": "guest"
    }
