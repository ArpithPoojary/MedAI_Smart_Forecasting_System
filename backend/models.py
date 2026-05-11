from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    Date,
    ForeignKey,
    UniqueConstraint,
    DateTime
)

from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# =========================================================
# USER MODEL
# =========================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True, nullable=False)

    email = Column(String, unique=True, index=True, nullable=False)

    hashed_password = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)

    # user | admin
    role = Column(String, default="user")

    created_at = Column(DateTime, default=datetime.utcnow)

    # =====================================================
    # RELATIONSHIPS
    # =====================================================
    sales = relationship(
        "SalesData",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    uploads = relationship(
        "UploadHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    models = relationship(
        "ModelMeta",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# =========================================================
# SALES DATA MODEL
# =========================================================
class SalesData(Base):
    __tablename__ = "sales_data"

    id = Column(Integer, primary_key=True, index=True)

    # =====================================================
    # USER RELATION
    # =====================================================
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    owner = relationship("User", back_populates="sales")

    # =====================================================
    # MEDICINE DETAILS
    # =====================================================
    medicine_name = Column(String, nullable=False, index=True)

    category = Column(String, index=True)

    # =====================================================
    # SALES DETAILS
    # =====================================================
    sales = Column(Float, default=0)

    price = Column(Float, default=0)

    # =====================================================
    # INVENTORY DETAILS
    # =====================================================
    stock = Column(Float, default=0)

    reorder_level = Column(Float, default=30)

    # =====================================================
    # DATE DETAILS
    # =====================================================
    date = Column(Date, nullable=False, index=True)

    expiry_date = Column(Date)

    # =====================================================
    # WEATHER / ML FEATURES
    # =====================================================
    temperature = Column(Float, default=28)

    rainfall = Column(Float, default=0)

    day_of_week = Column(Integer)

    # =====================================================
    # TIMESTAMP
    # =====================================================
    created_at = Column(DateTime, default=datetime.utcnow)

    # =====================================================
    # PREVENT DUPLICATE ENTRIES
    # =====================================================
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "medicine_name",
            "date",
            name="unique_user_medicine_date"
        ),
    )


# =========================================================
# UPLOAD HISTORY MODEL
# =========================================================
class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    filename = Column(String, nullable=False)

    records_count = Column(Integer, default=0)

    upload_time = Column(DateTime, default=datetime.utcnow)

    # processing | success | failed
    status = Column(String, default="processing")

    # =====================================================
    # RELATIONSHIP
    # =====================================================
    user = relationship("User", back_populates="uploads")


# =========================================================
# MODEL META
# =========================================================
class ModelMeta(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # MODEL VERSION
    version = Column(Integer, default=1)

    # MODEL ACCURACY
    accuracy = Column(Float, default=0)

    # MODEL FILE LOCATION
    file_path = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # =====================================================
    # RELATIONSHIP
    # =====================================================
    user = relationship("User", back_populates="models")


# =========================================================
# WEATHER CACHE MODEL
# =========================================================
class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True)

    # cache per day
    date = Column(Date, unique=True, nullable=False, index=True)

    city = Column(String, default="Mangalore")

    temperature = Column(Float, default=28)

    rainfall = Column(Float, default=0)

    condition = Column(String, default="Clear")

    created_at = Column(DateTime, default=datetime.utcnow)