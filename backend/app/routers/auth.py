from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserActivity
from app.schemas.schemas import Token, UserCreate, UserResponse, UserUpdate, LoginRequest
from app.routers.auth_helpers import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_active_user
)

SECRET_KEY = "pypos-secret-key-change-in-production-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def record_activity(db: Session, user: User, action: str, request: Request):
    try:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        db.add(UserActivity(
            user_id=user.id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent
        ))
        db.commit()
    except Exception:
        db.rollback()

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        user = db.query(User).filter(User.username == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.username})
    record_activity(db, user, "login", request)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    record_activity(db, current_user, "logout", request)
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create users")

    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    if user.email:
        db_email = db.query(User).filter(User.email == user.email).first()
        if db_email:
            raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view users")
    return db.query(User).all()

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

@router.post("/change-password")
def change_password(
    old_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Password updated"}