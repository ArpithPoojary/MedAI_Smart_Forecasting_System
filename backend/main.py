from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging

# =====================================================
# LOAD ENV
# =====================================================

load_dotenv()

# =====================================================
# LOGGING
# =====================================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

# =====================================================
# IMPORT MODELS FIRST
# =====================================================

import models

# =====================================================
# DATABASE
# =====================================================

from database import Base, engine

# =====================================================
# ROUTES
# =====================================================

from routes import (
    auth,
    upload,
    predict,
    dashboard,
    weather,
    admin,
    upload_history,
    analytics,
)

# =====================================================
# APP LIFECYCLE
# =====================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    try:
        Base.metadata.create_all(
            bind=engine
        )

        logger.info(
            "✅ Database initialized"
        )

    except Exception as e:
        logger.error(
            f"❌ Database error: {e}"
        )

    yield

    logger.info(
        "🛑 Server shutting down..."
    )

# =====================================================
# APP INIT
# =====================================================

app = FastAPI(
    title="Smart Medical Forecasting API",

    description="AI-powered demand forecasting for pharmacy inventory",

    version="1.2.0",

    lifespan=lifespan,
)

# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# =====================================================
# PREFLIGHT
# =====================================================

@app.options("/{full_path:path}")
async def preflight_handler():
    return {"message": "OK"}

# =====================================================
# ROUTES
# =====================================================

# 🔐 AUTH

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

# 📤 UPLOAD

app.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"],
)

# 🤖 PREDICTION

app.include_router(
    predict.router,
    prefix="/predict",
    tags=["Prediction"],
)

# 📊 DASHBOARD

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)

# 🌦 WEATHER

app.include_router(
    weather.router,
    prefix="/weather",
    tags=["Weather"],
)

# 📈 ANALYTICS

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
)

# 📂 UPLOAD HISTORY
# IMPORTANT:
# DO NOT ADD PREFIX AGAIN
# ALREADY EXISTS INSIDE upload_history.py

app.include_router(
    upload_history.router
)

# 👑 ADMIN

app.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"],
)

# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():

    return {
        "message":
            "🚀 Smart Medical Forecasting API is running",

        "version": "1.2.0",

        "status": "success",
    }

# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/health")
def health_check():

    try:
        with engine.connect() as conn:
            conn.exec_driver_sql(
                "SELECT 1"
            )

        return {
            "status": "OK",
            "database": "connected",
        }

    except Exception as e:

        logger.error(
            f"Health check failed: {e}"
        )

        return {
            "status": "ERROR",
            "database": "disconnected",
            "error": str(e),
        }