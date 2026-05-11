import pandas as pd
import pickle
import os
import time
import logging

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from database import SessionLocal
from models import ModelMeta

logger = logging.getLogger(__name__)

MODEL_DIR = "ml_model"


# ================= VERSION =================
def get_next_version(db, user_id: int):
    latest = db.query(ModelMeta).filter(
        ModelMeta.user_id == user_id
    ).order_by(ModelMeta.version.desc()).first()

    return 1 if not latest else latest.version + 1


def get_model_path(user_id: int, version: int) -> str:
    os.makedirs(MODEL_DIR, exist_ok=True)
    return os.path.join(MODEL_DIR, f"model_{user_id}_v{version}.pkl")


# ================= TRAIN =================
def train_model(df: pd.DataFrame, user_id: int):
    start_time = time.time()
    db = SessionLocal()

    try:
        logger.info(f"🚀 Training started for user {user_id}")

        if "date" not in df.columns:
            logger.error("Missing date column")
            return False

        df["date"] = pd.to_datetime(df["date"], errors="coerce")

        # ===== FEATURE ENGINEERING =====
        df["month"] = df["date"].dt.month
        df["day"] = df["date"].dt.day
        df["day_of_week"] = df["date"].dt.dayofweek

        features = ["month", "day", "temperature", "rainfall", "day_of_week"]
        required_cols = features + ["sales"]

        df = df.dropna(subset=required_cols)

        if len(df) < 30:
            logger.warning("⚠️ Not enough data")
            return False

        X = df[features].apply(pd.to_numeric, errors="coerce")
        y = df["sales"].apply(pd.to_numeric, errors="coerce")

        # ===== TRAIN TEST SPLIT =====
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = RandomForestRegressor(
            n_estimators=120,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )

        model.fit(X_train, y_train)

        # ===== EVALUATION =====
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        mae = round(mae, 2)

        # ===== SAVE =====
        version = get_next_version(db, user_id)
        path = get_model_path(user_id, version)

        with open(path, "wb") as f:
            pickle.dump({
                "model": model,
                "features": features,
                "mae": mae,
                "version": version,
                "rows": len(df)
            }, f)

        db.add(ModelMeta(
            user_id=user_id,
            version=version,
            accuracy=mae,
            file_path=path
        ))

        db.commit()

        logger.info(f"✅ Model v{version} trained (MAE={mae})")
        logger.info(f"⏱ {round(time.time() - start_time, 2)} sec")

        return True

    except Exception as e:
        logger.error(f"❌ Training failed: {str(e)}")
        return False

    finally:
        db.close()


# ================= LOAD =================
def load_model(user_id: int):
    db = SessionLocal()

    try:
        latest = db.query(ModelMeta).filter(
            ModelMeta.user_id == user_id
        ).order_by(ModelMeta.version.desc()).first()

        if not latest:
            return None, None, None

        with open(latest.file_path, "rb") as f:
            data = pickle.load(f)

        return data["model"], data["features"], data.get("mae")

    finally:
        db.close()


# ================= PREDICT =================
def predict(
    month: int,
    day: int,
    temperature: float,
    rainfall: float,
    day_of_week: int,
    user_id: int
):
    try:
        model, features, mae = load_model(user_id)

        # ===== FALLBACK =====
        if model is None:
            # simple fallback logic
            fallback = (temperature * 2) + (10 if rainfall > 0 else 0)
            return round(fallback, 2)

        data = pd.DataFrame(
            [[month, day, temperature, rainfall, day_of_week]],
            columns=features
        )

        data = data.apply(pd.to_numeric, errors="coerce")

        if data.isnull().values.any():
            raise ValueError("Invalid input")

        prediction = model.predict(data)[0]

        return round(float(prediction), 2)

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")

        # fallback safety
        return 50.0