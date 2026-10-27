from datetime import datetime, timedelta
import re
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserActivity, UserSession
from app.schemas.schemas import Token, UserCreate, UserResponse, UserUpdate, LoginRequest
from app.roles import is_master_admin
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

def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def parse_user_agent(user_agent: Optional[str]) -> dict:
    """Turn a raw User-Agent string into a readable device summary."""
    ua = user_agent or ""

    if "Edg/" in ua:
        browser = "Microsoft Edge"
    elif "OPR/" in ua or "Opera" in ua:
        browser = "Opera"
    elif "Chrome/" in ua and "Chromium/" not in ua:
        browser = "Chrome"
    elif "Chromium/" in ua:
        browser = "Chromium"
    elif "Firefox/" in ua:
        browser = "Firefox"
    elif "Safari/" in ua:
        browser = "Safari"
    elif "curl/" in ua.lower():
        browser = "curl"
    else:
        browser = "Unknown browser"

    android_version = re.search(r"Android\s+([0-9.]+)", ua)
    ios_version = re.search(r"(?:iPhone )?OS\s+([0-9_]+)\s+like Mac OS X", ua)

    if "Windows NT 10.0" in ua:
        os_name = "Windows 10/11"
    elif "Windows NT 6.3" in ua:
        os_name = "Windows 8.1"
    elif "Windows NT 6.1" in ua:
        os_name = "Windows 7"
    elif "Windows" in ua:
        os_name = "Windows"
    elif "Android" in ua:
        os_name = f"Android {android_version.group(1)}" if android_version else "Android"
    elif "iPhone" in ua:
        os_name = "iOS"
    elif "iPad" in ua:
        os_name = "iPadOS"
    elif "Mac OS X" in ua:
        os_name = "macOS"
    elif "CrOS" in ua:
        os_name = "ChromeOS"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    if "iPad" in ua or "Tablet" in ua:
        device_type = "Tablet"
    elif "Mobile" in ua or "iPhone" in ua or "Android" in ua:
        device_type = "Mobile"
    else:
        device_type = "Desktop"

    return {
        "device": f"{browser} on {os_name}",
        "browser": browser,
        "os": os_name,
        "device_type": device_type,
    }


def create_login_session(db: Session, user: User, request: Request) -> str:
    session_id = uuid4().hex
    info = parse_user_agent(request.headers.get("user-agent"))
    now = datetime.utcnow()
    db.add(UserSession(
        session_id=session_id,
        user_id=user.id,
        device=info["device"],
        browser=info["browser"],
        os=info["os"],
        device_type=info["device_type"],
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        login_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        is_active=True,
    ))
    db.commit()
    return session_id


def record_activity(db: Session, user: User, action: str, request: Request):
    try:
        db.add(UserActivity(
            user_id=user.id,
            action=action,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent")
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

    session_id = create_login_session(db, user, request)
    access_token = create_access_token(data={"sub": user.username, "sid": session_id})
    record_activity(db, user, "login", request)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    auth_header = request.headers.get("authorization", "")
    token = auth_header[7:] if auth_header.lower().startswith("bearer ") else None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            session_id = payload.get("sid")
            if session_id:
                session = db.query(UserSession).filter(UserSession.session_id == session_id).first()
                if session and session.is_active:
                    session.is_active = False
                    session.logout_at = datetime.utcnow()
                    db.commit()
        except JWTError:
            pass

    record_activity(db, current_user, "logout", request)
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_master_admin(current_user):
        raise HTTPException(status_code=403, detail="Only the master admin can create users")

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
    if not is_master_admin(current_user):
        raise HTTPException(status_code=403, detail="Only the master admin can view users")
    return db.query(User).all()

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_master_admin(current_user):
        raise HTTPException(status_code=403, detail="Only the master admin can update users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user.model_dump(exclude_unset=True)

    new_role = update_data.get("role")
    if db_user.role == "master_admin" and new_role and new_role != "master_admin":
        master_count = db.query(User).filter(User.role == "master_admin").count()
        if master_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last master admin")
    if db_user.id == current_user.id and new_role and new_role != "master_admin":
        raise HTTPException(status_code=400, detail="Cannot change your own master admin role")

    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not is_master_admin(current_user):
        raise HTTPException(status_code=403, detail="Only the master admin can delete users")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    if db_user.role == "master_admin":
        master_count = db.query(User).filter(User.role == "master_admin").count()
        if master_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last master admin")

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