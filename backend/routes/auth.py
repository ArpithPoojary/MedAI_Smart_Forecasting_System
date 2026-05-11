from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta

from database import get_db
import models

from schemas import (
    UserCreate,
    Token,
    EmailSchema,
    OTPVerify,
    ResetPassword
)

from utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_active_user
)

from utils.otp import (
    generate_otp,
    verify_otp,
    is_otp_verified,
    clear_otp
)

from utils.email import send_otp_email

from config import ACCESS_TOKEN_EXPIRE_MINUTES

# =====================================================
# ROUTER
# =====================================================

# IMPORTANT:
# DO NOT ADD prefix="/auth"
# main.py already adds it

router = APIRouter()

# =====================================================
# REGISTER
# =====================================================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:

        # 🔍 Check existing user
        existing_user = db.query(models.User).filter(
            or_(
                models.User.username == user.username.strip(),
                models.User.email == user.email.strip().lower()
            )
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username or Email already exists"
            )

        # 🔐 Create user
        new_user = models.User(
            username=user.username.strip(),
            email=user.email.strip().lower(),
            hashed_password=hash_password(user.password),
            is_active=True,
            role="user"
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("REGISTER ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# LOGIN
# =====================================================

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:

        login_input = form_data.username.strip()

        # 🔍 Username OR Email login
        user = db.query(models.User).filter(
            or_(
                models.User.username == login_input,
                models.User.email == login_input.lower()
            )
        ).first()

        # ❌ User not found
        if not user:
            print("USER NOT FOUND")

            raise HTTPException(
                status_code=400,
                detail="Invalid username/email or password"
            )

        # 🔍 DEBUG LOGS
        print("===================================")
        print("LOGIN INPUT:", login_input)
        print("PASSWORD INPUT:", form_data.password)
        print("DB USERNAME:", user.username)
        print("DB EMAIL:", user.email)
        print("DB HASH:", user.hashed_password)

        # ❌ Invalid password
        valid_password = verify_password(
            form_data.password,
            user.hashed_password
        )

        print("PASSWORD MATCH:", valid_password)
        print("===================================")

        if not valid_password:
            raise HTTPException(
                status_code=400,
                detail="Invalid username/email or password"
            )

        # ❌ Inactive account
        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Inactive account"
            )

        # 🔐 Create JWT token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role or "user"
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("LOGIN ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# SEND OTP
# =====================================================

@router.post("/send-otp")
async def send_otp(
    data: EmailSchema,
    db: Session = Depends(get_db)
):
    try:

        # 🔍 Check email exists
        user = db.query(models.User).filter(
            models.User.email == data.email.strip().lower()
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Email not registered"
            )

        # 🔐 Generate OTP
        otp = generate_otp(data.email)

        print("GENERATED OTP:", otp)

        # 📧 Send Email
        await send_otp_email(
            data.email,
            otp
        )

        return {
            "message": "OTP sent successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("SEND OTP ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# VERIFY OTP
# =====================================================

@router.post("/verify-otp")
def verify_otp_route(
    data: OTPVerify
):
    try:

        valid = verify_otp(
            data.email,
            data.otp
        )

        print("VERIFY OTP:", data.otp)
        print("OTP VALID:", valid)

        if not valid:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP"
            )

        return {
            "message": "OTP verified successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("VERIFY OTP ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# RESET PASSWORD
# =====================================================

@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    try:

        print("RESET EMAIL:", data.email)
        print("NEW PASSWORD:", data.new_password)

        # 🔒 Ensure OTP verified
        if not is_otp_verified(data.email):
            raise HTTPException(
                status_code=400,
                detail="OTP not verified"
            )

        # 🔍 Find user
        user = db.query(models.User).filter(
            models.User.email == data.email.strip().lower()
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # 🔐 HASH PASSWORD
        new_hashed_password = hash_password(
            data.new_password
        )

        print("NEW HASH:", new_hashed_password)

        # 🔐 Save password
        user.hashed_password = new_hashed_password

        db.commit()
        db.refresh(user)

        # 🧪 VERIFY SAVED PASSWORD
        test_verify = verify_password(
            data.new_password,
            user.hashed_password
        )

        print("PASSWORD SAVED CORRECTLY:", test_verify)

        # 🧹 Clear OTP
        clear_otp(data.email)

        return {
            "message": "Password reset successful"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("RESET PASSWORD ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =====================================================
# CURRENT USER
# =====================================================

@router.get("/me")
def get_me(
    current_user: models.User = Depends(
        get_current_active_user
    )
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }