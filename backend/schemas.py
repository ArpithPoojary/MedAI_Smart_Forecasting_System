from pydantic import BaseModel, EmailStr, Field, model_validator
from datetime import date
from typing import Optional


# 🔐 ================= AUTH =================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

    # ✅ VALIDATE PASSWORD MATCH
    @model_validator(mode="after")
    def check_password_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    username: str  # can be username OR email
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    role: str

    class Config:
        from_attributes = True


# 🔥 USER INFO (FOR TOKEN)
class UserInfo(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo


class TokenData(BaseModel):
    sub: Optional[str] = None


# 🔥 ================= OTP =================

class EmailSchema(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# 📊 ================= SALES DATA =================

class SalesDataSchema(BaseModel):
    date: date
    medicine_name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)

    sales: float
    price: float
    stock: int

    reorder_level: Optional[int] = 50
    expiry_date: Optional[date] = None

    # ✅ MAKE OPTIONAL (IMPORTANT FIX)
    temperature: Optional[float] = 25.0
    rainfall: Optional[float] = 0.0
    day_of_week: Optional[int] = None

    class Config:
        from_attributes = True


# 🌦️ ================= WEATHER =================

class WeatherResponse(BaseModel):
    temperature: float
    rainfall: float
    condition: str


# 🔮 ================= PREDICTION =================

class PredictionResponse(BaseModel):
    base_prediction: float
    adjustment_factor: float
    final_prediction: float
    weather: dict