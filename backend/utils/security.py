from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
import models

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


# ================= PASSWORD HASHING =================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ================= TOKEN CONFIG =================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ================= CREATE TOKEN =================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ================= DECODE TOKEN =================

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ================= VERIFY TOKEN =================

def verify_token(token: str) -> Optional[dict]:
    return decode_access_token(token)


# ================= GET CURRENT USER =================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:
        user_id = int(user_id)
    except ValueError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user


# ================= ACTIVE USER CHECK =================

def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return current_user


# ================= ADMIN CHECK (🔥 NEW) =================

def get_admin_user(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ================= OPTIONAL HELPERS =================

def get_current_username(
    current_user: models.User = Depends(get_current_user)
) -> str:
    return current_user.username


def get_current_user_id(
    current_user: models.User = Depends(get_current_user)
) -> int:
    return current_user.id